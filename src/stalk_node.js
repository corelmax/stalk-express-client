"use strict";
const serverImplemented_1 = require("./lib/node/serverImplemented");
const stalk = serverImplemented_1.default.getInstance();
function init() {
    return new Promise((resolve, reject) => {
        stalk.init((err, result) => {
            if (err) {
                console.error("init stalk fail: ", err);
                stalk._isConnected = false;
                reject(err);
                return;
            }
            console.log("Stalk init success.");
            stalk._isConnected = true;
            resolve(stalk);
        });
    });
}
exports.init = init;
function pushMessage(msg) {
    stalk.getClient().request("push.pushHandler.push", msg, (result) => {
        console.log("request result", result);
    });
}
exports.pushMessage = pushMessage;
