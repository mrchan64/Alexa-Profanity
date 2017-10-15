exports.process = function(command){

  command = command.toLowerCase();

  if(command.indexOf('playlist ')!=-1){
    var query = command.substring(command.indexOf('playlist ')+('playlist ').length)
    return {
      command: 'playlist',
      query: query
    }
  }

  if(command.indexOf('search ')!=-1){
    var query = command.substring(command.indexOf('search ')+('search ').length)
    if(query.substring(0,4)=='for '){
      query = query.substring(4);
    }
    return {
      command: 'video',
      query: query
    }
  }


  if(command.indexOf('play ')!=-1){
    var query = command.substring(command.indexOf('play ')+('play ').length)
    return {
      command: 'video',
      query: query
    }
  }

  return{command: 'none'}

}