"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
/// original WebSocket.
/// https://github.com/websockets/ws
/// https://davidwalsh.name/websocket
const StalkFactory = require("./stalk_node");
// import * as StalkFactory from "stalk-js/stalk_node";
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        let stalk = yield StalkFactory.init();
        if (!stalk._isConnected)
            return false;
        return true;
    });
}
exports.init = init;
function call() {
    let msg = {};
    msg["event"] = "Test api.";
    msg["message"] = "test api from express.js client.";
    msg["timestamp"] = new Date();
    msg["members"] = "*";
    StalkFactory.pushMessage(msg).catch((stalk) => {
        init().then(boo => {
            if (boo)
                call();
        });
    });
}
exports.call = call;
