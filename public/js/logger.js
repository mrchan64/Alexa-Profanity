var logger = {};
logger.el = $('#messagecont');
logger.el2 = $('#compactviewer');

logger.protocol = window.location.protocol=='http:' ? 'ws:' : 'wss:';
logger.link = logger.protocol+'//'+window.location.host+"/ytstatus/info";
logger.comm = new WebSocket(logger.link);
logger.heartRate = 1000;

logger.comm.onopen = function(event){
  logger.comm.send(JSON.stringify({
    'type':'fillgap',
    'time': 0
  }))
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
  if(data.log)data.log = logger.cleanse(data.log);
  switch(data.type){
    case 'heartbeat':
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

logger.checkForCardiacArrest = function(){
  if(logger.ca)clearTimeout(logger.ca);
  logger.lastHeartBeat = new Date().getTime();
  logger.ca = setTimeout(()=>{
    if(new Date().getTime()>logger.lastHeartBeat+logger.heartRate*4){
      //heart failure
    }
  }, logger.heartRate*5);
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