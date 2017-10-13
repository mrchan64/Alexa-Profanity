var EXE = require('./lib/expressEndpoint'),
    AXE = require('./lib/alexaEndpoint');

AXE.installExpress(EXE.app, 'profanity');
