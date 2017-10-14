var alexa = require('alexa-app'),
    https = require('https'),
    ytdl  = require('ytdl-core'),
    fs    = require('fs'),
    mq    = require('./mediaQueue');


exports.app = new alexa.app("youtube");

exports.app.intent("AMAZON.PauseIntent", {
    "slots": {},
    "utterances": []
  }, function(req, res){
    console.log("Paused");
  });

exports.app.intent("AMAZON.ResumeIntent", {
    "slots": {},
    "utterances": []
  }, function(req, res){
    console.log("Resumed");
  });

exports.app.intent("AMAZON.NextIntent", {
    "slots": {},
    "utterances": []
  }, function(req, res){
    console.log("skipping")
  });

exports.app.intent("CommandIntent", {
    "slots": {"command": "LITERAL" },
    "utterances": [""]
  }, function(req, res){
    var command = req.slot("command");
    var session = encodeURI(req.getSession().sessionId);
    console.log(encodeURI(req.getSession().sessionId));
    console.log(command);
    /*var query = req.slot('query');
    if(query.substring(0,4)=="for ")query=query.substring(4);
    return exports.startVideoQueue(res, query);*/
  });

exports.processCommand = function(command){
  
}

exports.startVideoQueue = function(res, query, session){
  var vidqueue = mq.create("test", {
    YTKey: exports.YTKey
  });
  vidqueue.installEndpoint(exports.expressapp);
  return vidqueue.initialSearch(res, query);
}
/*
exports.searchByKeywords = function(type, query){
  // type can be 'video' or 'playlist'
  var params = {
    'key': exports.YTKey,
    'maxResults': 10,
    'part': 'snippet',
    'type': type,
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
          if(data.items[i].id.kind.indexOf(type)!==-1){
            result.id = data.items[i].id.playlistId || data.items[i].id.videoId;
            result.title = data.items[i].snippet.title;
            result.clean = exports.sanitize(result.title);
            break;
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
  });
  return prom;
}*/

exports.preDebug = function(req, res){
  if(exports.debug)console.log("YT Mod | "+req.protocol+" | "+req.method+" | "+req.url);
}

exports.installExpress = function(app, endpoint){
  exports.loadConfig();
  exports.expressapp = app;
  exports.app.express({
    expressApp: app,
    endpoint: endpoint,
    preRequest: exports.preDebug
  });
}

exports.loadConfig = function(){
  try{
    delete require.cache[require.resolve('../YTConfig.json')];
    var config = require('../YTConfig.json')
  }catch(e){
    var config = {};
    console.log("ALERT: No Config File Found, Probably Due to Heroku")
  }
  exports.YTKey = config.YTKey || process.env.YTKey;
  exports.debug = config.debug || false;
  if(!exports.YTKey){
    console.log("ERROR: No Environment Key Loaded")
    process.exit();
  }
}

exports.sanitize = function(dirty){
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