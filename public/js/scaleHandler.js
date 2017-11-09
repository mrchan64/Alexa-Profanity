var scales = [];

$(window).on('resize', ()=>{
  scales.forEach((func)=>{
    func();
  })
})