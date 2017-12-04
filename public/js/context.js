var context = {};

context.createMenu = function() {
  var menu = context.el = $('#contextmenu');
  var opencons = context.opencons = $('<div class="item"/>');
  opencons.html('View Console');
  opencons.on('mousedown', context.toggleLoggers);
  context.queueToggled = false;
  var compactcons = context.compactcons = $('<div class="item"/>');
  compactcons.html('Compact View');
  compactcons.css({
    'opacity': 0,
    'pointer-events': 'none'
  });
  compactcons.on('mousedown', context.toggleCompact);
  context.compactToggled = false;
  menu.append(opencons);
  menu.append(compactcons);
  context.height = opencons.height()+parseInt(opencons.css('padding').replace('px',''))*2;
}

context.openMenu = function(event) {
  event.preventDefault();
  context.el.css({
    'left': event.clientX,
    'top': event.clientY,
    'opacity': 1,
    'pointer-events': 'all',
    'height': 0
  });
  context.el.animate({
    'height': context.height
  }, 200, 'easeOutCubic');
}

context.closeMenu = function() {
  context.el.css({
    'opacity': 0,
    'pointer-events': 'none',
    'height': 0
  })
}

context.toggleLoggers = function() {
  if(context.queueToggled){
    display.show(true);
    logger.show(false);
    context.compactcons.css({
      'opacity': 0,
      'pointer-events': 'none'
    });
    context.height = context.opencons.height()+parseInt(context.opencons.css('padding').replace('px',''))*2;
    context.opencons.html('View Console');
  }else{
    display.show(false);
    logger.show(true);
    context.compactcons.css({
      'opacity': 1,
      'pointer-events': 'all'
    });
    context.height = context.opencons.height()+context.compactcons.height()+parseInt(context.opencons.css('padding').replace('px',''))*4+1;
    context.opencons.html('View Queues');
  }
  context.queueToggled = !context.queueToggled;
}

context.toggleCompact = function() {
  if(context.compactToggled)context.compactcons.html('Compact View');
  else context.compactcons.html('Block View');
  context.compactToggled = !context.compactToggled;
  logger.toggleCompact(context.compactToggled);
}

$('body').on('contextmenu', context.openMenu);
$('body').on('mousedown', context.closeMenu);
context.createMenu();