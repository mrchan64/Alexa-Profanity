var logger = {};
logger.el = $('#messagecont');
logger.el2 = $('#compactviewer');
logger.uptime = {};
logger.uptime.el = $('#uptime');

logger.protocol = window.location.protocol=='http:' ? 'ws:' : 'wss:';
logger.link = logger.protocol+'//'+window.location.host+"/ytstatus/info";
logger.comm = new WebSocket(logger.link);

logger.comm.onopen = function(event){
  logger.comm.send(JSON.stringify({
    'type':'fillgap',
    'time': logger.reconnect.lastDisconnect
  }));
  logger.reconnect.el.html('Successfully reconnected!');
  logger.reconnect.el.css({
    'background-color': 'rgba(0, 150, 0, .5)'
  })
  logger.reconnect.el.animate({
    'opacity': 0
  },3000);
  logger.reconnect.attempting = false;
}

logger.comm.onclose = function(event){
  if(!logger.reconnect.attempting){
    logger.reconnect.attempting = true;
    logger.reconnect.lastDisconnect = new Date();
    logger.reconnect.interval = 4;
  }
  logger.reconnect.try();
}

logger.reconnect = {};
logger.reconnect.el = $('#disconnect');
logger.reconnect.lastDisconnect = 0;
logger.reconnect.attempting = false;
logger.reconnect.interval = 4;
logger.reconnect.counter = 0;

logger.reconnect.try = function() {
  logger.reconnect.el.stop();
  logger.reconnect.el.css({
    'background-color': 'rgba(255, 0, 0, .5)',
    'opacity': 1
  });
  var time = logger.reconnect.lastDisconnect;
  if(logger.reconnect.counter == 0){
    if(logger.reconnect.interval<10){
      logger.reconnect.interval+=1;
    }else if(logger.reconnect.interval<1800000){
      logger.reconnect.interval*=2;
    }
  }
  var diff = logger.reconnect.interval-logger.reconnect.counter;
  (String(time.getMinutes()).length<2?'0':'')
  if(diff>0){
    logger.reconnect.el.html('Disconnected from '+logger.link+' at '+time.getHours()%12+':'+(String(time.getMinutes()).length<2?'0':'')+time.getMinutes()+':'+(String(time.getSeconds()).length<2?'0':'')+time.getSeconds()+(Math.floor(time.getHours()/12)?' pm':' am')+' on '+(time.getMonth()+1)+'/'+time.getDate()+'/'+time.getFullYear()+'. Attempting to reconnect in '+(diff<60?(diff+' seconds.'):(Math.floor(diff/60)+' minutes.')))
    logger.reconnect.counter++;
    setTimeout(logger.reconnect.try, 1000);
  }else{
    var comm = new WebSocket(logger.link);
    comm.onopen = logger.comm.onopen;
    comm.onclose = logger.comm.onclose;
    comm.onmessage = logger.comm.onmessage;
    logger.comm = comm;
    logger.reconnect.el.html('Disconnected from '+logger.link+' at '+time.getHours()%12+':'+(String(time.getMinutes()).length<2?'0':'')+time.getMinutes()+':'+(String(time.getSeconds()).length<2?'0':'')+time.getSeconds()+(Math.floor(time.getHours()/12)?' pm':' am')+' on '+(time.getMonth()+1)+'/'+time.getDate()+'/'+time.getFullYear()+'. Attempting to reconnect...')
    logger.reconnect.counter = 0;
  }
}

