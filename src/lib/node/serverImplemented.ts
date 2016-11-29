/**
 * Stalk-JavaScript, Node.js client. Supported express.js framework.
 * Support by@ nattapon.r@live.com
 * 
 * Ahoo Studio.co.th 
 */

import HttpStatusCode from '../utils/httpStatusCode';
import TokenDecode from '../utils/tokenDecode';

const Pomelo = require('../pomelo/nodeWSClient');
const Config = require(_global + '/stalk_config.json');

export interface IDictionary {
    [k: string]: any;
}
interface IAuthenData {
    userId: string;
    token: string;
}
class AuthenData implements IAuthenData {
    userId: string;
    token: string;
}
export interface IPomeloParam {
    host: string, port: number, reconnect: boolean
}
export interface PomeloClient {
    init(params, cb);
    notify(route: string, msg: IDictionary);
    request(route: string, msg: IDictionary, cb);
    on(event: string, data);
    setReconnect(_reconnect: boolean);
    disconnect();
    removeAllListeners();
}

export default class ServerImplemented {
    private static Instance: ServerImplemented;
    public static getInstance(): ServerImplemented {
        if (this.Instance === null || this.Instance === undefined) {
            this.Instance = new ServerImplemented();
        }

        return this.Instance;
    }

    static connectionProblemString: string = 'Server connection is unstable.';

    pomelo: PomeloClient;
    host: string;
    port: number | string;
    authenData: AuthenData;
    _isConnected = false;
    _isLogedin = false;
    connect = this.connectServer;

    constructor() {
        console.log("serv imp. constructor");
    }

    public getClient() {
        let self = this;
        if (self.pomelo !== null) {
            return self.pomelo;
        }
        else {
            console.warn("disconnected.");
        }
    }

    public dispose() {
        console.warn("dispose socket client.");

        this.disConnect();

        this.authenData = null;

        ServerImplemented.Instance = null;
    }

    public disConnect(callBack?: Function) {
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

    public logout() {
        console.log('logout request');

        let self = this;
        let registrationId = "";
        let msg: IDictionary = {};
        msg["username"] = this.username;
        msg["registrationId"] = registrationId;
        if (self.pomelo != null)
            self.pomelo.notify("connector.entryHandler.logout", msg);

        this.disConnect();
        self.pomelo = null;
    }

    public init(callback: (err, res) => void) {
        console.log('serverImp.init()');

        let self = this;
        this._isConnected = false;
        self.pomelo = Pomelo;

        self.host = Config.Stalk.chat;
        self.port = parseInt(Config.Stalk.port);
        if (!!self.pomelo) {
            //<!-- Connecting gate server.
            let params: IPomeloParam = { host: self.host, port: self.port, reconnect: false };
            self.connectServer(params, (err) => {
                callback(err, self);
            });
        }
        else {
            console.warn("pomelo socket is un ready.");
        }
    }

    private connectServer(params: IPomeloParam, callback: (err) => void) {
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
    public logIn(_username: string, _hash: string, deviceToken: string, callback: (err, res) => void) {
        let self = this;

        if (!!self.pomelo && this._isConnected === false) {
            let msg = { uid: _username };
            //<!-- Quering connector server.
            self.pomelo.request("gate.gateHandler.queryEntry", msg, function (result) {

                console.log("QueryConnectorServ", JSON.stringify(result));

                if (result.code === HttpStatusCode.success) {
                    self.disConnect();

                    let connectorPort = result.port;
                    //<!-- Connecting to connector server.
                    let params: IPomeloParam = { host: self.host, port: connectorPort, reconnect: true };
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
    private authenForFrontendServer(_username: string, _hash: string, deviceToken: string, callback: (err, res) => void) {
        let self = this;

        let msg: IDictionary = {};
        msg["email"] = _username;
        msg["password"] = _hash;
        msg["registrationId"] = deviceToken;
        //<!-- Authentication.
        self.pomelo.request("connector.entryHandler.login", msg, function (res) {
            console.log("login response: ", JSON.stringify(res));

            if (res.code === HttpStatusCode.fail) {
                if (callback != null) {
                    callback(res.message, null);
                }
            }
            else if (res.code === HttpStatusCode.success) {
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

    public gateEnter(uid: string): Promise<any> {
        let self = this;

        let msg = { uid: uid };
        return new Promise((resolve, rejected) => {
            if (!!self.pomelo && this._isConnected === false) {
                //<!-- Quering connector server.
                self.pomelo.request("gate.gateHandler.queryEntry", msg, function (result) {

                    console.log("gateEnter", JSON.stringify(result));

                    if (result.code === HttpStatusCode.success) {
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
                // self.init((err, res) => {
                //     if (err) {
                //         console.warn("Cannot starting pomelo socket!");

                //         rejected(err);
                //     }
                //     else {
                //         console.log("Init socket success.");
                //         resolve();
                //     }
                // });
            }
        });
    }

    public connectorEnter(msg: IDictionary): Promise<any> {
        let self = this;

        return new Promise((resolve, rejected) => {
            //<!-- Authentication.
            self.pomelo.request("connector.entryHandler.login", msg, function (res) {
                if (res.code === HttpStatusCode.fail) {
                    rejected(res.message);
                }
                else if (res.code === HttpStatusCode.success) {
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

    public TokenAuthen(tokenBearer: string, checkTokenCallback: (err, res) => void) {
        let self = this;
        let msg: IDictionary = {};
        msg["token"] = tokenBearer;
        self.pomelo.request("gate.gateHandler.authenGateway", msg, (result) => {
            this.OnTokenAuthenticate(result, checkTokenCallback);
        });
    }

    private OnTokenAuthenticate(tokenRes: any, onSuccessCheckToken: (err, res) => void) {
        if (tokenRes.code === HttpStatusCode.success) {
            var data = tokenRes.data;
            var decode = data.decoded; //["decoded"];
            var decodedModel: TokenDecode = JSON.parse(JSON.stringify(decode));
            if (onSuccessCheckToken != null)
                onSuccessCheckToken(null, { success: true, username: decodedModel.email, password: decodedModel.password });
        }
        else {
            if (onSuccessCheckToken != null)
                onSuccessCheckToken(tokenRes, null);
        }
    }

    public kickMeAllSession(uid: string) {
        let self = this;
        if (self.pomelo !== null) {
            var msg = { uid: uid };
            self.pomelo.request("connector.entryHandler.kickMe", msg, function (result) {
                console.log("kickMe", JSON.stringify(result));
            });
        }
    }
}
