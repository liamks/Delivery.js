# Delivery.js (Experimental)
## Bidirectional File Transfers For Node.js via Socket.IO

Sending files to the server, and pushing files to the client should be as easy as possible. Delivery.js uses Node.js and Socket.IO to make it easy to push files to the client, or send them to the server. Files can be pushed to the client as text (utf8) or base64 (for images and binary files). 

## Install

    npm install delivery -g

## Browser JavaScript

delivery.js can be found within lib/client.

## Examples

### Sending a File To a Server (Client is a browser)

#### Server-side code
```javascript
var io  = require('socket.io').listen(5001),
    dl  = require('delivery'),
    fs  = require('fs');

io.sockets.on('connection', function(socket){
  var delivery = dl.listen(socket);
  delivery.on('receive.success',function(file){
    var params = file.params;
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
        var extraParams = {foo: 'bar'};
        delivery.send(file, extraParams);
        evt.preventDefault();
      });
    });

    delivery.on('send.success',function(fileUID){
      console.log("file was successfully sent.");
    });
  });
});
```

### Pushing a File to a Client (Client is a browser)

### Server-side code
```javascript
var io  = require('socket.io').listen(5001),
    dl  = require('delivery');

io.sockets.on('connection', function(socket){
  var delivery = dl.listen(socket);
  delivery.on('delivery.connect',function(delivery){

    delivery.send({
      name: 'sample-image.jpg',
      path : './sample-image.jpg',
      params: {foo: 'bar'}
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

    delivery.on('receive.start',function(fileUID){
      console.log('receiving a file!');
    });

    delivery.on('receive.success',function(file){
      var params = file.params;
      if (file.isImage()) {
        $('img').attr('src', file.dataURL());
      };
    });
  });
});
```

### Transfer files between two servers

### Receive file
```javascript
io.sockets.on('connection', function(socket){
  
  var delivery = dl.listen(socket);
  delivery.on('receive.success',function(file){
		
    fs.writeFile(file.name, file.buffer, function(err){
      if(err){
        console.log('File could not be saved: ' + err);
      }else{
        console.log('File ' + file.name + " saved");
      };
    });
  });	
});
```

### Send file
```javascript
socket.on( 'connect', function() {
  log( "Sockets connected" );
		
  delivery = dl.listen( socket );
  delivery.connect();
	
  delivery.on('delivery.connect',function(delivery){
    delivery.send({
      name: 'sample-image.jpg',
      path : './sample-image.jpg'
    });

    delivery.on('send.success',function(file){
      console.log('File sent successfully!');
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

```javascript
delivery.sendAsText({
  name: 'fileName.txt',
  path: 'path/to/file/fileName.txt'
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
```

### FilePackage
FilePackage objects encapsulate files and includes a text representation (utf8), or base64 representation of the file. They also include the file's meta data, including `name`, `size` and `mimeType`.

```javascript
filePackage.isImage()
```

returns true if the file has a corresponding mime type that is an image. It is possible that this method could return false if your file is an image, but does not have a mimetype, or does not have a mimetype of image/gif, image/jpeg, image/png, image/svg+xml, image/tiff. Look for `var imageFilter` within delivery.js if you'd like to add additional mimetypes.

```javascript
filePackage.isText()
```

returns true if the server used `sendAsText()`.

```javascript
filePackage.text()
```

returns the text representation of the file sent. If the file has been base64 encoded it returns the base64 encoded version of the file.

```javascript
filePackage.dataURL()
```

returns the base64 representation of the file prefixed with the data and mimetype necessary to display an image within `<img src=''>`.

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

1. Incorporating feedback from other developers!
2. Breaking files into pieces to help transfer larger files.
3. md5 hash file and confirm the hash when a file has been received.
4. ?

