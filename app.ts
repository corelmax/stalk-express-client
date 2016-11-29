var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

global.window = global;
global._global = __dirname;

/// original WebSocket.
/// https://github.com/websockets/ws
/// https://davidwalsh.name/websocket
import * as StalkFactory from "./src/stalk_node";
// import * as StalkFactory from "stalk-js/stalk_node";

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

StalkFactory.init().then(stalk => {
  if (!stalk._isConnected) return;

  let msg: StalkFactory.Dict = {};
  msg["event"] = "LINK_REQUEST";
  msg["message"] = "test send message from express.js";
  msg["timestamp"] = new Date();
  msg["members"] = ["5825989781f6cb1b5fbb396e", "582425ca0d731841dcf84e56", "582402787db849780682c63f"];

  StalkFactory.pushMessage(msg);
}).catch(err => {

});

module.exports = app;
