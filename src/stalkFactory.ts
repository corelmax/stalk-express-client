import ServerImp, { IDictionary } from "./stalk/lib/node/serverImplemented";
import * as StalkEvent from "./stalkEvents";

const stalk = ServerImp.getInstance();

export function init() {
    stalk.init((err, result) => {
        if (err) {
            console.error("init stalk fail: ", err);
            return;
        }

        console.log("Stalk init success.");

        let msg = {};
        msg["event"] = StalkEvent.LINK_REQUEST;
        msg["message"] = "test send message from express.js";
        msg["timestamp"] = new Date();
        msg["members"] = ["5825989781f6cb1b5fbb396e", "582425ca0d731841dcf84e56", "582402787db849780682c63f"];
        pushMessage(msg);
    });
}

export function pushMessage(msg: IDictionary) {
    stalk.getClient().request("push.pushHandler.push", msg, (result) => {
        console.log("request result", result);
    });
}