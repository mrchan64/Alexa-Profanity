var keyload = {};
keyload.el = $('#keyload');
keyload.tab = $('#keyload #tab');
keyload.display = $('#keyload #list');

keyload.openAngle = 0;
keyload.closeAngle = 180;
keyload.duration = 500;
keyload.toggleOpen = true;

keyload.el.find('h1').html('<span>Create</span> a Key');

keyload.openTab = function(){
  var circle = keyload.tab.find('#circle')
  circle.stop();
  var angle = parseInt(circle.css('text-indent'));
  var duration = keyload.duration*(keyload.closeAngle-angle)/(keyload.closeAngle-keyload.openAngle);
  circle.animate({
    'text-indent': keyload.closeAngle
  }, {
    step: function(now, fx) {
      $(this).css('-webkit-transform','rotate('+now+'deg)');
    },
    duration: duration
  }, 'easeOutCubic');

  keyload.el.stop();
  keyload.el.animate({
    'left': '60%'
  },duration, 'easeOutCubic');
  keyload.toggleOpen = true;
}

keyload.closeTab = function(){
  var circle = keyload.tab.find('#circle')
  circle.stop();
  var angle = parseInt(circle.css('text-indent'));
  var duration = keyload.duration*(angle)/(keyload.closeAngle-keyload.openAngle);
  circle.animate({
    'text-indent': keyload.openAngle
  }, {
    step: function(now, fx) {
      $(this).css('-webkit-transform','rotate('+now+'deg)');
    },
    duration: duration
  }, 'easeOutCubic');

    keyload.el.stop();
  keyload.el.animate({
    'left': '100%'
  },duration, 'easeOutCubic');
  keyload.toggleOpen = false;
}

keyload.sendMessage = function(){
  var link = $('#keyload #content input').val();
  if(link.length==0)return;
  $('#keyload #content input').val("");
  if(link.indexOf('youtube.com')==-1){
    keyload.el.find('#content input').attr('placeholder', 'This is Not a Youtube Link!');
    return;
  }
  logger.comm.send(JSON.stringify({
    'type': 'key',
    'link': link
  }));
}

keyload.updateKeyDiv = function(keyStore){
  if(!keyStore)return;
  var keys = [];
  var time = new Date().getTime();
  Object.keys(keyStore).forEach((key)=>{
    keys.push({
      'key': key,
      'link': keyStore[key].link,
      'expiration': (keyStore[key].expiration-time)/1000
    });
  });
  keys.sort((a,b)=>{
    return b.expiration-a.expiration;
  });
  keyload.display.empty();
  keys.forEach((key)=>{
    var t = $('<p class="list-item"/>');
    var time = (Math.floor(key.expiration/60))+':'+((Math.floor(key.expiration%60)<10)?'0':'')+Math.floor(key.expiration%60);
    t.html(time+'&nbsp;&nbsp;&nbsp;<span>'+key.key.toUpperCase()+'</span>&nbsp;&nbsp;&nbsp;'+key.link);
    keyload.display.append(t);
  });
  $('#keyload #content #list p').css('margin-bottom', $('body').height()*.005);
}

keyload.scale = function(){
  $('#keyload #content h1').css('padding-top', $('body').height()*.2);
  $('#keyload #content p').css('margin-top', $('body').height()*.04);
  $('#keyload #content input').css('margin-top', $('body').height()*.01);
  $('#keyload #content #list').css('margin-top', $('body').height()*.02);

  var textwidth = Math.floor($('#keyload #content').width()-$('#keyload #content button').width()-72);
  $('#keyload #content input').css('width', textwidth);
}
keyload.scale();
scales.push(keyload.scale);

keyload.tab.on('mousedown', ()=>{
  if(!keyload.toggleOpen){
    keyload.openTab();
  }else{
    keyload.closeTab();
  }
});

keyload.tab.on('mouseover', ()=>{
  keyload.tab.find('#circle').css('background-color', '#777777');
});

keyload.tab.on('mouseout', ()=>{
  keyload.tab.find('#circle').css('background-color', '#aaaaaa');
});

keyload.el.find('#close').on('mousedown', keyload.closeTab)

keyload.el.find('#content input').on('keydown', (e)=>{
  var key = e.keyCode || e.which;
  if(key == 13){
    keyload.sendMessage();
  }else if(e.key != 27){
    keyload.el.find('#content input').attr('placeholder', 'Youtube Link');
  }
})

keyload.el.find('#content button').on('keydown', (e)=>{
  var key = e.keyCode || e.which;
  if(key == 13){
    keyload.sendMessage();
  }
})

keyload.el.find('#content button').on('mousedown', keyload.sendMessage)

window.onkeyup = function(e) {
  var key = e.keyCode || e.which;
  if (key == 27) {
    keyload.closeTab();
  }else if (key == 37) {
    //left
  }else if (key == 39) {
    //right
  }
}

//setTimeout(keyload.closeTab, 500);