var display = {};
display.queues = {};
display.numtabs = 0;
display.taborder = [];
display.tabscrollval = 0;

display.addTestQueue = function(title) {
  var session = "";
  for( var i = 0; i<15; i++){
    session+=String.fromCharCode(Math.floor(Math.random()*26)+97);
  }
  if(title)session = title;
  if(display.queues[session])return;
  display.queues[session] = {};
  display.queues[session].queue = [];
  display.queues[session].queue.push({queued: true,title: 'song 1',id: 'nfwonfwon',clean: 'song1'});
  display.queues[session].queue.push({queued: true,title: 'song 2',id: 'nfwonfwon',clean: 'song1'});
  display.queues[session].queue.push({queued: true,title: 'song 3',id: 'nfwonfwon',clean: 'song1'});
  display.queues[session].queue.push({queued: true,title: 'song 4',id: 'nfwonfwon',clean: 'song1'});
  display.queues[session].queue.push({queued: true,title: 'song 5',id: 'nfwonfwon',clean: 'song1'});
  display.queues[session].queue.push({queued: true,title: 'song 6',id: 'nfwonfwon',clean: 'song1'});
  display.queues[session].position=Math.floor(Math.random()*6);
  this.updateDiv(session)
}

display.procHeartbeat = function(data){
  var allsess = Object.keys(display.queues);
  data.struct.forEach((info)=>{
    var changed = false;
    if(!display.queues[info.session]){
      display.queues[info.session]={};
      changed = true;
    }
    changed = changed || display.queues[info.session].position != info.position || display.queues[info.session].paused != info.paused;
    for(var i = 0; i<info.queue.length; i++){
      if(changed)break;
      changed = changed || !display.queues[info.session].queue[i] || display.queues[info.session].queue[i].id!=info.queue[i].id || display.queues[info.session].queue[i].time!=info.queue[i].time;
    }
    display.queues[info.session].position = info.position;
    display.queues[info.session].paused = info.paused;
    display.queues[info.session].queue = info.queue;
    var found = allsess.indexOf(info.session);
    if(found>-1)allsess.splice(found,1);
    if(changed)display.updateDiv(info.session);
  });
  allsess.forEach((gone)=>{
    //delete the session
  })
}

display.updateDiv = function(session) {
  if(!display.queues[session].el){
    var vis = $('<div class="queue-container"/>');
    var central = $('<div class="queue-central"/>');
    var identifier = $('<h1 class="session-title"/>');
    shortsession = session.substring(session.length-10);
    identifier.html('<span class="session-part">Session</span> '+shortsession);
    var sectionscroll = $('<div class="session-scroll"/>')
    var queuelist = $('<div class="queue-list"/>');
    var queuecaret = $('<div class="queue-pointer"/>');
    var caret = $('<span class="caret"/>');
    vis.append(central);
    central.append(identifier);
    central.append(sectionscroll);
    sectionscroll.append(queuecaret);
    sectionscroll.append(queuelist);
    queuecaret.append(caret);
    $('#display').append(vis);
    display.queues[session].el = vis;
    display.queues[session].queuelist = queuelist;
    display.addTab(session);
  }
  display.queues[session].queuelist.empty();
  var counter = 0;
  display.queues[session].queue.forEach(function(item){
    var queueitem = $('<p class="title"/>');
    var queuetime = $('<p class="time"/>');
    var queueitemcont = $('<div class="queue-item-container"/>');
    queueitem.html(item.title);
    var time = item.time;
    var timestring = (Math.floor(time/3600)?(Math.floor(time/3600)+':'):'')+(Math.floor(time/3600)&&Math.floor((time%3600)/60)<10?'0':'')+(Math.floor(time/3600)||Math.floor((time%3600)/60)?(Math.floor((time%3600)/60)+':'):'')+(Math.floor(time/3600)||Math.floor((time%3600)/60)&&Math.floor(time%60)<10?('0'+Math.floor((time%60))):Math.floor((time%60)));
    queuetime.html(timestring);
    if(counter<display.queues[session].position){
      queueitemcont.css('color', '#aaaaaa');
    }else if(counter==display.queues[session].position){
      queueitemcont.css('color', '#33dd33');
      queueitemcont.attr('id', 'current');
    }else{
      queueitemcont.css('color', '#222222');
    }
    queueitemcont.append(queueitem, queuetime);
    queueitemcont.on('mousedown', ()=>{
      var link = 'https://www.youtube.com/watch?v='+item.id;
      window.open(link);
    })
    display.queues[session].queuelist.append(queueitemcont);
    counter++;
  });
  display.updatePointer(session);
  display.scale();
}

