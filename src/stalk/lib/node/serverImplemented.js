/**
 * Stalk-JavaScript, Node.js client. Supported express.js framework.
 * Support by@ nattapon.r@live.com
 *
 * Ahoo Studio.co.th
 */
"use strict";
const httpStatusCode_1 = require('../utils/httpStatusCode');
const Pomelo = require('../pomelo/nodeWSClient');
const Config = require(_global + '/stalk_config.json');
class AuthenData {
}
class ServerImplemented {
    constructor() {
        this._isConnected = false;
        this._isLogedin = false;
        this.connect = this.connectServer;
        console.log("serv imp. constructor");
    }
    static getInstance() {
        if (this.Instance === null || this.Instance === undefined) {
            this.Instance = new ServerImplemented();
        }
        return this.Instance;
    }
    getClient() {
        let self = this;
        if (self.pomelo !== null) {
            return self.pomelo;
        }
        else {
            console.warn("disconnected.");
        }
    }
    dispose() {
        console.warn("dispose socket client.");
        this.disConnect();
        this.authenData = null;
        ServerImplemented.Instance = null;
    }
    disConnect(callBack) {
        let self = this;
        if (!!self.pomelo) {
            self.pomelo.removeAllListeners();
            self.pomelo.disconnect().then(() => {
                if (callBack)
                    callBack();
            });
        }
        else {
            if (callBack)
                callBack();
        }
    }
    logout() {
        console.log('logout request');
        let self = this;
        let registrationId = "";
        let msg = {};
        msg["username"] = this.username;
        msg["registrationId"] = registrationId;
        if (self.pomelo != null)
            self.pomelo.notify("connector.entryHandler.logout", msg);
        this.disConnect();
        self.pomelo = null;
    }
    init(callback) {
        console.log('serverImp.init()');
        let self = this;
        this._isConnected = false;
        self.pomelo = Pomelo;
        self.host = Config.Stalk.chat;
        self.port = parseInt(Config.Stalk.port);
        if (!!self.pomelo) {
            //<!-- Connecting gate server.
            let params = { host: self.host, port: self.port, reconnect: false };
            self.connectServer(params, (err) => {
                callback(err, self);
            });
        }
        else {
            console.warn("pomelo socket is un ready.");
        }
    }
    connectServer(params, callback) {
        let self = this;
        console.log("socket connecting to: ", params);
        self.pomelo.init(params, function cb(err) {
            console.log("socket init result: ", err);
            callback(err);
        });
    }
    // region <!-- Authentication...
    /// <summary>
    /// Connect to gate server then get query of connector server.
    /// </summary>
    logIn(_username, _hash, deviceToken, callback) {
        let self = this;
        if (!!self.pomelo && this._isConnected === false) {
            let msg = { uid: _username };
            //<!-- Quering connector server.
            self.pomelo.request("gate.gateHandler.queryEntry", msg, function (result) {
                console.log("QueryConnectorServ", JSON.stringify(result));
                if (result.code === httpStatusCode_1.default.success) {
                    self.disConnect();
                    let connectorPort = result.port;
                    //<!-- Connecting to connector server.
                    let params = { host: self.host, port: connectorPort, reconnect: true };
                    self.connectServer(params, (err) => {
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
            self.init((err, res) => {
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
    }
    //<!-- Authentication. request for token sign.
    authenForFrontendServer(_username, _hash, deviceToken, callback) {
        let self = this;
        let msg = {};
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
    }
    gateEnter(uid) {
        let self = this;
        let msg = { uid: uid };
        return new Promise((resolve, rejected) => {
            if (!!self.pomelo && this._isConnected === false) {
                //<!-- Quering connector server.
                self.pomelo.request("gate.gateHandler.queryEntry", msg, function (result) {
                    console.log("gateEnter", JSON.stringify(result));
                    if (result.code === httpStatusCode_1.default.success) {
                        self.disConnect();
                        let data = { host: self.host, port: result.port };
                        resolve(data);
                    }
                    else {
                        rejected(result);
                    }
                });
            }
            else {
                let message = "pomelo client is null: connecting status is " + self._isConnected;
                console.log("Automatic init pomelo socket...");
                rejected(message);
            }
        });
    }
    connectorEnter(msg) {
        let self = this;
        return new Promise((resolve, rejected) => {
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
    }
    TokenAuthen(tokenBearer, checkTokenCallback) {
        let self = this;
        let msg = {};
        msg["token"] = tokenBearer;
        self.pomelo.request("gate.gateHandler.authenGateway", msg, (result) => {
            this.OnTokenAuthenticate(result, checkTokenCallback);
        });
    }
    OnTokenAuthenticate(tokenRes, onSuccessCheckToken) {
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
    }
    kickMeAllSession(uid) {
        let self = this;
        if (self.pomelo !== null) {
            var msg = { uid: uid };
            self.pomelo.request("connector.entryHandler.kickMe", msg, function (result) {
                console.log("kickMe", JSON.stringify(result));
            });
        }
    }
}
ServerImplemented.connectionProblemString = 'Server connection is unstable.';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ServerImplemented;
