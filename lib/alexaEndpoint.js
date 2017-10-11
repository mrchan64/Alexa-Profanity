var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback){
	var alexa = Alexa.handler(event, context, callback);
}

var handlers = {
	'GetVideoIntent': function() {
		this.emit(':tell', 'Getting Video')
	}
}