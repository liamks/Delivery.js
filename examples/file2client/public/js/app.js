$(function(){
  var socket = io.connect('http://0.0.0.0:5001');
  
  socket.on('connect', function(){
    var delivery = new Delivery(socket);

    delivery.on('receive.start',function(fileUID){
      console.log('receiving a file!');
    });

    delivery.on('receive.success',function(file){
      if (file.isImage()) {
        $('img').attr('src', file.dataURL());
      };
    });
  });
});