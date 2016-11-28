import Stalk, { IDictionary } from "./serverImplemented";

/**
 * FriendApiProvider
 */
export default class FriendApiProvider {
    private static instance : FriendApiProvider;
    public static getInstance() : FriendApiProvider {
        if(!FriendApiProvider.instance) {
            FriendApiProvider.instance = new FriendApiProvider();
        }
        return FriendApiProvider.instance;
    }

    constructor() {
        console.log("FriendApiProvider constructor");
    }

    public friendRequest(token: string, myId: string, targetUid: string, callback: (err, res) => void) {
        console.log('friendRequest', token);
        
        let self = this;
        let msg: IDictionary = {};
        msg["token"] = token;
        msg["targetUid"] = targetUid;

        Stalk.getInstance().pomelo.request("auth.userHandler.addFriend", msg, (result) => {
            if (callback != null) {
                callback(null, result);
            }
        });
    }
}