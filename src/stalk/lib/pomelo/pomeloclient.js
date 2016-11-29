
//@ require for socket.io
window.navigator.userAgent = 'react-native';
//if (window.navigator && Object.keys(window.navigator).length == 0) {
//    window = Object.assign(window, { navigator: { userAgent: 'ReactNative' } });
//}

var EventEmitter = require('./EventEmitter');
var io = require('socket.io-client/socket.io');

(function (exports, global) {

  var Protocol = exports;
 
  var HEADER = 5;

  var Message = function(id,route,body){
	  this.id = id;
	  this.route = route;
	  this.body = body;
  };

/**
 *
 *pomele client encode
 * id message id;
 * route message route
 * msg message body
 * socketio current support string
 *
 */
Protocol.encode = function(id,route,msg){
	var msgStr = JSON.stringify(msg);
	if (route.length>255) { throw new Error('route maxlength is overflow'); }
	var byteArray = new Uint16Array(HEADER + route.length + msgStr.length);
	var index = 0;
	byteArray[index++] = (id>>24) & 0xFF;
	byteArray[index++] = (id>>16) & 0xFF;
	byteArray[index++] = (id>>8) & 0xFF;
	byteArray[index++] = id & 0xFF;
	byteArray[index++] = route.length & 0xFF;
	for(var i = 0;i<route.length;i++){
		byteArray[index++] = route.charCodeAt(i);
	}
	for (var i = 0; i < msgStr.length; i++) {
		byteArray[index++] = msgStr.charCodeAt(i);
	}
	return bt2Str(byteArray,0,byteArray.length);
};

/**
 *
 *client decode
 *msg String data
 *return Message Object
 */
Protocol.decode = function(msg){
	var idx, len = msg.length, arr = new Array( len );
	for ( idx = 0 ; idx < len ; ++idx ) {
		arr[idx] = msg.charCodeAt(idx);
	}
	var index = 0;
	var buf = new Uint16Array(arr);
	var id = ((buf[index++] <<24) | (buf[index++])  << 16  |  (buf[index++]) << 8 | buf[index++]) >>>0; 
	var routeLen = buf[HEADER-1];
	var route = bt2Str(buf,HEADER, routeLen+HEADER);
	var body = bt2Str(buf,routeLen+HEADER,buf.length);  
	return new Message(id,route,body);
};

var bt2Str = function(byteArray,start,end) {
	var result = "";
	for(var i = start; i < byteArray.length && i<end; i++) {
		result = result + String.fromCharCode(byteArray[i]);
	};
	return result;
}

})('object' === typeof module ? module.exports : (this.Protocol = {}), this);

export default class Pomelo extends EventEmitter {
    constructor() {
        console.log('Pomelo constructor.');
        super();

        this.params = {};
        this.socket = null;
        this.id = 1;
        this.callbacks = {};
    }

    init(params, cb) {
        let pomelo = this;

        pomelo.params = params;
        params.debug = true;
        var host = params.host;
        var port = params.port;

        var url = 'ws://' + host;
        // var url = 'http://' + host;
        if (port) {
            url += ':' + port;
        }
        
        console.log(url);
        socket = io.connect(url, {transports: ['websocket'], reconnection: false });
//        socket = io.connect(url, { 'force new connection': true }); //reconnection: false, reconnectionDelay: 1000 ,transports: ['websocket'], 

        socket.on('connect', function () {
            console.log('[pomeloclient.init] websocket connected!');

            cb(null);
        });
        socket.on('connect_timeout', function (msg) {
            console.log('connect_timeout', msg);
        });
        socket.on('connect_error', function (err) {
            console.log('connect_error', err);
        });

        socket.on('reconnect', function () {
            console.log('reconnect');
        });
        socket.on('reconnect_failed', function () {
            console.log('reconnect_failed');
        });
        socket.on('reconnect_error', function () {
            console.log('reconnect_error');
        });

        socket.on('message', function (data) {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            if (data instanceof Array) {
                processMessageBatch(pomelo, data);
            } else {
                processMessage(pomelo, data);
            }
        });

        socket.on('error', function (err) {
            console.error("pomelo.init: error! " + JSON.stringify(err) + " : " + url);

            cb(err);
        });

        socket.on('disconnect', function (reason) {
            pomelo.emit('disconnect', reason);

            console.warn("disconnect: ", reason);
        });
        
        socket.on('any', function (params) {
           console.warn('socket any', params); 
        });
    };

    disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }

    request(route, message, callback) {
        if (!route) {
            return;
        }
        var msg = message;
        var cb = callback;
        msg = filter(msg, route);
        id++;
        callbacks[id] = cb;
        var sg = Protocol.encode(id, route, msg);
        socket.send(sg);
    }

  notify(route,msg) {
	this.request(route, msg);
  };

  processMessage (pomelo, msg) {
	var route;
	if(msg.id) {
	  //if have a id then find the callback function with the request
	  var cb = callbacks[msg.id];
	  
	  delete callbacks[msg.id];
	  if(typeof cb !== 'function') {
//		console.log('[pomeloclient.processMessage] cb is not a function for request ' + msg.id);
		return;
	  }

	  cb(msg.body);
	  return;
	}

	// server push message or old format message
	processCall(msg);

	//if no id then it should be a server push message
	function processCall(msg) {
	    var route = msg.route;
	    if (!!route) {
	        if (!!msg.body) {
	            pomelo.emit(route, msg.body);
	        } else {
	            var body = msg.body.body;
	            if (!body) {
	                body = msg.body;
	            }
	            pomelo.emit(route, body);
	        }
	  } else {
	      pomelo.emit(msg.body.route, msg.body);
	  }
	}
  };

  processMessageBatch(pomelo, msgs) {
	for(var i=0, l=msgs.length; i<l; i++) {
	  processMessage(pomelo, msgs[i]);
	}
  };

  filter(msg,route){
	if(route.indexOf('area.') === 0){
	  msg.areaId = pomelo.areaId;
	}

	msg.timestamp = Date.now();
	return msg;
  }
};