logger.log = function(struct){
  var msgbox = $('<div/>');
  msgbox.addClass('message');
  msgbox.addClass('log');
  var date = $('<p/>');
  date.addClass('date');
  date.html(new Date(struct.time));
  var text = $('<p/>');
  text.addClass('text');
  text.html(struct.log);
  msgbox.append(date);
  msgbox.append(text);
  logger.el.append(msgbox);
  var cmdbox = $('<p/>');
  cmdbox.html('<span class="date">[ '+new Date(struct.time).toJSON()+' ]:</span> '+struct.log);
  logger.el2.append(cmdbox);
  logger.updateHeight(cmdbox);
  logger.updateHeight(msgbox,true);
}
logger.warn = function(struct){
  var msgbox = $('<div/>');
  msgbox.addClass('message');
  msgbox.addClass('warn');
  var date = $('<p/>');
  date.addClass('date');
  date.html(new Date(struct.time));
  var text = $('<p/>');
  text.addClass('text');
  text.html(struct.log);
  msgbox.append(date);
  msgbox.append(text);
  logger.el.append(msgbox);
  var cmdbox = $('<p/>');
  cmdbox.addClass('warn');
  cmdbox.html('<span class="date">[ '+new Date(struct.time).toJSON()+' ]:</span> '+struct.log);
  logger.el2.append(cmdbox);
  logger.updateHeight(cmdbox);
  logger.updateHeight(msgbox,true);
}
logger.error = function(struct){
  var msgbox = $('<div/>');
  msgbox.addClass('message');
  msgbox.addClass('error');
  var date = $('<p/>');
  date.addClass('date');
  date.html(new Date(struct.time));
  var text = $('<p/>');
  text.addClass('text');
  text.html(struct.log);
  msgbox.append(date);
  msgbox.append(text);
  logger.el.append(msgbox);
  var cmdbox = $('<p/>');
  cmdbox.addClass('error');
  cmdbox.html('<span class="date">[ '+new Date(struct.time).toJSON()+' ]:</span> '+struct.log);
  logger.el2.append(cmdbox);
  logger.updateHeight(cmdbox);
  logger.updateHeight(msgbox,true);
}

logger.toggleCompact = function(compact){
  if(compact){
    $('#logviewer').css({
      opacity: 0,
      'pointer-events': 'none'
    });
    $('#compactviewer').css({
      opacity: 1,
      'pointer-events': 'all'
    });
  }else{
    $('#logviewer').css({
      opacity: 1,
      'pointer-events': 'all'
    });
    $('#compactviewer').css({
      opacity: 0,
      'pointer-events': 'none'
    });
  }
}

logger.updateHeight = function(elem, smooth) {
  var options = smooth ? {behavior:'smooth'} : {behavior:'instant'};
  elem.get(0).scrollIntoView(options);
}

logger.comm.onmessage = function(event) {
  var data = JSON.parse(event.data);
  logger.uptime.update(data.uptime);
  if(data.log)data.log = logger.cleanse(data.log);
  keyload.updateKeyDiv(data.keys);
  switch(data.type){
    case 'heartbeat':
      display.procHeartbeat(data);
      break;
    case 'consolelog':
      logger.log(data);
      break;
    case 'consolewarn':
      logger.warn(data);
      break;
    case 'consoleerror':
      logger.error(data);
      break;
  }
}

logger.cleanse = function(str){
  var tabpattern = /(\S*)\t/g;
  var result = [];
  var m;
  do{
    m = tabpattern.exec(str);
    if(m) {
      result.push(m[0]);
    }
  }while(m);
  result.forEach((match) => {
    var rep = '<span class="tab">'+match.replace(/\t/,'')+'</span>';
    str = str.replace(match, rep);
  });
  str = str.replace(/\n/g,'<b'+'r>');
  return str;
}

logger.show = function(show) {
  $('#loggers').css({
    'opacity': show ? 1 : 0,
    'pointer-events': show ? 'all' : 'none'
  })
}

logger.uptime.update = function(uptime){
  if(logger.uptime.time != uptime && uptime){
    var time = logger.uptime.time = uptime;
    time = new Date(time);
    logger.uptime.el.html('Server has been up since '+time.getHours()%12+':'+(String(time.getMinutes()).length<2?'0':'')+time.getMinutes()+':'+(String(time.getSeconds()).length<2?'0':'')+time.getSeconds()+(Math.floor(time.getHours()/12)?' pm':' am')+' on '+(time.getMonth()+1)+'/'+time.getDate()+'/'+time.getFullYear()+'.');
  }
}

logger.uptime.scale = function(){
  logger.uptime.el.css('font-size', $(window).height()*.015+'px');
}
logger.uptime.scale();

scales.push(logger.uptime.scale);