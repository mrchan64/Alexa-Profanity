var express = require('express'),
    path    = require('path'),
    ws      = require('ws'),
    jquery  = require('jquery')
    http    = require('http');

exports.port = process.env.PORT || 3000;
exports.app = express();
exports.app.use('/js', express.static(path.join(__dirname, '../public/js')));
exports.app.use('/images', express.static(path.join(__dirname, '../public/images')));
exports.app.use('/css', express.static(path.join(__dirname, '../public/css')));
exports.app.set('views', path.join(__dirname, '../public/views'));

exports.app.get('/', function(req, res) {
  res.send("helo frend");
});
exports.app.get('/ytstatus', function(req, res) {
  res.render(path.join(__dirname, '../public/views/index.jade'));
});
exports.app.get('/ytstatus/keepalive', function(req, res) {
  var keepAliveInterval = 300000;
  var host = "http://alexa-profanity.herokuapp.com/ytstatus/keepalive";
  if(exports.kai)clearInterval(exports.kai);
  exports.kai = setInterval(()=>{
    if(exports.app.ka()){
      http.get(host);
      console.log("Stayin' alive, stayin' alive. Woo! Woo! Woo! Woo! Stayin' alive...")
    }
  }, keepAliveInterval);
  res.end();
})
exports.app.get('/js/jquery.min.js', function(req, res) {
  res.sendFile(path.join(__dirname, '../node_modules/jquery/dist/jquery.min.js'));
});
exports.app.get('/js/jquery-ui.min.js', function(req, res) {
  res.sendFile(path.join(__dirname, '../node_modules/jquery-ui-dist/jquery-ui.min.js'));
});

exports.server = http.createServer(exports.app);
exports.wss = new ws.Server({server: exports.server, path: '/ytstatus/info'});

exports.wssconns = [];
exports.wss.on('connection', function(client) {
  var addr = client._socket.remoteAddress;
  console.warn('Connection from '+addr+ ' opened');
  exports.wssconns.push(client);
  client.on('message', function(msg){
    msg = JSON.parse(msg);
    if(msg.type=='fillgap'){
      console.fillGap(msg.time, client.send.bind(client));
    }else if(msg.type=='key'){
      exports.wssconns.createKey(msg.link);
    }
  })
  client.on('close', function(){
    exports.wssconns.splice(exports.wssconns.indexOf(client), 1);
    console.warn('Connection from '+addr+ ' closed');
  })
});

exports.wssconns.write = function(data){
  exports.wssconns.forEach(function(conn){
    conn.send(JSON.stringify(data));
  })
}

exports.server.listen(exports.port);

http.get("http://alexa-profanity.herokuapp.com/ytstatus/keepalive");