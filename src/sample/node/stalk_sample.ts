

/// original WebSocket.
/// https://github.com/websockets/ws
/// https://davidwalsh.name/websocket
import * as StalkFactory from "../../stalk_node";
// import * as StalkFactory from "stalk-js/stalk_node";

export async function init() {
    let stalk = await StalkFactory.init();

    if (!stalk._isConnected) return false;

    return true;
}

/**
 * For test call api omly...
 */
export function testCall() {
    let msg: StalkFactory.Dict = {};
    msg["event"] = "Test api.";
    msg["message"] = "test api from express.js client.";
    msg["timestamp"] = new Date();
    msg["members"] = "*";

    StalkFactory.pushMessage(msg).catch((stalk: StalkFactory.Stalk) => {
        init().then(boo => {
            if (boo) testCall();
        });
    });
}

export function push(msg: StalkFactory.Dict) {
    StalkFactory.pushMessage(msg).catch((stalk: StalkFactory.Stalk) => {
        init().then(boo => {
            if (boo) push(msg);
        });
    });
}



