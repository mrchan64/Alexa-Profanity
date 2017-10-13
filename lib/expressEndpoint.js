var express = require('express'),
    http    = require('http');

exports.port = process.env.PORT || 3000;
exports.app = express();
exports.server = http.createServer(exports.app);

exports.app.get('/', function(req, res) {
  console.log('endpoint hit')
  res.send("helo frend");
});

exports.server.listen(exports.port);