display.addTab = function(session) {
  var tab = $('<div class="tab-chooser inactive"/>');
  shortsession = session.substring(session.length-10);
  tab.html(shortsession);
  var underline = $('<div class="underline"/>');
  tab.append(underline);
  $('#tabbar').append(tab);
  var padding = $('<div/>');
  padding.css({
    'height': '100%',
    'width': '10px',
    'position': 'absolute',
    'top': 0,
    'right': 0,
    'background-color': 'inherit',
    'z-index': 2
  })
  var sidemarg = 20;
  tab.css('left', sidemarg);
  tab.append(padding);
  display.queues[session].tab = tab;
  display.queues[session].active = false;
  tab.on('click', ()=>{
    display.changeToTab(session);
  })
  tab.on('mouseover', ()=>{
    if(!display.queues[session].active){
      underline.stop();
      underline.animate({'width':'10px'},200, 'easeOutBack');
    }
  })
  tab.on('mouseout', ()=>{
    if(!display.queues[session].active){
      underline.stop();
      underline.animate({'width':'0px'},200);
    }
  });
  display.taborder.push(session);
  if(display.numtabs == 0){
    $('#placeholder').css('display', 'none');
    $('#tabmenu').css({
      'opacity': 1,
      'pointer-events': 'all'
    })
    display.changeToTab(session);
  }
  if(display.numtabs == 0) display.tabUpdatePosition();
  else display.tabUpdatePosition(true);
  display.numtabs++;
}

display.changeToTab = function(session) {
  $('#display').find('.queue-container').css({
    opacity: 0,
    'pointer-events': 'none'
  });
  display.queues[session].el.css({
    opacity: 1,
    'pointer-events': 'all'
  })
  Object.keys(display.queues).forEach((key)=>{
    display.queues[key].active = false;
  })
  display.queues[session].active = true;
  $('#tabbar').find('.tab-chooser').removeClass('active').addClass('inactive');
  display.queues[session].tab.addClass('active').removeClass('inactive');
  var underline = display.queues[session].tab.find('.underline');
  underline.stop();
  underline.css('width', '0px');

  var sidemarg = 20;
  var tabwidth = 250;
  var revealwidth = 40;
  var index = display.taborder.indexOf(session);
  var original = index*tabwidth;
  var scrolled = original-display.tabscrollval;
  var minpos = revealwidth*index;
  var maxpos = $('#tabbar').width()-sidemarg*2-tabwidth-revealwidth*(display.taborder.length-index-1)/3;
  if(scrolled>maxpos){
    display.tabscrollval+=(scrolled-maxpos);
    display.tabUpdatePosition(true);
  }
  if(scrolled<minpos){
    console.log(scrolled, minpos)
    display.tabscrollval-=(minpos-scrolled);
    display.tabUpdatePosition(true);
  }
}

display.updatePointer = function(session) {
  if(display.queues.length==0)return;
  var bound = display.queues[session].queuelist.find('#current').get(0).getBoundingClientRect();
  var outer = display.queues[session].queuelist.get(0).getBoundingClientRect();
  var top = bound.top-outer.top+(bound.height-12)/2;
  display.queues[session].el.find('.queue-pointer').css('height', outer.height);
  display.queues[session].el.find('.caret').animate({top: top}, 500);
}

display.tabScroll = function(event) {
  var dir = event.originalEvent.deltaY;
  var scrollspeed = 30;
  var sidemarg = 20;
  var tabwidth = 250;
  if($('#tabbar').width()-sidemarg*2<display.taborder.length*tabwidth){
    var minval = 0;
    var maxval = display.taborder.length*tabwidth-($('#tabbar').width()-sidemarg*2);
    display.tabscrollval=dir>0?display.tabscrollval-scrollspeed:display.tabscrollval+scrollspeed;
    if(display.tabscrollval<minval)display.tabscrollval = minval;
    if(display.tabscrollval>maxval)display.tabscrollval = maxval;
  }
  display.tabUpdatePosition();
}

display.tabUpdatePosition = function(animate) {
  var sidemarg = 20;
  var tabwidth = 250;
  var revealwidth = 40;

  display.taborder.forEach((session, index)=>{
    var original = index*tabwidth;
    var scrolled = original-display.tabscrollval;
    var minpos = revealwidth*index;
    var maxpos = $('#tabbar').width()-sidemarg*2-tabwidth-revealwidth*(display.taborder.length-index-1)/3;
    var pos = scrolled;
    var z = display.taborder.length+index;
    if(scrolled<minpos){
      pos = minpos;
    }
    if(scrolled>=minpos+tabwidth-revealwidth){
      z = display.taborder.length-index;
    }
    if(scrolled>maxpos){
      pos = maxpos;
    }
    pos+=sidemarg;
    if(animate){
      display.queues[session].tab.stop();
      display.queues[session].tab.animate({
        'left': pos
      },200);
      display.queues[session].tab.css({
        'z-index': z
      });
    }else{
      display.queues[session].tab.css({
        'left': pos,
        'z-index': z
      });
    }
  })
}

display.scale = function() {
  var botmarg = 40;
  $('.session-scroll').each((ind, el)=>{
    el = $(el);
    var bounds = el.find('.queue-list').get(0).getBoundingClientRect();
    var max = $('#tabmenu').height();
    if(bounds.top+bounds.height+botmarg>max){
      el.css('height', max-bounds.top-botmarg);
    }else{
      el.css('height', 'auto');
    }
  });
  Object.keys(display.queues).forEach((key)=>{
    display.updatePointer(key);
  })
}

display.show = function(show) {
  $('#queues').css({
    'opacity': show ? 1 : 0,
    'pointer-events': show ? 'all' : 'none'
  })
}

scales.push(display.scale)
$('#tabbar').on('wheel',display.tabScroll);