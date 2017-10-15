var alexa = require('alexa-app'),
    https = require('https'),
    ytdl  = require('ytdl-core'),
    fs    = require('fs'),
    mq    = require('./mediaQueue'),
    ytc   = require('./youtubeCommands');


exports.app = new alexa.app("youtube");
exports.sessions = {};

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
    var command = ytc.process(req.slot("command"));
    var session = encodeURI(req.getSession().sessionId);
    switch(command.command){
      case 'video':
        return exports.startVideoQueue(res, command.query, session);
        break;
      case 'playlist':
        //dosomething
        res.say("I'm sorry, Matthew is stupid and hasn't implemented playlist functionality yet");
        break;
      default:
        console.log("Command | "+req.slot("command")+" | Not Found");
        res.say("I'm sorry, Youtube does not understand this command");
    }
  });

exports.app.audioPlayer("PlaybackStarted", exports.loadQueue);
exports.app.audioPlayer("PlaybackFinished", exports.loadQueue);
exports.app.audioPlayer("PlaybackNearlyFinished", exports.loadQueue);
exports.app.playbackController("NextCommandIssued", exports.loadQueue);
exports.app.playbackController("PauseCommandIssued", exports.loadQueue);
exports.app.playbackController("PlayCommandIssued", exports.loadQueue);

exports.startVideoQueue = function(res, query, session){
  var vidqueue = mq.create(session, {
    YTKey: exports.YTKey
  });
  exports.sessions[session] = {vidqueue};
  vidqueue.installEndpoint(exports.expressapp);
  return vidqueue.initialSearch(res, query);
}

exports.loadQueue = function(req, res){
  var session = encodeURI(req.getSession().sessionId);
  exports.sessions[session].mq.checkQueue(res);
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
  //console.log(req.request)
  //console.log(req.request.intent)
  if(exports.debug)console.log("YT Mod");
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