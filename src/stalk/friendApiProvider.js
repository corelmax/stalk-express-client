"use strict";
var serverImplemented_1 = require("./serverImplemented");
/**
 * FriendApiProvider
 */
var FriendApiProvider = (function () {
    function FriendApiProvider() {
        console.log("FriendApiProvider constructor");
    }
    FriendApiProvider.getInstance = function () {
        if (!FriendApiProvider.instance) {
            FriendApiProvider.instance = new FriendApiProvider();
        }
        return FriendApiProvider.instance;
    };
    FriendApiProvider.prototype.friendRequest = function (token, myId, targetUid, callback) {
        console.log('friendRequest', token);
        var self = this;
        var msg = {};
        msg["token"] = token;
        msg["targetUid"] = targetUid;
        serverImplemented_1.default.getInstance().pomelo.request("auth.userHandler.addFriend", msg, function (result) {
            if (callback != null) {
                callback(null, result);
            }
        });
    };
    return FriendApiProvider;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FriendApiProvider;
