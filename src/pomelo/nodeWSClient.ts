/**
 * Facebook.Inc react-native websocket sample.
 */
/*
export default class WebSocketClient {
   init2() {
       let ws = new WebSocket('ws://git.animation-genius.com:3010');

       ws.onopen = () => {
           // connection opened
           console.log('onOpen: ');
           ws.send('something');
       };

       ws.onmessage = (e) => {
           // a message was received
           console.log('message: ', e.data);
       };

       ws.onerror = (e) => {
           // an error occurred
           console.log('connection error: ', e);
       };

       ws.onclose = (e) => {
           // connection closed
           console.log('connection closed: ', e.code, e.reason);
       };
   };
}
*/

import WebSocket = require('ws');

(function () {
  let JS_WS_CLIENT_TYPE = 'js-websocket';
  let JS_WS_CLIENT_VERSION = '0.0.1';

  let Protocol = require('pomelo-protocol');
  let protobuf = require('pomelo-protobuf');
  let decodeIO_protobuf = window.decodeIO_protobuf;
  let decodeIO_encoder = null;
  let decodeIO_decoder = null;
  let Package = Protocol.Package;
  let Message = Protocol.Message;
  let EventEmitter = require('./EventEmitter');
  let rsa = window.rsa;

  if (typeof (window) != "undefined" && typeof (sys) != 'undefined' && sys.localStorage) {
    window.localStorage = sys.localStorage;
  }

  let RES_OK = 200;
  let RES_FAIL = 500;
  let RES_OLD_CLIENT = 501;

  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F() { }
      F.prototype = o;
      return new F();
    };
  }

  let root = window;
  let pomelo = Object.create(EventEmitter.prototype); // object extend from object
  root.pomelo = pomelo;
  let socket = null;
  let reqId = 0;
  let callbacks = {};
  let handler = {};
  let handlers = {};
  //Map from request id to route
  let routeMap = {};
  let dict = {};    // route string to code
  let abbrs = {};   // code to route string
  let serverProtos = {};
  let clientProtos = {};
  let protoVersion = 0;

  let heartbeatInterval = 0;
  let heartbeatTimeout = 0;
  let nextHeartbeatTimeout = 0;
  let gapThreshold = 100;   // heartbeat gap threashold
  let heartbeatId = null;
  let heartbeatTimeoutId = null;
  let handshakeCallback = null;


  let connectParams = null;
  let decode = null;
  let encode = null;
  let reconnect = false;
  let reconncetTimer = null;
  let reconnectUrl = null;
  let reconnectAttempts = 0;
  let reconnectionDelay = 5000;
  let maxReconnectAttempts = null;
  let DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

  let useCrypto;

  let handshakeBuffer = {
    'sys': {
      type: JS_WS_CLIENT_TYPE,
      version: JS_WS_CLIENT_VERSION,
      rsa: {}
    },
    'user': {
    }
  };

  let initCallback = null;

  pomelo.init = function (params, cb) {
    initCallback = cb;

    connectParams = params;
    let host = params.host;
    let port = params.port;
    reconnect = params.reconnect;
    encode = params.encode || defaultEncode;
    decode = params.decode || defaultDecode;

    let url = "ws://" + host; //'ws://' 
    if (port) {
      url += ':' + port;
    }

    handshakeBuffer.user = params.user;
    if (params.encrypt) {
      useCrypto = true;
      rsa.generate(1024, "10001");
      let data = {
        rsa_n: rsa.n.toString(16),
        rsa_e: rsa.e
      }
      handshakeBuffer.sys.rsa = data;
    }
    handshakeCallback = params.handshakeCallback;

    connect(params, url);
  };

  pomelo.disconnect = function (): Promise<any> {
    return new Promise((resolve, rejected) => {
      if (!!socket) {
        if (socket.disconnect) socket.disconnect();
        if (socket.close) socket.close();
        socket = null;

        console.log('disconnected socket is', socket);
      }

      if (heartbeatId) {
        clearTimeout(heartbeatId);
        heartbeatId = null;
      }
      if (heartbeatTimeoutId) {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = null;
      }

      resolve();
    });
  };

  pomelo.request = function (route, msg, cb) {
    if (arguments.length === 2 && typeof msg === 'function') {
      cb = msg;
      msg = {};
    } else {
      msg = msg || {};
    }
    route = route || msg.route;
    if (!route) {
      return;
    }
    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;

    console.log(`request: route: ${route} msg : ${JSON.stringify(msg)}`);
  };

  pomelo.notify = function (route, msg) {
    msg = msg || {};
    sendMessage(0, route, msg);
  };

  pomelo.setReconnect = function (_reconnect: boolean) {
    reconnect = _reconnect;
  }

  let defaultDecode = pomelo.decode = function (data) {
    //probuff decode
    let msg = Message.decode(data);

    if (!!msg.id && msg.id > 0) {
      msg.route = routeMap[msg.id];
      delete routeMap[msg.id];
      if (!msg.route) {
        return;
      }
    }

    msg.body = deCompose(msg);
    return msg;
  };

  let defaultEncode = pomelo.encode = function (reqId, route, msg) {
    let type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    //compress message by protobuf
    if (protobuf && clientProtos[route]) {
      msg = protobuf.encode(route, msg);
    } else if (decodeIO_encoder && decodeIO_encoder.lookup(route)) {
      let Builder = decodeIO_encoder.build(route);
      msg = new Builder(msg).encodeNB();
    } else {
      msg = Protocol.strencode(JSON.stringify(msg));
    }

    let compressRoute = 0;
    if (dict && dict[route]) {
      route = dict[route];
      compressRoute = 1;
    }

    return Message.encode(reqId, type, compressRoute, route, msg);
  };

  let connect = function (params, url) {
    console.log('connect to ' + url, params);

    maxReconnectAttempts = params.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS;
    reconnectUrl = url;
    //Add protobuf version
    if (window.localStorage && window.localStorage.getItem('protos') && protoVersion === 0) {
      let protos = JSON.parse(window.localStorage.getItem('protos'));

      protoVersion = protos.version || 0;
      serverProtos = protos.server || {};
      clientProtos = protos.client || {};

      if (!!protobuf) {
        protobuf.init({ encoderProtos: clientProtos, decoderProtos: serverProtos });
      }
      if (!!decodeIO_protobuf) {
        decodeIO_encoder = decodeIO_protobuf.loadJson(clientProtos);
        decodeIO_decoder = decodeIO_protobuf.loadJson(serverProtos);
      }
    }
    //Set protoversion
    handshakeBuffer.sys.protoVersion = protoVersion;

    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  };

  let onopen = function (event) {
    console.log('onSocketOpen:', event.type);

    if (!!reconnect) {
      pomelo.emit('reconnect');
    }

    reset();

    let obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
    send(obj);
  };

  let onmessage = function (event) {
    processPackage(Package.decode(event.data));
    // new package arrived, update the heartbeat timeout
    if (heartbeatTimeout) {
      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
    }
  };

  let onerror = function (event) {
    console.warn('socket error: ', event.message);

    pomelo.emit('io-error', event);

    initCallback(event);
  };

  let onclose = function (event) {
    console.warn('socket close: ', event.type);

    pomelo.emit('close', event);
    pomelo.emit('disconnect', event);

    if (!!reconnect && reconnectAttempts < maxReconnectAttempts) {
      console.log("reconnection", reconnect, reconnectAttempts, reconnectionDelay, connectParams)
      reconnect = true;
      reconnectAttempts++;
      reconncetTimer = setTimeout(function () {
        connect(connectParams, reconnectUrl);
      }, reconnectionDelay);
    }
    else {
      console.log("reconnection !", reconnect);
    }
  };

  let reset = function () {
    reconnect = false;
    reconnectionDelay = 1000 * 5;
    reconnectAttempts = 0;
    clearTimeout(reconncetTimer);
  };

  let sendMessage = function (reqId, route, msg) {
    if (useCrypto) {
      msg = JSON.stringify(msg);
      let sig = rsa.signString(msg, "sha256");
      msg = JSON.parse(msg);
      msg['__crypto__'] = sig;
    }

    if (encode) {
      msg = encode(reqId, route, msg);
    }

    let packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
  };

  let send = function (packet) {
    if (socket) {
      socket.send(packet.buffer);
    }
  };

  let heartbeat = function (data) {
    if (!heartbeatInterval) {
      // no heartbeat
      return;
    }

    let obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }

    if (heartbeatId) {
      // already in a heartbeat interval
      return;
    }
    heartbeatId = setTimeout(function () {
      heartbeatId = null;
      send(obj);

      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
  };

  let heartbeatTimeoutCb = function () {
    let gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
      console.error('server heartbeat timeout');
      pomelo.emit('heartbeat timeout');
      pomelo.disconnect();
    }
  };

  let handshake = function (data) {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
      pomelo.emit('error', 'client version not fullfill');
      return;
    }

    if (data.code !== RES_OK) {
      pomelo.emit('error', 'handshake fail');
      return;
    }

    handshakeInit(data);

    let obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    send(obj);

    initCallback(null);
  };

  let onData = function (data) {
    let msg = data;
    if (decode) {
      msg = decode(msg);
    }
    processMessage(pomelo, msg);
  };

  let onKick = function (data) {
    data = JSON.parse(Protocol.strdecode(data));
    pomelo.emit('onKick', data);
  };

  handlers[Package.TYPE_HANDSHAKE] = handshake;
  handlers[Package.TYPE_HEARTBEAT] = heartbeat;
  handlers[Package.TYPE_DATA] = onData;
  handlers[Package.TYPE_KICK] = onKick;

  let processPackage = function (msgs) {
    if (Array.isArray(msgs)) {
      for (let i = 0; i < msgs.length; i++) {
        let msg = msgs[i];
        handlers[msg.type](msg.body);
      }
    } else {
      handlers[msgs.type](msgs.body);
    }
  };

  let processMessage = function (pomelo, msg) {
    if (!msg.id) {
      // server push message
      pomelo.emit(msg.route, msg.body);
      return;
    }

    //if have a id then find the callback function with the request
    let cb = callbacks[msg.id];

    delete callbacks[msg.id];
    if (typeof cb !== 'function') {
      return;
    }

    cb(msg.body);
    return;
  };

  let processMessageBatch = function (pomelo, msgs) {
    for (let i = 0, l = msgs.length; i < l; i++) {
      processMessage(pomelo, msgs[i]);
    }
  };

  let deCompose = function (msg) {
    let route = msg.route;

    //Decompose route from dict
    if (msg.compressRoute) {
      if (!abbrs[route]) {
        return {};
      }

      route = msg.route = abbrs[route];
    }
    if (protobuf && serverProtos[route]) {
      return protobuf.decodeStr(route, msg.body);
    } else if (decodeIO_decoder && decodeIO_decoder.lookup(route)) {
      return decodeIO_decoder.build(route).decode(msg.body);
    } else {
      return JSON.parse(Protocol.strdecode(msg.body));
    }
  };

  let handshakeInit = function (data) {
    if (data.sys && data.sys.heartbeat) {
      heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
      heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
    } else {
      heartbeatInterval = 0;
      heartbeatTimeout = 0;
    }

    initData(data);

    if (typeof handshakeCallback === 'function') {
      handshakeCallback(data.user);
    }
  };

  //Initilize data used in pomelo client
  let initData = function (data) {
    if (!data || !data.sys) {
      return;
    }
    dict = data.sys.dict;
    let protos = data.sys.protos;

    //Init compress dict
    if (dict) {
      dict = dict;
      abbrs = {};

      for (let route in dict) {
        abbrs[dict[route]] = route;
      }
    }

    //Init protobuf protos
    if (protos) {
      protoVersion = protos.version || 0;
      serverProtos = protos.server || {};
      clientProtos = protos.client || {};

      //Save protobuf protos to localStorage
      window.localStorage.setItem('protos', JSON.stringify(protos));

      if (!!protobuf) {
        protobuf.init({ encoderProtos: protos.client, decoderProtos: protos.server });
      }
      if (!!decodeIO_protobuf) {
        decodeIO_encoder = decodeIO_protobuf.loadJson(clientProtos);
        decodeIO_decoder = decodeIO_protobuf.loadJson(serverProtos);
      }
    }
  };

  module.exports = pomelo;
})();

