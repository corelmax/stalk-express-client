import ServerImp, { IDictionary } from "./lib/node/serverImplemented";

const stalk = ServerImp.getInstance();
export type Dict = IDictionary;
export type Stalk = ServerImp;

function initStalk(): Promise<ServerImp> {
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

            stalk.pomelo.on("disconnect", function data(reason) {
                stalk._isConnected = false;
            });

            resolve(stalk);
        });
    });
}

function pushMessage(msg: IDictionary): Promise<ServerImp> {
    return new Promise((resolve, reject) => {
        if (stalk._isConnected) {
            stalk.getClient().request("push.pushHandler.push", msg, (result: any) => {
                console.log("request result", result);
            });

            resolve(stalk);
        }
        else {
            reject(stalk);
        }
    });
}

export async function init() {
    try {
        let stalk = await initStalk();

        if (!stalk._isConnected) return false;

        return true;
    }
    catch (ex) {
        if (ex) {
            console.error(ex.message);
        }

        return false;
    }
}

/**
 * For test call api omly...
 */
export function testCall() {
    let msg: IDictionary = {};
    msg["event"] = "Test api.";
    msg["message"] = "test api from express.js client.";
    msg["timestamp"] = new Date();
    msg["members"] = "*";

    pushMessage(msg).catch((stalk: ServerImp) => {
        init().then(boo => {
            if (boo) testCall();
        });
    });
}

export function push(msg: IDictionary) {
    pushMessage(msg).catch((stalk: ServerImp) => {
        init().then(boo => {
            if (boo) push(msg);
        });
    });
}