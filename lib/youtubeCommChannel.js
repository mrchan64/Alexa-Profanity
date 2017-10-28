exports.installWebsocket = function(wssconns, sessions) {
  exports.wssconns = wssconns;
  exports.sessions = sessions;
  if(!exports.heartBeatStarted){
    exports.heartBeatStarted = true;
    exports.heartBeat();
  }
}

exports.lastHeartBeat = 0;
exports.heartBeatInterval = 1000;

exports.logQueueMax = 50;

exports.heartBeat = function() {
  var time = new Date().getTime();
  //if(time-exports.lastHeartBeat<exports.heartBeatInterval)return;
  var msg = {
    'type': 'heartbeat',
    'time': time,
    'struct': []
  }
  Object.keys(exports.sessions).forEach((session) => {
    var queue = [];
    exports.sessions[session].queue.forEach((ref) => {
      queue.push({
        queued: ref.queued,
        title: ref.title,
        id: ref.id,
        clean: ref.clean
      })
    })
    var data = {
      session: session,
      queue: queue,
      position: exports.sessions[session].position,
      paused: exports.sessions[session].paused
    }
    msg.struct.push(data);
  })
  exports.wssconns.write(msg);
  setTimeout(exports.heartBeat, exports.heartBeatInterval)
}

exports.logQueue = [];
exports.logQueue.add = function(struct) {
  exports.logQueue.push(struct);
  while(exports.logQueue.length>exports.logQueueMax){
    exports.logQueue.shift();
  }
}

var print = console.log;

exports.consolelog = function(str) {
  var time = new Date().getTime();
  var msg = {
    'type': 'consolelog',
    'time': time,
    'log': str
  }
  exports.logQueue.add(msg);
  print(str)
  exports.wssconns.write(msg);
}
exports.consolewarn = function(str) {
  var time = new Date().getTime();
  var msg = {
    'type': 'consolewarn',
    'time': time,
    'log': str
  }
  exports.logQueue.add(msg);
  print(str)
  exports.wssconns.write(msg);
}
exports.consoleerror = function(str) {
  var time = new Date().getTime();
  var msg = {
    'type': 'consoleerror',
    'time': time,
    'log': str
  }
  exports.logQueue.add(msg);
  print(str)
  exports.wssconns.write(msg);
}

exports.sendQueueSince = function(time, callback) {
  for(var i = 0; i<exports.logQueue.length; i++){
    if(exports.logQueue[i].time<time)continue;
    callback(JSON.stringify(exports.logQueue[i]));
  }
}

console.log = exports.consolelog;
console.warn = exports.consolewarn;
console.error = exports.consoleerror;
console.fillGap = exports.sendQueueSince;