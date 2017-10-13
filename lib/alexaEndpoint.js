var alexa = require('alexa-app');

exports.app = new alexa.app("profanity");

exports.app.intent("GetVideoIntent", {
    "slots": {},
    "utterances": ["search"]
  }, function(req, res){
    res.say("hoooolaaaaa")
  }
)

exports.preDebug = function(req, res){
  console.log("request made")
  console.log(req.body)
}

exports.installExpress = function(app, endpoint){
  exports.app.express({
    expressApp: app,
    endpoint: endpoint,
    preRequest: exports.preDebug
  });
}