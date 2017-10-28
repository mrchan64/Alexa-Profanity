var https = require('https'),
    ytdl  = require('ytdl-core');

function VideoOnce(name, config){
  name = name || "default";
  this.YTKey = config.YTKey || "";
  this.host = config.host || "";
  this.path = '/ytfile/'+name;
  this.name = name;
}

VideoOnce.prototype.add = function(video){
  var videoId = video.id;
  var ref = {
    attr: 'AA',
    loading: true,
    title: video.title,
    id: video.id,
    clean: video.clean
  }
  this.result = ref;
  return ref;
}

VideoOnce.prototype.addFirst = function(res, video){
  var url = this.host+this.path;
  var ref = this.add(video);
  var directive = {
    type: 'VideoApp.Launch',
    videoItem: {
      source: url+'/'+ref.attr+'.mp4',
      metadata: {
        title: ref.title
      }
    }
  }
  res.directive(directive)
  delete res.response.response.shouldEndSession;
}

VideoOnce.prototype.searchVideo = function(res, query){
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
      console.error(err);
      reject();
    });
    req.end();
  });
  return prom;
}

VideoOnce.prototype.initialSearch = function(res, query){
  var mq = this;
  return mq.searchVideo(res, query).then(function(result){
    mq.addFirst(res, result);
  })
}

VideoOnce.prototype.index = function(req, res){
  var ref = this.result;
  console.log("GET | AA.mp4 | "+0);
  var stream = ytdl('http://www.youtube.com/watch?v='+ref.id);
  stream.pipe(res);
}

exports.create = createApplication;

function createApplication(name, config) {
  var app = new VideoOnce(name, config)
  return app;
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