"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const serverImplemented_1 = require("./lib/node/serverImplemented");
const stalk = serverImplemented_1.default.getInstance();
function initStalk() {
    return new Promise((resolve, reject) => {
        stalk.init((err, result) => {
            if (err) {
                console.error("init stalk fail: ", err.message);
                stalk._isConnected = false;
                reject(err.message);
                return;
            }
            console.log("Stalk init success.");
            stalk._isConnected = true;
            stalk.pomelo.on("disconnect", function data(reason) {
                stalk._isConnected = false;
            });
            resolve(stalk);
        });
    });
}
function pushMessage(msg) {
    return new Promise((resolve, reject) => {
        if (stalk._isConnected) {
            stalk.getClient().request("push.pushHandler.push", msg, (result) => {
                console.log("request result", result);
            });
            resolve(stalk);
        }
        else {
            reject(stalk);
        }
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        initStalk().then(stalk => {
            if (!stalk._isConnected) {
                return false;
            }
            return true;
        }).catch(err => {
            return false;
        });
    });
}
exports.init = init;
/**
 * For test call api omly...
 */
function testCall() {
    let msg = {};
    msg["event"] = "Test api.";
    msg["message"] = "test api from express.js client.";
    msg["timestamp"] = new Date();
    msg["members"] = "*";
    pushMessage(msg).catch((stalk) => {
        init().then(boo => {
            if (boo) {
                testCall();
            }
        });
    });
}
exports.testCall = testCall;
function push(msg) {
    pushMessage(msg).catch((stalk) => {
        init().then(boo => {
            if (boo) {
                push(msg);
            }
        });
    });
}
exports.push = push;
