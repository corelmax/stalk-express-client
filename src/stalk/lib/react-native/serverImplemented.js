/**
 * Stalk-JavaScript, Node.js client. Supported react-native.
 * Support by@ nattapon.r@live.com
 *
 * Ahoo Studio.co.th
 */
"use strict";
var httpStatusCode_1 = require('./utils/httpStatusCode');
var Pomelo = require('../pomelo/webSocketClient');
var config_1 = require('../../configs/config');
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
        self.host = config_1.default.Stalk.chat;
        self.port = parseInt(config_1.default.Stalk.port);
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
    //<@--- ServerAPIProvider.
    //region <!-- user profile -->
    ServerImplemented.prototype.UpdateUserProfile = function (myId, profileFields, callback) {
        var self = this;
        profileFields["token"] = this.authenData.token;
        profileFields["_id"] = myId;
        self.pomelo.request("auth.profileHandler.profileUpdate", profileFields, function (result) {
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.ProfileImageChanged = function (userId, path, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["userId"] = userId;
        msg["path"] = path;
        self.pomelo.request("auth.profileHandler.profileImageChanged", msg, function (result) {
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.getLastAccessRoomsInfo = function (msg, callback) {
        var self = this;
        //<!-- Get user info.
        self.pomelo.request("connector.entryHandler.getLastAccessRooms", msg, function (result) {
            if (callback !== null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.getMe = function (msg, callback) {
        var self = this;
        //<!-- Get user info.
        self.pomelo.request("connector.entryHandler.getMe", msg, function (result) {
            if (callback !== null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.updateFavoriteMember = function (editType, member, callback) {
        var self = this;
        var msg = {};
        msg["editType"] = editType;
        msg["member"] = member;
        msg["token"] = this.authenData.token;
        //<!-- Get user info.
        self.pomelo.request("auth.profileHandler.editFavoriteMembers", msg, function (result) {
            console.log("updateFavoriteMember: ", JSON.stringify(result));
            callback(null, result);
        });
    };
    ServerImplemented.prototype.updateFavoriteGroups = function (editType, group, callback) {
        var self = this;
        var msg = {};
        msg["editType"] = editType;
        msg["group"] = group;
        msg["token"] = this.authenData.token;
        //<!-- Get user info.
        self.pomelo.request("auth.profileHandler.updateFavoriteGroups", msg, function (result) {
            console.log("updateFavoriteGroups: ", JSON.stringify(result));
            callback(null, result);
        });
    };
    ServerImplemented.prototype.updateClosedNoticeMemberList = function (editType, member, callback) {
        var self = this;
        var msg = {};
        msg["editType"] = editType;
        msg["member"] = member;
        msg["token"] = this.authenData.token;
        //<!-- Get user info.
        self.pomelo.request("auth.profileHandler.updateClosedNoticeUsers", msg, function (result) {
            console.log("updateClosedNoticeUsers: ", JSON.stringify(result));
            callback(null, result);
        });
    };
    ServerImplemented.prototype.updateClosedNoticeGroupsList = function (editType, group, callback) {
        var self = this;
        var msg = {};
        msg["editType"] = editType;
        msg["group"] = group;
        msg["token"] = this.authenData.token;
        //<!-- Get user info.
        self.pomelo.request("auth.profileHandler.updateClosedNoticeGroups", msg, function (result) {
            console.log("updateClosedNoticeGroups: ", JSON.stringify(result));
            callback(null, result);
        });
    };
    ServerImplemented.prototype.getMemberProfile = function (userId, callback) {
        var self = this;
        var msg = {};
        msg["userId"] = userId;
        self.pomelo.request("auth.profileHandler.getMemberProfile", msg, function (result) {
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    //endregion
    //region  Company data. 
    /// <summary>
    /// Gets the company info.
    /// Beware for data loading so mush. please load from cache before load from server.
    /// </summary>
    ServerImplemented.prototype.getCompanyInfo = function (callBack) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        self.pomelo.request("connector.entryHandler.getCompanyInfo", msg, function (result) {
            if (callBack != null)
                callBack(null, result);
        });
    };
    /// <summary>
    /// Gets the company members.
    /// Beware for data loading so mush. please load from cache before load from server.
    /// </summary>
    ServerImplemented.prototype.getCompanyMembers = function (callBack) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        self.pomelo.request("connector.entryHandler.getCompanyMember", msg, function (result) {
            console.log("getCompanyMembers", JSON.stringify(result));
            if (callBack != null)
                callBack(null, result);
        });
    };
    /// <summary>
    /// Gets the company chat rooms.
    /// Beware for data loading so mush. please load from cache before load from server.
    /// </summary>
    ServerImplemented.prototype.getOrganizationGroups = function (callBack) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        self.pomelo.request("connector.entryHandler.getCompanyChatRoom", msg, function (result) {
            console.log("getOrganizationGroups: " + JSON.stringify(result));
            if (callBack != null)
                callBack(null, result);
        });
    };
    //endregion
    //region Project base.
    ServerImplemented.prototype.getProjectBaseGroups = function (callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        self.pomelo.request("connector.entryHandler.getProjectBaseGroups", msg, function (result) {
            console.log("getProjectBaseGroups: " + JSON.stringify(result));
            if (callback != null)
                callback(null, result);
        });
    };
    ServerImplemented.prototype.requestCreateProjectBaseGroup = function (groupName, members, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["groupName"] = groupName;
        msg["members"] = JSON.stringify(members);
        self.pomelo.request("chat.chatRoomHandler.requestCreateProjectBase", msg, function (result) {
            console.log("requestCreateProjectBaseGroup: " + JSON.stringify(result));
            if (callback != null)
                callback(null, result);
        });
    };
    ServerImplemented.prototype.editMemberInfoInProjectBase = function (roomId, roomType, member, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["roomId"] = roomId;
        msg["roomType"] = roomType.toString();
        msg["member"] = JSON.stringify(member);
        self.pomelo.request("chat.chatRoomHandler.editMemberInfoInProjectBase", msg, function (result) {
            if (callback != null)
                callback(null, result);
        });
    };
    //endregion
    //region <!-- Private Group Room... -->
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// <summary>
    /// Gets the public group chat rooms.
    /// Beware for data loading so mush. please load from cache before load from server.
    /// </summary>
    /// <param name="callback">Callback.</param>
    ServerImplemented.prototype.getPrivateGroups = function (callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        self.pomelo.request("connector.entryHandler.getMyPrivateGroupChat", msg, function (result) {
            console.log("getPrivateGroups: " + JSON.stringify(result));
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.UserRequestCreateGroupChat = function (groupName, memberIds, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["groupName"] = groupName;
        msg["memberIds"] = JSON.stringify(memberIds);
        self.pomelo.request("chat.chatRoomHandler.userCreateGroupChat", msg, function (result) {
            console.log("RequestCreateGroupChat", JSON.stringify(result));
            if (callback != null)
                callback(null, result);
        });
    };
    ServerImplemented.prototype.UpdatedGroupImage = function (groupId, path, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["groupId"] = groupId;
        msg["path"] = path;
        self.pomelo.request("chat.chatRoomHandler.updateGroupImage", msg, function (result) {
            console.log("UpdatedGroupImage", JSON.stringify(result));
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.editGroupMembers = function (editType, roomId, roomType, members, callback) {
        var self = this;
        if (editType == null || editType.length === 0)
            return;
        if (roomId == null || roomId.length === 0)
            return;
        if (roomType === null)
            return;
        if (members == null || members.length === 0)
            return;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["editType"] = editType;
        msg["roomId"] = roomId;
        msg["roomType"] = roomType.toString();
        msg["members"] = JSON.stringify(members);
        self.pomelo.request("chat.chatRoomHandler.editGroupMembers", msg, function (result) {
            console.log("editGroupMembers response." + result.toString());
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.editGroupName = function (roomId, roomType, newGroupName, callback) {
        var self = this;
        if (roomId == null || roomId.length === 0)
            return;
        if (roomType === null)
            return;
        if (newGroupName == null || newGroupName.length === 0)
            return;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["roomId"] = roomId;
        msg["roomType"] = roomType.toString();
        msg["newGroupName"] = newGroupName;
        self.pomelo.request("chat.chatRoomHandler.editGroupName", msg, function (result) {
            console.log("editGroupName response." + result.toString());
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    /// <summary>
    /// Gets Private Chat Room.
    /// </summary>
    /// <param name="myId">My identifier.</param>
    /// <param name="myRoommateId">My roommate identifier.</param>
    ServerImplemented.prototype.getPrivateChatRoomId = function (token, myId, myRoommateId, callback) {
        var self = this;
        var msg = {};
        msg["token"] = token;
        msg["ownerId"] = myId;
        msg["roommateId"] = myRoommateId;
        self.pomelo.request("chat.chatRoomHandler.getRoomById", msg, function (result) {
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    //<!-- Join and leave chat room.
    ServerImplemented.prototype.JoinChatRoomRequest = function (token, username, room_id, callback) {
        var self = this;
        var msg = {};
        msg["token"] = token;
        msg["rid"] = room_id;
        msg["username"] = username;
        self.pomelo.request("connector.entryHandler.enterRoom", msg, function (result) {
            console.log("JoinChatRoom: " + JSON.stringify(result));
            if (callback !== null) {
                callback(null, result);
            }
        });
    };
    ServerImplemented.prototype.LeaveChatRoomRequest = function (token, roomId, username, callback) {
        var self = this;
        var msg = {};
        msg["token"] = token;
        msg["rid"] = roomId;
        msg["username"] = username;
        self.pomelo.request("connector.entryHandler.leaveRoom", msg, function (result) {
            if (callback != null)
                callback(null, result);
        });
    };
    /// <summary>
    /// Gets the room info. For load Room info by room_id.
    /// </summary>
    /// <c> return data</c>
    ServerImplemented.prototype.getRoomInfo = function (msg, callback) {
        var self = this;
        self.pomelo.request("chat.chatRoomHandler.getRoomInfo", msg, function (result) {
            if (callback != null)
                callback(null, result);
        });
    };
    ServerImplemented.prototype.getUnreadMsgOfRoom = function (msg, callback) {
        var self = this;
        self.pomelo.request("chat.chatRoomHandler.getUnreadRoomMessage", msg, function (result) {
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    //endregion
    // region <!-- Web RTC Calling...
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// <summary>
    /// Videos the call requesting.
    /// - tell target client for your call requesting...
    /// </summary>
    ServerImplemented.prototype.videoCallRequest = function (targetId, myRtcId, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["targetId"] = targetId;
        msg["myRtcId"] = myRtcId;
        self.pomelo.request("connector.entryHandler.videoCallRequest", msg, function (result) {
            console.log("videoCallRequesting =>: " + JSON.stringify(result));
            if (callback != null)
                callback(null, result);
        });
    };
    ServerImplemented.prototype.voiceCallRequest = function (targetId, myRtcId, callback) {
        var self = this;
        var msg = {};
        msg["token"] = this.authenData.token;
        msg["targetId"] = targetId;
        msg["myRtcId"] = myRtcId;
        self.pomelo.request("connector.entryHandler.voiceCallRequest", msg, function (result) {
            console.log("voiceCallRequesting =>: " + JSON.stringify(result));
            if (callback != null)
                callback(null, result);
        });
    };
    ServerImplemented.prototype.hangupCall = function (myId, contactId) {
        var self = this;
        var msg = {};
        msg["userId"] = myId;
        msg["contactId"] = contactId;
        msg["token"] = this.authenData.token;
        self.pomelo.request("connector.entryHandler.hangupCall", msg, function (result) {
            console.log("hangupCall: ", JSON.stringify(result));
        });
    };
    ServerImplemented.prototype.theLineIsBusy = function (contactId) {
        var self = this;
        var msg = {};
        msg["contactId"] = contactId;
        self.pomelo.request("connector.entryHandler.theLineIsBusy", msg, function (result) {
            console.log("theLineIsBusy response: " + JSON.stringify(result));
        });
    };
    ServerImplemented.connectionProblemString = 'Server connection is unstable.';
    return ServerImplemented;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ServerImplemented;
