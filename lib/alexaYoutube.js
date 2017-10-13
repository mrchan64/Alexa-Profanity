var alexa = require('alexa-app');

exports.app = new alexa.app("youtube");

exports.app.intent("GetVideoIntent", {
    "slots": {},
    "utterances": ["search"]
  }, function(req, res){
    res.say("hoooolaaaaa")
  }
)

exports.preDebug = function(req, res){
  if(exports.debug)console.log("YT Mod | "+req.protocol+" | "+req.method+" | "+req.url);
}

exports.installExpress = function(app, endpoint){
  exports.loadConfig();
  exports.app.express({
    expressApp: app,
    endpoint: endpoint,
    preRequest: exports.preDebug
  });
}

exports.loadConfig = function(){
  try{
    delete require.cache[require.resolve('../YTConfig.json')];
    var config = require('../YTonfig.json')
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