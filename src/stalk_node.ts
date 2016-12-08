import ServerImp, { IDictionary } from "./lib/node/serverImplemented";

const stalk = ServerImp.getInstance();
export type Dict = IDictionary;
export type Stalk = ServerImp;
export function init(): Promise<ServerImp> {
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

            stalk.pomelo.on('disconnect', function data(reason) {
                stalk._isConnected = false;
            });

            resolve(stalk);
        });
    });
}

export function pushMessage(msg: IDictionary): Promise<ServerImp> {
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