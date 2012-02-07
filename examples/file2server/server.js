var io  = require('socket.io').listen(5001),
    dl = require('../../lib/delivery.server'),
    fs  = require('fs');

io.sockets.on('connection', function(socket){
  delivery = dl.listen(socket);
  delivery.on('receive.success',function(file){

    fs.writeFile(file.name,file.buffer, function(err){
      if(err){
        console.log('File could not be saved.');
      }else{
        console.log('File saved.');
      };
    });
  });
});