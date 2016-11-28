"use strict";
var serverImplemented_1 = require("./stalk/serverImplemented");
var StalkEvent = require("./stalkEvents");
var stalk = serverImplemented_1.default.getInstance();
function init() {
    stalk.init(function (err, result) {
        if (err) {
            console.error("init stalk fail: ", err);
            return;
        }
        console.log("Stalk init success.");
        var msg = {};
        msg["event"] = StalkEvent.LINK_REQUEST;
        msg["message"] = "test send message from express.js";
        msg["timestamp"] = new Date();
        msg["members"] = ["5825989781f6cb1b5fbb396e", "582425ca0d731841dcf84e56", "582402787db849780682c63f"];
        stalk.getClient().request("push.pushHandler.push", msg, function (result) {
            console.log("request success", result);
        });
    });
}
exports.init = init;
