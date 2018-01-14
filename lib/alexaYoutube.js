var alexa = require('alexa-app'),
    https = require('https'),
    ytdl  = require('ytdl-core'),
    fs    = require('fs'),
    mq    = require('./mediaQueue'),
    vo    = require('./videoOnce'),
    ycc   = require('./youtubeCommChannel'),
    ytc   = require('./youtubeCommands');


exports.app = new alexa.app("youtube");
exports.sessions = {};
exports.keyStore = {};
exports.host = process.env.PORT ? "https://alexa-profanity.herokuapp.com" : "https://37ff1e5f.ngrok.io";

exports.playNext = function(req, res){
  var session = exports.getSessionId(req);
  if(!exports.sessions[session]){
    res.say("You do not have a queue yet");
    return;
  }
  exports.sessions[session].playNext(res);
}
exports.playPrevious = function(req, res){
  var session = exports.getSessionId(req);
  if(!exports.sessions[session]){
    res.say("You do not have a queue yet");
    return;
  }
  exports.sessions[session].playPrevious(res);
}
exports.pause = function(req, res){
  var session = exports.getSessionId(req);
  if(!exports.sessions[session])return;
  exports.sessions[session].pauseAudio(req, res);
}
exports.play = function(req, res){
  var session = exports.getSessionId(req);
  if(!exports.sessions[session]){
    res.say("You do not have a queue yet");
    return;
  }
  exports.sessions[session].playAudio(res);
}
exports.queueNext = function(req, res){
  var session = exports.getSessionId(req);
  exports.sessions[session].queueNext(res);
}
exports.playFinished = function(req, res){
  var session = exports.getSessionId(req);
  exports.sessions[session].currentFinished();
}


exports.app.intent("AMAZON.PauseIntent", {
    "slots": {},
    "utterances": []
  }, exports.pause);

exports.app.intent("AMAZON.ResumeIntent", {
    "slots": {},
    "utterances": []
  }, exports.play);

exports.app.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
  }, function(req, res){
    var session = exports.getSessionId(req);
    delete exports.sessions[session];
  });

exports.app.intent("AMAZON.NextIntent", {
    "slots": {},
    "utterances": []
  }, exports.playNext);

exports.app.intent("AMAZON.PreviousIntent", {
    "slots": {},
    "utterances": []
  }, exports.playPrevious);

exports.app.intent("CommandIntent", {
    "slots": {"command": "LITERAL" },
    "utterances": [""]
  }, function(req, res){
    console.log('Received Command: '+req.slot("command"));
    var command = ytc.process(req.slot("command"));
    var session = exports.getSessionId(req);
    switch(command.command){
      case 'playvideo':
        return exports.playVideoOnce(res, command.query, session);
        break;
      case 'video':
        return exports.startVideoQueue(res, command.query, session);
        break;
      case 'playlist':
        //dosomething
        res.say("I'm sorry, Matthew is stupid and hasn't implemented playlist functionality yet");
        break;
      case 'load':
        return exports.loadKeyQueue(res, command.query, session);
        break;
      default:
        console.log("Command | "+req.slot("command")+" | Not Found");
        res.say("I'm sorry, Youtube does not understand this command");
    }
  });

// exports.app.audioPlayer("PlaybackStarted", exports.loadQueue);
exports.app.audioPlayer("PlaybackNearlyFinished", exports.queueNext);
exports.app.audioPlayer("PlaybackFinished", exports.playFinished);
//exports.app.audioPlayer("PlaybackStopped", exports.pause);
exports.app.playbackController("NextCommandIssued", exports.playNext);
exports.app.playbackController("PreviousCommandIssued", exports.playPrevious);
exports.app.playbackController("PauseCommandIssued", exports.pause);
exports.app.playbackController("PlayCommandIssued", exports.play);

exports.startVideoQueue = function(res, query, session){
  var vidqueue = mq.create(session, {
    YTKey: exports.YTKey,
    host: exports.host
  });
  exports.sessions[session] = vidqueue;
  return vidqueue.initialSearch(res, query);
}

exports.playVideoOnce = function(res, query, session){
  var vidonce = vo.create(session, {
    YTKey: exports.YTKey,
    host: exports.host
  });
  exports.sessions[session] = vidonce;
  return vidonce.initialSearch(res, query);
}

