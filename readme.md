# Delivery.js (Experimental)
## Asynchronous Bidirectional File Transfers For Node.js via Socket.IO

Sending files to the server, and pushing files to the client should be as easy as possible. Delivery.js uses Socket.IO as a bidirectional transfer mechanism, making file transfers fast and easy. When Socket.IO uses WebSockets to connect to the server, only 2 bytes is added to each message sent, signficantly less than [~ 871 bytes](http://websocket.org/quantum.html) for a POST. If a file needs to be broken into chunks, a large header size adds a significant amount to the data being trasnfered, WebSockets do not incure such a penalty.

## Install

    npm install delivery -g

## Examples

### Sending a File To a Server

#### Server-side code
```javascript
var io  = require('socket.io').listen(5001),
    dl  = require('delivery'),
    fs  = require('fs');

io.sockets.on('connection', function(socket){
  var delivery = dl.listen(socket);
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
```
#### Client-side code
```javascript
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
```

### Pushing a File to a Client

### Server-side code
```javascript
var io  = require('socket.io').listen(5001),
    dl  = require('delivery'),
    fs  = require('fs');

io.sockets.on('connection', function(socket){
  var delivery = dl.listen(socket);
  delivery.on('delivery.connect',function(delivery){

    delivery.send({
      name: 'sample-image.jpg',
      path : './sample-image.jpg'
    });

    delivery.on('send.success',function(file){
      console.log('File successfully sent to client!');
    });

  });
});
```

### Client-side code
```javascript
$(function(){
  var socket = io.connect('http://0.0.0.0:5001');
  
  socket.on('connect', function(){
    var delivery = new Delivery(socket);

    delivery.on('receive.start',function(delivery){
      console.log('receiving a file!');
    });

    delivery.on('receive.success',function(file){
      if (file.isImage()) {
        $('img').attr('src', file.dataURL());
      };
    });
  });
});
```

## API

### Server Functions

#### Importing delivery.js

```javascript
dl = require('delivery');
```

#### Listen to the socket

```javascript
var delivery = dl.listen(socket);
```

#### Listening to delivery.js events - delivery.on('event',fn)

```javascript
delivery.on('delivery.connect',function(delivery){
  ...
});
```
#### Sending a file

```javascript
delivery.send({
  name: 'fileName.png',
  path: 'path/to/file/fileName.png'
});
```

### Server Events

#### 'delivery.connect'
delivery.connect is called when a client connects to the server.

```javascript
delivery.on('delivery.connect',function(delivery){
  ...
});
```

#### 'receive.start'
receive.start is called when the server starts receiving a file. The callback function takes a filePackage object that describes the file being sent.

```javascript
delivery.on('receive.start',function(filePackage){
  console.log(filePackage.name);
});
```
#### 'receive.success'
receive.success is called once the file has been successfully reveived by the server. The callback function takes a filePackage.

```javascript
delivery.on('receive.success',function(file){
    fs.writeFile(file.name,file.buffer, function(err){
      if(err){
        console.log('File could not be saved.');
      }else{
        console.log('File saved.');
      };
    });
  });
```
#### 'file.load'
file.load is called after .send() is called and immediately after the file is loaded. The callback function takes a filePackage.

```javascript
delivery.on('file.load',function(filePackage){
  console.log(filePackage.name + " has just been loaded.");
});
```
#### 'send.start'
send.start is called after .send() is called and immediately after the file begins being sent to the client. The callback function takes a filePackage.

```javascript
delivery.on('send.start',function(filePackage){
  console.log(filePackage.name + " is being sent to the client.");
});
```
#### 'send.success'
send.success is called after .send() is called and once confirmation is received form the client that the the file sent was successfully received. The callback function takes the uid of the file that was sent.

```javascript
delivery.on('send.success',function(uid){
  console.log("File successfully sent!");
});

### Client

#### Include delivery.js in your html file

```html
<script src="/js/delivery.js"></script>
```

#### Events

Client events mirror those on the server, see server events above for more details.

##License

Delivery.js is released under the MIT license:

http://www.opensource.org/licenses/MIT


## Road Map

