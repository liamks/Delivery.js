$(function(){
  var socket = io.connect('http://0.0.0.0:5001');
  
  socket.on('connect', function(){
    var delivery = new Delivery(socket);

    delivery.on('delivery.connect',function(delivery){
      $("input[type=submit]").click(function(evt){
        var file = $("input[type=file]")[0].files[0];
        delivery.send(file);
        evt.preventDefault();
      });
    });

    delivery.on('send.success',function(fileUID){
      console.log("file was successfully sent.");
    });
  });
});