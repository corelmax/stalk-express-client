"use strict";
var ServerEventListener = (function () {
    function ServerEventListener(socket) {
        this.pomelo = socket;
    }
    ServerEventListener.prototype.addFrontendListener = function (obj) {
        this.frontendListener = obj;
    };
    ServerEventListener.prototype.addServerListener = function (obj) {
        this.serverListener = obj;
    };
    ServerEventListener.prototype.addChatListener = function (obj) {
        this.chatServerListener = obj;
    };
    ServerEventListener.prototype.addRTCListener = function (obj) {
        this.rtcCallListener = obj;
    };
    ServerEventListener.prototype.addListenner = function (resolve) {
        this.callFrontendServer();
        this.callChatServer();
        this.callRTCEvents();
        this.callServerEvents();
        if (!!resolve)
            resolve();
    };
    ServerEventListener.prototype.callFrontendServer = function () {
        var self = this;
        self.pomelo.on(ServerEventListener.ON_GET_ME, function (data) {
            console.log(ServerEventListener.ON_GET_ME, JSON.stringify(data));
            self.frontendListener.onGetMe(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_COMPANY_INFO, function (data) {
            console.log(ServerEventListener.ON_GET_COMPANY_INFO, JSON.stringify(data));
            self.frontendListener.onGetCompanyInfo(data);
        });
        //wait message from the server.
        self.pomelo.on(ServerEventListener.ON_GET_ORGANIZE_GROUPS, function (data) {
            console.log(ServerEventListener.ON_GET_ORGANIZE_GROUPS, JSON.stringify(data));
            self.frontendListener.onGetOrganizeGroupsComplete(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_COMPANY_MEMBERS, function (data) {
            console.log(ServerEventListener.ON_GET_COMPANY_MEMBERS, JSON.stringify(data));
            self.frontendListener.onGetCompanyMemberComplete(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_PRIVATE_GROUPS, function (data) {
            console.log(ServerEventListener.ON_GET_PRIVATE_GROUPS, JSON.stringify(data));
            self.frontendListener.onGetPrivateGroupsComplete(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_PROJECT_BASE_GROUPS, function (data) {
            console.log(ServerEventListener.ON_GET_PROJECT_BASE_GROUPS, JSON.stringify(data));
            self.frontendListener.onGetProjectBaseGroupsComplete(data);
        });
    };
    ServerEventListener.prototype.callChatServer = function () {
        var self = this;
        self.pomelo.on(ServerEventListener.ON_CHAT, function (data) {
            console.log(ServerEventListener.ON_CHAT, JSON.stringify(data));
            self.chatServerListener.onChat(data);
        });
        //pomelo.on(ServerEventListener.ON_ADD, (data) => {
        //    console.log(ServerEventListener.ON_ADD, data);
        //    self.onChatListener.on(data);
        //});
        self.pomelo.on(ServerEventListener.ON_LEAVE, function (data) {
            console.log(ServerEventListener.ON_LEAVE, JSON.stringify(data));
            self.chatServerListener.onLeaveRoom(data);
        });
        self.pomelo.on(ServerEventListener.ON_MESSAGE_READ, function (data) {
            // console.log(ServerEventListener.ON_MESSAGE_READ);
            self.chatServerListener.onMessageRead(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_MESSAGES_READERS, function (data) {
            // console.log(ServerEventListener.ON_GET_MESSAGES_READERS);
            self.chatServerListener.onGetMessagesReaders(data);
        });
    };
    ServerEventListener.prototype.callRTCEvents = function () {
        var self = this;
        self.pomelo.on(ServerEventListener.ON_VIDEO_CALL, function (data) {
            console.log(ServerEventListener.ON_VIDEO_CALL, JSON.stringify(data));
            self.rtcCallListener.onVideoCall(data);
        });
        self.pomelo.on(ServerEventListener.ON_VOICE_CALL, function (data) {
            console.log(ServerEventListener.ON_VOICE_CALL, JSON.stringify(data));
            self.rtcCallListener.onVoiceCall(data);
        });
        self.pomelo.on(ServerEventListener.ON_HANGUP_CALL, function (data) {
            console.log(ServerEventListener.ON_HANGUP_CALL, JSON.stringify(data));
            self.rtcCallListener.onHangupCall(data);
        });
        self.pomelo.on(ServerEventListener.ON_THE_LINE_IS_BUSY, function (data) {
            console.log(ServerEventListener.ON_THE_LINE_IS_BUSY, JSON.stringify(data));
            self.rtcCallListener.onTheLineIsBusy(data);
        });
    };
    ServerEventListener.prototype.callServerEvents = function () {
        var self = this;
        //<!-- AccessRoom Info -->
        self.pomelo.on(ServerEventListener.ON_ACCESS_ROOMS, function (data) {
            console.log(ServerEventListener.ON_ACCESS_ROOMS, data);
            self.serverListener.onAccessRoom(data);
        });
        self.pomelo.on(ServerEventListener.ON_ADD_ROOM_ACCESS, function (data) {
            console.log(ServerEventListener.ON_ADD_ROOM_ACCESS, data);
            self.serverListener.onAddRoomAccess(data);
        });
        self.pomelo.on(ServerEventListener.ON_UPDATED_LASTACCESSTIME, function (data) {
            console.log(ServerEventListener.ON_UPDATED_LASTACCESSTIME, data);
            self.serverListener.onUpdatedLastAccessTime(data);
        });
        //<!-- User -->
        self.pomelo.on(ServerEventListener.ON_USER_LOGIN, function (data) {
            console.log(ServerEventListener.ON_USER_LOGIN);
            self.serverListener.onUserLogin(data);
        });
        self.pomelo.on(ServerEventListener.ON_USER_UPDATE_PROFILE, function (data) {
            console.log(ServerEventListener.ON_USER_UPDATE_PROFILE);
            self.serverListener.onUserUpdateProfile(data);
        });
        self.pomelo.on(ServerEventListener.ON_USER_UPDATE_IMAGE_PROFILE, function (data) {
            console.log(ServerEventListener.ON_USER_UPDATE_IMAGE_PROFILE);
            self.serverListener.onUserUpdateImageProfile(data);
        });
        //<!-- Group -->
        self.pomelo.on(ServerEventListener.ON_CREATE_GROUP_SUCCESS, function (data) {
            console.log(ServerEventListener.ON_CREATE_GROUP_SUCCESS);
            self.serverListener.onCreateGroupSuccess(data);
        });
        self.pomelo.on(ServerEventListener.ON_EDITED_GROUP_MEMBER, function (data) {
            console.log(ServerEventListener.ON_EDITED_GROUP_MEMBER);
            self.serverListener.onEditedGroupMember(data);
        });
        self.pomelo.on(ServerEventListener.ON_EDITED_GROUP_NAME, function (data) {
            console.log(ServerEventListener.ON_EDITED_GROUP_NAME);
            self.serverListener.onEditedGroupName(data);
        });
        self.pomelo.on(ServerEventListener.ON_EDITED_GROUP_IMAGE, function (data) {
            console.log(ServerEventListener.ON_EDITED_GROUP_IMAGE);
            self.serverListener.onEditedGroupImage(data);
        });
        self.pomelo.on(ServerEventListener.ON_NEW_GROUP_CREATED, function (data) {
            console.log(ServerEventListener.ON_NEW_GROUP_CREATED);
            self.serverListener.onNewGroupCreated(data);
        });
        self.pomelo.on(ServerEventListener.ON_UPDATE_MEMBER_INFO_IN_PROJECTBASE, function (data) {
            console.log(ServerEventListener.ON_UPDATE_MEMBER_INFO_IN_PROJECTBASE);
            self.serverListener.onUpdateMemberInfoInProjectBase(data);
        });
    };
    ServerEventListener.ON_ADD = "onAdd";
    ServerEventListener.ON_LEAVE = "onLeave";
    ServerEventListener.ON_CHAT = "onChat";
    ServerEventListener.ON_MESSAGE_READ = "onMessageRead";
    ServerEventListener.ON_GET_MESSAGES_READERS = "onGetMessagesReaders";
    ServerEventListener.ON_VIDEO_CALL = "onVideoCall";
    ServerEventListener.ON_VOICE_CALL = "onVoiceCall";
    ServerEventListener.ON_HANGUP_CALL = "onHangupCall";
    ServerEventListener.ON_THE_LINE_IS_BUSY = "onTheLineIsBusy";
    //<!-- AccessRoom Info -->
    ServerEventListener.ON_ACCESS_ROOMS = "onAccessRooms";
    ServerEventListener.ON_ADD_ROOM_ACCESS = "onAddRoomAccess";
    ServerEventListener.ON_UPDATED_LASTACCESSTIME = "onUpdatedLastAccessTime";
    //<!-- Group -->
    ServerEventListener.ON_CREATE_GROUP_SUCCESS = "onCreateGroupSuccess";
    ServerEventListener.ON_EDITED_GROUP_MEMBER = "onEditGroupMembers";
    ServerEventListener.ON_EDITED_GROUP_NAME = "onEditGroupName";
    ServerEventListener.ON_EDITED_GROUP_IMAGE = "onEditGroupImage";
    ServerEventListener.ON_NEW_GROUP_CREATED = "onNewGroupCreated";
    ServerEventListener.ON_UPDATE_MEMBER_INFO_IN_PROJECTBASE = "onUpdateMemberInfoInProjectBase";
    //<!-- User -->
    ServerEventListener.ON_USER_LOGIN = "onUserLogin";
    ServerEventListener.ON_USER_UPDATE_IMAGE_PROFILE = "onUserUpdateImgProfile";
    ServerEventListener.ON_USER_UPDATE_PROFILE = "onUserUpdateProfile";
    //<!-- Frontend server --->
    ServerEventListener.ON_GET_ME = "onGetMe";
    ServerEventListener.ON_GET_COMPANY_INFO = "onGetCompanyInfo";
    ServerEventListener.ON_GET_COMPANY_MEMBERS = "onGetCompanyMembers";
    ServerEventListener.ON_GET_PRIVATE_GROUPS = "onGetPrivateGroups";
    ServerEventListener.ON_GET_ORGANIZE_GROUPS = "onGetOrganizeGroups";
    ServerEventListener.ON_GET_PROJECT_BASE_GROUPS = "onGetProjectBaseGroups";
    return ServerEventListener;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ServerEventListener;
