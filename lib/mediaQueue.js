var https = require('https'),
    ytdl  = require('ytdl-core');

var MediaQueue = function(name, config) {

  name = name || "default";
  config = this.config = config || {};
  this.previousLimit = config.previousLimit || 50;
  this.nextLimit = config.nextLimit || 5;
  this.gapLimit = config.gapLimit || 30;
  this.YTKey = config.YTKey || "";
  var queue = this.queue = [];
  this.queue.keys = {};
  this.position = undefined;
  this.host = "https://ab27e023.ngrok.io";
  this.path = '/ytfile/'+name;
  this.name = name;
  this.gen = 0;
  this.queue.findTitle = (title) => {
    var res = -1;
    for(var i = 0; i<queue.length; i++){
      if(queue[i].title==title)res=i;
    }
    return res;
  }
  this.queue.log = () => {
    console.log("MediaQueue | "+name+" | "+queue.length);
    var position = this.position;
    queue.forEach(function(element){
      var pointer = position==element.index() ? ">" : "";
      var queued = element.queued ? "q" : "x";
      console.log(pointer+"\t"+element.index()+" | "+queued+" | "+element.attr+".mp3 | "+element.title+" | "+element.data.length);
    })
  }

}

/**
 * declare using 
 *   new mq({YTKey: exports.YTKey});
 * setup mediaendpoint using 
 *   mq.installEndpoint(expressapp);
 * start queue with first video using
 *   mq.searchVideo(result)
 */

MediaQueue.prototype.add = function(video){
  var videoId = video.id;
  var mq = this;
  var options = {
    filter: (format) => {return format.container === 'm4a'}
  };
  var stream = ytdl('http://www.youtube.com/watch?v='+videoId, options);
  console.log("Streaming | Starting Stream | "+videoId);
  var ref = {
    index: ()=>{return mq.queue.indexOf(ref)},
    attr: this.generateKey(),
    data: Buffer(0),
    stream: stream,
    loading: true,
    queued: false,
    title: video.title,
    id: video.id,
    clean: video.clean
  }
  mq.queue.push(ref);
  mq.queue.keys[ref.attr] = ref;
  stream.on('data', function(chunk){
    ref.data = Buffer.concat([ref.data, chunk]);
  });
  stream.on('end', function(){
    ref.loading = false;
  })
  return ref;
}

MediaQueue.prototype.addFirst = function(res, video){
  var queue = this.queue;
  var url = this.host+this.path;
  var ref = this.add(video);
  var stream = {
    url: url+'/'+ref.attr+'.mp3',
    token: generateToken(),
    offsetInMilliseconds: 0
  }
  res.audioPlayerPlayStream("REPLACE_ALL", stream);
  queue[0].queued = true;
}

MediaQueue.prototype.loadQueue = function(){
  this.queue.log();
  if(this.position>=this.queue.length-this.nextLimit){
    var mq = this;
    this.getRelated().then(function(result){
      mq.add(result);
      mq.loadQueue();
    })
  }
}

MediaQueue.prototype.getRelated = function(){
  var ref = this.queue[this.queue.length-1];
  var queue = this.queue;
  var mq = this;
  var params = {
    'key': this.YTKey,
    'maxResults': 25,
    'part': 'snippet',
    'type': 'video',
    'relatedToVideoId': ref.id
  }
  var addon = '';
  Object.keys(params).forEach(function(key){
    if(addon.length!=0)addon+='&'
    addon+=key+'='+params[key];
  })
  var options = {
    "host": "www.googleapis.com",
    "path": '/youtube/v3/search?'+addon,
    "method": 'GET'
  }
  var related = new Promise(function(resolve, reject){
    var req = https.request(options, function(resp){
      var total = "";
      resp.on('data', function(chunk){
        total+=chunk;
      });
      resp.on('end', function(){
        var data = JSON.parse(total);
        var result = {};
        while(true){
          var i = Math.floor(Math.random()*data.items.length);
          if(data.items[i].id.kind.indexOf('video')!==-1){
            result.id = data.items[i].id.playlistId || data.items[i].id.videoId;
            result.title = data.items[i].snippet.title;
            result.clean = sanitize(result.title);
            var lastInd = queue.findTitle(result.title);
            if(lastInd==-1 || lastInd>mq.gapLimit || i+1==data.items.length){
              break;
            }
          }
        }
        resolve(result);
      });
    });
    req.on('error', function(err){
      console.log(err);
      reject("nada")
    });
    req.end();
  })
  return related;
}

