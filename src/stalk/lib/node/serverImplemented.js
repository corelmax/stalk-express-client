/**
 * Stalk-JavaScript, Node.js client. Supported react-native.
 * Support by@ nattapon.r@live.com
 *
 * Ahoo Studio.co.th
 */
"use strict";
var httpStatusCode_1 = require('../utils/httpStatusCode');
var Pomelo = require('../pomelo/nodeWSClient');
var Config = require(_global + '/stalk_config.json');
var AuthenData = (function () {
    function AuthenData() {
    }
    return AuthenData;
}());
var ServerImplemented = (function () {
    function ServerImplemented() {
        this._isConnected = false;
        this._isLogedin = false;
        this.connect = this.connectServer;
        console.log("serv imp. constructor");
    }
    ServerImplemented.getInstance = function () {
        if (this.Instance === null || this.Instance === undefined) {
            this.Instance = new ServerImplemented();
        }
        return this.Instance;
    };
    ServerImplemented.prototype.getClient = function () {
        var self = this;
        if (self.pomelo !== null) {
            return self.pomelo;
        }
        else {
            console.warn("disconnected.");
        }
    };
    ServerImplemented.prototype.dispose = function () {
        console.warn("dispose socket client.");
        this.disConnect();
        this.authenData = null;
        ServerImplemented.Instance = null;
    };
    ServerImplemented.prototype.disConnect = function (callBack) {
        var self = this;
        if (!!self.pomelo) {
            self.pomelo.removeAllListeners();
            self.pomelo.disconnect().then(function () {
                if (callBack)
                    callBack();
            });
        }
        else {
            if (callBack)
                callBack();
        }
    };
    ServerImplemented.prototype.logout = function () {
        console.log('logout request');
        var self = this;
        var registrationId = "";
        var msg = {};
        msg["username"] = this.username;
        msg["registrationId"] = registrationId;
        if (self.pomelo != null)
            self.pomelo.notify("connector.entryHandler.logout", msg);
        this.disConnect();
        self.pomelo = null;
    };
    ServerImplemented.prototype.init = function (callback) {
        console.log('serverImp.init()');
        var self = this;
        this._isConnected = false;
        self.pomelo = Pomelo;
        self.host = Config.Stalk.chat;
        self.port = parseInt(Config.Stalk.port);
        if (!!self.pomelo) {
            //<!-- Connecting gate server.
            var params = { host: self.host, port: self.port, reconnect: false };
            self.connectServer(params, function (err) {
                callback(err, self);
            });
        }
        else {
            console.warn("pomelo socket is un ready.");
        }
    };
    ServerImplemented.prototype.connectServer = function (params, callback) {
        var self = this;
        console.log("socket connecting to: ", params);
        self.pomelo.init(params, function cb(err) {
            console.log("socket init result: ", err);
            callback(err);
        });
    };
    // region <!-- Authentication...
    /// <summary>
    /// Connect to gate server then get query of connector server.
    /// </summary>
    ServerImplemented.prototype.logIn = function (_username, _hash, deviceToken, callback) {
        var self = this;
        if (!!self.pomelo && this._isConnected === false) {
            var msg = { uid: _username };
            //<!-- Quering connector server.
            self.pomelo.request("gate.gateHandler.queryEntry", msg, function (result) {
                console.log("QueryConnectorServ", JSON.stringify(result));
                if (result.code === httpStatusCode_1.default.success) {
                    self.disConnect();
                    var connectorPort = result.port;
                    //<!-- Connecting to connector server.
                    var params = { host: self.host, port: connectorPort, reconnect: true };
                    self.connectServer(params, function (err) {
                        self._isConnected = true;
                        if (!!err) {
                            callback(err, null);
                        }
                        else {
                            self.authenForFrontendServer(_username, _hash, deviceToken, callback);
                        }
                    });
                }
            });
        }
        else if (!!self.pomelo && this._isConnected) {
            self.authenForFrontendServer(_username, _hash, deviceToken, callback);
        }
        else {
            console.warn("pomelo client is null: connecting status %s", this._isConnected);
            console.log("Automatic init pomelo socket...");
            self.init(function (err, res) {
                if (err) {
                    console.warn("Cannot starting pomelo socket!");
                    callback(err, null);
                }
                else {
                    console.log("Init socket success.");
                    self.logIn(_username, _hash, deviceToken, callback);
                }
            });
        }
    };
    //<!-- Authentication. request for token sign.
    ServerImplemented.prototype.authenForFrontendServer = function (_username, _hash, deviceToken, callback) {
        var self = this;
        var msg = {};
        msg["email"] = _username;
        msg["password"] = _hash;
        msg["registrationId"] = deviceToken;
        //<!-- Authentication.
        self.pomelo.request("connector.entryHandler.login", msg, function (res) {
            console.log("login response: ", JSON.stringify(res));
            if (res.code === httpStatusCode_1.default.fail) {
                if (callback != null) {
                    callback(res.message, null);
                }
            }
            else if (res.code === httpStatusCode_1.default.success) {
                if (callback != null) {
                    callback(null, res);
                }
                self.pomelo.on('disconnect', function data(reason) {
                    self._isConnected = false;
                });
            }
            else {
                if (callback !== null) {
                    callback(null, res);
                }
            }
        });
    };
    ServerImplemented.prototype.gateEnter = function (uid) {
        var _this = this;
        var self = this;
        var msg = { uid: uid };
        return new Promise(function (resolve, rejected) {
            if (!!self.pomelo && _this._isConnected === false) {
                //<!-- Quering connector server.
                self.pomelo.request("gate.gateHandler.queryEntry", msg, function (result) {
                    console.log("gateEnter", JSON.stringify(result));
                    if (result.code === httpStatusCode_1.default.success) {
                        self.disConnect();
                        var data = { host: self.host, port: result.port };
                        resolve(data);
                    }
                    else {
                        rejected(result);
                    }
                });
            }
            else {
                var message = "pomelo client is null: connecting status is " + self._isConnected;
                console.log("Automatic init pomelo socket...");
                rejected(message);
            }
        });
    };
    ServerImplemented.prototype.connectorEnter = function (msg) {
        var self = this;
        return new Promise(function (resolve, rejected) {
            //<!-- Authentication.
            self.pomelo.request("connector.entryHandler.login", msg, function (res) {
                if (res.code === httpStatusCode_1.default.fail) {
                    rejected(res.message);
                }
                else if (res.code === httpStatusCode_1.default.success) {
                    resolve(res);
                    self.pomelo.on('disconnect', function data(reason) {
                        self._isConnected = false;
                    });
                }
                else {
                    resolve(res);
                }
            });
        });
    };
    ServerImplemented.prototype.TokenAuthen = function (tokenBearer, checkTokenCallback) {
        var _this = this;
        var self = this;
        var msg = {};
        msg["token"] = tokenBearer;
        self.pomelo.request("gate.gateHandler.authenGateway", msg, function (result) {
            _this.OnTokenAuthenticate(result, checkTokenCallback);
        });
    };
    ServerImplemented.prototype.OnTokenAuthenticate = function (tokenRes, onSuccessCheckToken) {
        if (tokenRes.code === httpStatusCode_1.default.success) {
            var data = tokenRes.data;
            var decode = data.decoded; //["decoded"];
            var decodedModel = JSON.parse(JSON.stringify(decode));
            if (onSuccessCheckToken != null)
                onSuccessCheckToken(null, { success: true, username: decodedModel.email, password: decodedModel.password });
        }
        else {
            if (onSuccessCheckToken != null)
                onSuccessCheckToken(tokenRes, null);
        }
    };
    ServerImplemented.prototype.kickMeAllSession = function (uid) {
        var self = this;
        if (self.pomelo !== null) {
            var msg = { uid: uid };
            self.pomelo.request("connector.entryHandler.kickMe", msg, function (result) {
                console.log("kickMe", JSON.stringify(result));
            });
        }
    };
    ServerImplemented.connectionProblemString = 'Server connection is unstable.';
    return ServerImplemented;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ServerImplemented;
