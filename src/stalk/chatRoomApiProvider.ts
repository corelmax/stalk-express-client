import { IDictionary } from "./serverImplemented";

export interface IMetaFile {
    thumbnail: string;
    filename: string;
    extension: string;
    fileSize: string;
}
export interface IMessage {
    rid: string;
    content: string;
    sender: string;
    target: string;
    type: string;
    uuid: string;
    mata: IMetaFile;
}


export default class ChatRoomApiProvider {
    pomelo : any;
    constructor(socket) {
        this.pomelo = socket;
    }

    public chat(target: string, _message: IMessage, callback: (err, res) => void) {
        this.pomelo.request("chat.chatHandler.send", _message, (result) => {
            let data = JSON.parse(JSON.stringify(result));

            if (callback !== null)
                callback(null, data);
        });
    }

/**
 * @deprecated please use chat instead.
 */
    public chatFile(room_id: string, target: string, sender_id: string, fileUrl: string, contentType: string, meta: any, callback: (err, res) => void) {
        console.log("Send file to ", target);

        var message: IDictionary = {};
        message["rid"] = room_id;
        message["content"] = fileUrl;
        message["sender"] = sender_id;
        message["target"] = target;
        message["meta"] = meta;
        message["type"] = contentType;
        this.pomelo.request("chat.chatHandler.send", message, (result) => {
            var data = JSON.parse(JSON.stringify(result));
            console.log("chatFile callback: ", data);

            if (data.code == 200) {
                if (callback != null) {
                    callback(null, data.data);
                }
            }
            else {
                console.error("WTF", "WTF god only know.");
            }
        });
    }

    public getSyncDateTime(callback: (err, res) => void) {
        var message: IDictionary = {};
        this.pomelo.request("chat.chatHandler.getSyncDateTime", message, (result) => {
            if (callback != null) {
                callback(null, result);
            }
        });
    }


    /**
     * getChatHistory function used for pull history chat record...
     * Beware!!! please call before JoinChatRoom.
     * @param room_id
     * @param lastAccessTime
     * @param callback
     */
    public getChatHistory(room_id: string, lastAccessTime: Date, callback: (err, res) => void) {
        var message: IDictionary = {};
        message["rid"] = room_id;
        if (lastAccessTime != null) {
            //<!-- Only first communication is has a problem.
            message["lastAccessTime"] = lastAccessTime.toString();
        }

        this.pomelo.request("chat.chatHandler.getChatHistory", message, (result) => {
            if (callback !== null)
                callback(null, result);
        });
    }

    /**
     * get older message histories.
     */
    public getOlderMessageChunk(roomId: string, topEdgeMessageTime: Date, callback: (err, res) => void) {
        var message: IDictionary = {};
        message["rid"] = roomId;
        message["topEdgeMessageTime"] = topEdgeMessageTime.toString();

        this.pomelo.request("chat.chatHandler.getOlderMessageChunk", message, (result) => {
            if (callback !== null)
                callback(null, result);
        });
    }

    public checkOlderMessagesCount(roomId: string, topEdgeMessageTime: Date, callback: (err, res) => void) {
        let message: IDictionary = {};
        message["rid"] = roomId;
        message["topEdgeMessageTime"] = topEdgeMessageTime.toString();

        this.pomelo.request("chat.chatHandler.checkOlderMessagesCount", message, (result) => {
            if (callback !== null)
                callback(null, result);
        });
    }

    public getMessagesReaders(topEdgeMessageTime: string) {
        var message: IDictionary = {};
        message["topEdgeMessageTime"] = topEdgeMessageTime;
        this.pomelo.request("chat.chatHandler.getMessagesReaders", message, (result) => {
            console.info('getMessagesReaders respones: ', result);
        });
    }

    public getMessageContent(messageId: string, callback: (err: Error, res: any) => void) {
        var message: IDictionary = {};
        message["messageId"] = messageId;
        this.pomelo.request("chat.chatHandler.getMessageContent", message, (result) => {
            if (!!callback) {
                callback(null, result);
            }
        });
    }

    public updateMessageReader(messageId: string, roomId: string) {
        var message: IDictionary = {};
        message["messageId"] = messageId;
        message["roomId"] = roomId;
        this.pomelo.notify("chat.chatHandler.updateWhoReadMessage", message);
    }

    public updateMessageReaders(messageIds: string[], roomId: string) {
        var message: IDictionary = {};
        message["messageIds"] = JSON.stringify(messageIds);
        message["roomId"] = roomId;
        this.pomelo.notify("chat.chatHandler.updateWhoReadMessages", message);
    }
}