MediaQueue.prototype.searchVideo = function(res, query){
  var queue = this.queue;
  var mq = this;
  var params = {
    'key': this.YTKey,
    'maxResults': 10,
    'part': 'snippet',
    'type': 'video',
    'q': encodeURI(query)
  }
  var addon = '';
  Object.keys(params).forEach(function(key){
    if(addon.length!=0)addon+='&'
    addon+=key+'='+params[key];
  })
  var options = {
    "host": "www.googleapis.com",
    "path": '/youtube/v3/search?'+addon,
    "method": 'GET'
  }
  console.log(options.host+options.path)
  var prom = new Promise(function(resolve, reject){
    var req = https.request(options, function(resp){
      var total = "";
      resp.on('data', function(chunk){
        total+=chunk;
      });
      resp.on('end', function(){
        var data = JSON.parse(total);
        var result = {};
        for(var i = 0; i<data.items.length; i++){
          if(data.items[i].id.kind.indexOf('video')!==-1){
            result.id = data.items[i].id.playlistId || data.items[i].id.videoId;
            result.title = data.items[i].snippet.title;
            result.clean = sanitize(result.title);
            break;
          }
        }
        resolve(result);
      });
    });
    req.on('error', function(err){
      console.log(err);
      reject();
    });
    req.end();
  });
  return prom;
}

/* Alexa Skills Referrals */
MediaQueue.prototype.initialSearch = function(res, query){
  var mq = this;
  return mq.searchVideo(res, query).then(function(result){
    mq.addFirst(res, result);
  })
}

MediaQueue.prototype.checkQueue = function(res){
  var url = this.host+this.path;
  var counter = 0;
  for(var i = 0; i<this.queue.length; i++){
    if(this.queue[i].queued)continue;
    if(this.queue[i].loading)break;
    var stream = {
      url: url+'/'+this.queue[i].attr+'.mp3',
      token: generateToken(),
      offsetInMilliseconds: 0
    }
    res.audioPlayerPlayStream("ENQUEUE", stream);
    this.queue[i].queued = true;
    counter++;
  }
  console.log("CheckQueue | Loaded "+counter);
  this.queue.log();
}

MediaQueue.prototype.installEndpoint = function(app){
  app.get(this.path+'/:key.mp3', this.index.bind(this));
}

MediaQueue.prototype.index = function(req, res){
  var attr = req.params.key;
  var ref = this.queue.keys[attr];
  if(!ref){
    res.writeHead(400);
    res.end();
    console.log("GET | "+attr+".mp3 | DNE");
    return;
  }
  console.log("GET | "+attr+".mp3 | "+ref.data.length);
  this.position = ref.index();
  while(this.position>=this.previousLimit){
    var temp = this.queue.shift();
    delete this.queue.keys[temp.attr];
    this.position = ref.index();
  }
  this.loadQueue();
  res.write(ref.data);
  if(!ref.loaded)ref.stream.pipe(res);
  else res.end();
}

exports.create = createApplication;

function createApplication(name, config) {
  var app = new MediaQueue(name, config)
  return app;
}

MediaQueue.prototype.generateKey = function(){
  var part1 = Math.floor(this.gen/26)+65;
  var part2 = (this.gen%26)+65;
  this.gen = (this.gen+1)%(26*26);
  var code = String.fromCharCode(part1)+String.fromCharCode(part2);
  console.log("CodeGen | "+code+" | "+part1+" | "+part2);
  return code;
}

function generateToken(){
  var result = {previous: this.previousToken || undefined};
  this.previousToken = sanitize(encodeURI(new Date().toTimeString()));
  result.token = this.previousToken;
  return result.token;
}

function sanitize(dirty){
  var cleaned = "";
  for(var i = 0; i<dirty.length; i++){
    var code = dirty.charCodeAt(i);
    if(48<=code && code<=57)cleaned+=dirty[i];
    else if(65<=code && code<=90)cleaned+=dirty[i];
    else if(97<=code && code<=122)cleaned+=dirty[i];
    else if(32==code)cleaned+=dirty[i];
  }
  return cleaned;
}