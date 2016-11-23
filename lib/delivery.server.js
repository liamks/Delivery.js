var uuid    = require('uuid'),
    mime    = require('mime'),
    fs      = require('fs');

exports.version = '0.0.1';


/********************************/
/****        PUBSUB     *********/
/********************************/
function PubSub(){
  this.channels = {};
};

PubSub.prototype.subscribe = function(channel, fn){
  if (this.channels[channel] === undefined) {
    this.channels[channel] = [fn];
  }else{
    this.channels[channel].push(fn);
  };
};

PubSub.prototype.publish = function(channel,obj){
  var cnl = this.channels[channel];
  var numChannels = (cnl === undefined) ? 0 : cnl.length;
  for (var i = 0; i < numChannels; i++) {
    cnl[i](obj);
  };
};


/********************************/
/****        FilePackage    *****/
/********************************/
function FilePackage(file,pubSub,receiving){
  this.name = file.name;
  
  this.pubSub = pubSub;

  if (receiving) {
    this.size = file.size;
    this.data = file.data;
    this.uid = file.uid;
    this.params = file.params;
    this.makeBuffer(); 
  }else{
    this.params = file.params;
    this.isText = file.isText;
    this.buffer = fs.readFileSync(file.path);
    if (this.isText) {
      this.data = this.buffer.toString('utf8');
    }else{
      this.isText = false; /* false instead of undefined */
      this.data = this.buffer.toString('base64');
    };
    this.generateUId();
    this.path = file.path;
    this.getMimeType();
    this.generatePrefix();
    this.prepBatch();
  };
};

FilePackage.prototype.prepBatch = function(){
  this.batch = {
    uid: this.uid,
    name: this.name,
    size: this.size,
    data: this.data,
    isText: this.isText,
    mimeType: this.mimeType,
    prefix: this.dataPrefix,
    params: this.params
  };
  this.pubSub.publish('file.load',this);
};

FilePackage.prototype.generatePrefix = function(){
  var prefix = 'data:';
  prefix += (this.mimeType === '') ? '' : this.mimeType + ';';
  prefix += 'base64,'
  this.dataPrefix = prefix;
}

FilePackage.prototype.getMimeType = function(){
  this.mimeType = mime.lookup(this.path);
};

FilePackage.prototype.generateUId = function(){
  this.uid = uuid.v4();
};

FilePackage.prototype.makeBuffer = function() {
  this.buffer = new Buffer(this.data,'base64');
  this.pubSub.publish('receive.success',this);
};

/********************************/
/****        DELIVERY     *******/
/********************************/
function Delivery(socket){
  this.socket = socket;
  this.sending = {};
  this.receiving = {};
  this.pubSub = new PubSub();
  this.subscribe();
  
  this.connected = false;
};

Delivery.prototype.connect = function(){
  var _this = this;
  this.socket.on('delivery.connect',function(){
    _this.connected = true;
    _this.pubSub.publish('delivery.connect', _this);
  });
  this.socket.emit('delivery.connecting','');
};

Delivery.prototype.subscribe = function() {
  var _this = this;

  this.pubSub.subscribe('receive.success',function(file){
    _this.socket.emit('send.success',file.uid);
  });
  
  this.socket.on('receive.start', function(file) {
    _this.pubSub.publish('receive.start', file.uid);
    var filePackage = new FilePackage(file, _this.pubSub, true);
    _this.receiving[file.uid] = filePackage;
  });

  this.pubSub.subscribe('file.load',function(filePackage){
    _this.pubSub.publish('send.start',filePackage);
	_this.socket.emit('send.start',filePackage.batch);
    //_this.socket.emit('receive.start',filePackage.batch);
  });

  // Socket Subscriptions
  this.socket.on('delivery.connecting',function(){
    _this.socket.emit('delivery.connect','');
    _this.pubSub.publish('delivery.connect',_this);
  });

  //client sending to server
  this.socket.on('send.start',function(filePackage){
    //receive.start
    _this.pubSub.publish('receive.start',filePackage);
    var fp = new FilePackage(filePackage, _this.pubSub, true);
    _this.receiving[filePackage.uid] = fp;
  });

  //server sending to client
  this.socket.on('send.success', function(uid){
    _this.pubSub.publish('send.success', uid);
    delete _this.sending[uid];
  });
};

Delivery.prototype.on = function(evt,fn) {
  this.pubSub.subscribe(evt,fn);
};

Delivery.prototype.send = function(file){
  var filePackage = new FilePackage(file,this.pubSub);
  this.sending[filePackage.uid] = filePackage;
  return filePackage.uid;
}

Delivery.prototype.sendAsText = function(file){
  file.isText = true;
  return this.send(file);
}


/********************************/
/****        LISTEN    *******/
/********************************/
exports.listen = function(socket){
  return new Delivery(socket);
}
