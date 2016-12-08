"use strict";
const serverImplemented_1 = require("./serverImplemented");
/**
 * FriendApiProvider
 */
class FriendApiProvider {
    static getInstance() {
        if (!FriendApiProvider.instance) {
            FriendApiProvider.instance = new FriendApiProvider();
        }
        return FriendApiProvider.instance;
    }
    constructor() {
        console.log("FriendApiProvider constructor");
    }
    friendRequest(token, myId, targetUid, callback) {
        console.log('friendRequest', token);
        let self = this;
        let msg = {};
        msg["token"] = token;
        msg["targetUid"] = targetUid;
        serverImplemented_1.default.getInstance().pomelo.request("auth.userHandler.addFriend", msg, (result) => {
            if (callback != null) {
                callback(null, result);
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FriendApiProvider;