exports.loadKeyQueue = function(res, query, session){
  var vidqueue = mq.create(session, {
    YTKey: exports.YTKey,
    host: exports.host
  });
  exports.sessions[session] = vidqueue;
  var keyInfo = exports.keyStore[query];
  if(!keyInfo){
    res.say("I'm sorry, Youtube could not find this key.");
    return;
  }
  if(keyInfo.type == 'video'){
    return vidqueue.initialKey(res, keyInfo);
  }else{
    //playlist
  }
}

exports.osw = ['cat', 'dog', 'rip', 'ram', 'win', 'bat', 'fun', 'bet', 'lag', 'mom'];
exports.oswcount = 0;
exports.createKey = function(link){
  var videoid = link.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)
  //do playlist keys
  /*var playlistid = link.match(
    /
    (?:https?:\/{2})? // Optional protocol, if have, must be http:// or https://
    (?:w{3}\.)?      // Optional sub-domain, if have, must be www.
    youtu(?:be)?  // The domain. Match 'youtu' and optionally 'be'. 
    \.(?:com|be) // the domain-extension must be .com or .be
    (?:\/playlist\?list=|\/)([^\s&]+) //match the value of 'v' parameter in querystring from 'watch' directory OR after root directory, any non-space value.
    /
  )*/
  if(videoid == null)return;
  ytdl.getInfo(videoid[1], (err, info) => {
    if(!err){
      var keyInfo = {
        'id': videoid[1],
        'link': link,
        'title': info.title,
        'type': 'video',
        'expiration': new Date().getTime()+300000
      };
      var key = exports.osw[exports.oswcount];
      exports.oswcount++;
      exports.keyStore[key] = keyInfo;
    }
  })
}
exports.checkKeys = function(){
  var time = new Date().getTime();
  Object.keys(exports.keyStore).forEach((key)=>{
    if(exports.keyStore[key].expiration<=time)delete exports.keyStore[key];
  });
  setTimeout(exports.checkKeys, 1000);
}
exports.checkKeys();

exports.loadQueue = function(req, res){
  //deprecated
  /*
  var session = encodeURI(req.getSession().sessionId);
  exports.sessions[session].checkQueue(res);
  */
}

exports.preDebug = function(req, res){
  var session = exports.getSessionId(req);
  session = session.substring(session.length-10);
  if(req.request && req.request.intent)var request = req.request.intent.name;
  else if(req.request)var request = req.request.type;
  console.log("YT Mod | "+session+" | "+request);
  if(request == 'System.ExceptionEncountered' || request == 'SessionEndedRequest')console.error(req);
}

exports.installExpress = function(app, endpoint, commsocket){
  exports.loadConfig();
  exports.expressapp = app;
  exports.app.express({
    expressApp: app,
    endpoint: endpoint,
    preRequest: exports.preDebug
  });
  exports.commsocket = commsocket;
  app.get('/ytfile/:session/:key.mp3', function(req, res){
    var session = req.params.session;
    if(exports.sessions[session]){
      exports.sessions[session].index(req, res);
    }else{
      console.error("Error: Endpoint not found, requested session: "+session);
    }
  });
  app.get('/ytfile/:session/AA.mp4', function(req, res){
    var session = req.params.session;
    if(exports.sessions[session]){
      exports.sessions[session].index(req, res);
    }else{
      console.error("Error: Endpoint not found, requested session: "+session);
    }
  });
  app.ka = function(){
    var time = new Date().getTime();
    var death = true;
    Object.keys(exports.sessions).forEach((session)=>{
      death = death && time > exports.sessions[session].death;
    });
    return !death;
  }
  commsocket.createKey = exports.createKey;
  ycc.installWebsocket(commsocket, exports.sessions, exports.keyStore);
}

exports.loadConfig = function(){
  try{
    delete require.cache[require.resolve('../YTConfig.json')];
    var config = require('../YTConfig.json')
  }catch(e){
    var config = {};
    console.warn("ALERT: No Config File Found, Probably Due to Heroku")
  }
  exports.YTKey = config.YTKey || process.env.YTKey;
  exports.debug = config.debug || false;
  if(!exports.YTKey){
    console.error("ERROR: No Environment Key Loaded")
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

exports.getSessionId = function(req){
  try{
    var session = req.context.System.device.deviceId.split('.');
    session = session[session.length-1];
  }catch(e){}
  return session || 'tester';
}