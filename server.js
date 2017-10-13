var EXE = require('./lib/expressEndpoint'),
    AXE = require('./lib/alexaEndpoint'),
    YTA = require('./lib/alexaYoutube');

AXE.installExpress(EXE.app, 'profanity');
YTA.installExpress(EXE.app, 'youtube');
