import { absSpartan } from "./spartanEvents";

export default class ServerEventListener {
    public static ON_ADD: string = "onAdd";
    public static ON_LEAVE: string = "onLeave";
    public static ON_CHAT: string = "onChat";
    public static ON_MESSAGE_READ: string = "onMessageRead";
    public static ON_GET_MESSAGES_READERS: string = "onGetMessagesReaders";

    public static ON_VIDEO_CALL: string = "onVideoCall";
    public static ON_VOICE_CALL: string = "onVoiceCall";
    public static ON_HANGUP_CALL: string = "onHangupCall";
    public static ON_THE_LINE_IS_BUSY: string = "onTheLineIsBusy";
    //<!-- AccessRoom Info -->
    public static ON_ACCESS_ROOMS: string = "onAccessRooms";
    public static ON_ADD_ROOM_ACCESS: string = "onAddRoomAccess";
    public static ON_UPDATED_LASTACCESSTIME: string = "onUpdatedLastAccessTime";
    //<!-- Group -->
    public static ON_CREATE_GROUP_SUCCESS: string = "onCreateGroupSuccess";
    public static ON_EDITED_GROUP_MEMBER: string = "onEditGroupMembers";
    public static ON_EDITED_GROUP_NAME: string = "onEditGroupName";
    public static ON_EDITED_GROUP_IMAGE: string = "onEditGroupImage";
    public static ON_NEW_GROUP_CREATED: string = "onNewGroupCreated";
    public static ON_UPDATE_MEMBER_INFO_IN_PROJECTBASE: string = "onUpdateMemberInfoInProjectBase";
    //<!-- User -->
    public static ON_USER_LOGIN: string = "onUserLogin";
    public static ON_USER_UPDATE_IMAGE_PROFILE: string = "onUserUpdateImgProfile";
    public static ON_USER_UPDATE_PROFILE: string = "onUserUpdateProfile";
    //<!-- Frontend server --->
    public static ON_GET_ME: string = "onGetMe";
    public static ON_GET_COMPANY_INFO: string = "onGetCompanyInfo";
    public static ON_GET_COMPANY_MEMBERS: string = "onGetCompanyMembers";
    public static ON_GET_PRIVATE_GROUPS: string = "onGetPrivateGroups";
    public static ON_GET_ORGANIZE_GROUPS: string = "onGetOrganizeGroups";
    public static ON_GET_PROJECT_BASE_GROUPS: string = "onGetProjectBaseGroups";

    private chatServerListener: absSpartan.IChatServerListener;
    private frontendListener: absSpartan.IFrontendServerListener;
    private rtcCallListener: absSpartan.IRTCListener;
    private serverListener: absSpartan.IServerListener;
    public addFrontendListener(obj: absSpartan.IFrontendServerListener): void {
        this.frontendListener = obj;
    }
    public addServerListener(obj: absSpartan.IServerListener): void {
        this.serverListener = obj;
    }
    public addChatListener(obj: absSpartan.IChatServerListener): void {
        this.chatServerListener = obj;
    }
    public addRTCListener(obj: absSpartan.IRTCListener): void {
        this.rtcCallListener = obj;
    }

    pomelo: any;

    constructor(socket) {
        this.pomelo = socket;
    }

    public addListenner(resolve?: Function) {
        this.callFrontendServer();
        this.callChatServer();
        this.callRTCEvents();
        this.callServerEvents();

        if (!!resolve)
            resolve();
    }

    private callFrontendServer() {
        let self = this;

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
        self.pomelo.on(ServerEventListener.ON_GET_COMPANY_MEMBERS, data => {
            console.log(ServerEventListener.ON_GET_COMPANY_MEMBERS, JSON.stringify(data));

            self.frontendListener.onGetCompanyMemberComplete(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_PRIVATE_GROUPS, data => {
            console.log(ServerEventListener.ON_GET_PRIVATE_GROUPS, JSON.stringify(data));

            self.frontendListener.onGetPrivateGroupsComplete(data);
        });
        self.pomelo.on(ServerEventListener.ON_GET_PROJECT_BASE_GROUPS, data => {
            console.log(ServerEventListener.ON_GET_PROJECT_BASE_GROUPS, JSON.stringify(data));

            self.frontendListener.onGetProjectBaseGroupsComplete(data);
        });
    }

    private callChatServer() {
        let self = this;

        self.pomelo.on(ServerEventListener.ON_CHAT, function (data) {
            console.log(ServerEventListener.ON_CHAT, JSON.stringify(data));

            self.chatServerListener.onChat(data);
        });

        //pomelo.on(ServerEventListener.ON_ADD, (data) => {
        //    console.log(ServerEventListener.ON_ADD, data);
        //    self.onChatListener.on(data);
        //});

        self.pomelo.on(ServerEventListener.ON_LEAVE, (data) => {
            console.log(ServerEventListener.ON_LEAVE, JSON.stringify(data));

            self.chatServerListener.onLeaveRoom(data);
        });

        self.pomelo.on(ServerEventListener.ON_MESSAGE_READ, (data) => {
            // console.log(ServerEventListener.ON_MESSAGE_READ);

            self.chatServerListener.onMessageRead(data);
        });

        self.pomelo.on(ServerEventListener.ON_GET_MESSAGES_READERS, (data) => {
            // console.log(ServerEventListener.ON_GET_MESSAGES_READERS);

            self.chatServerListener.onGetMessagesReaders(data);
        });
    }

    private callRTCEvents() {
        var self = this;

        self.pomelo.on(ServerEventListener.ON_VIDEO_CALL, (data) => {
            console.log(ServerEventListener.ON_VIDEO_CALL, JSON.stringify(data));

            self.rtcCallListener.onVideoCall(data);
        });
        self.pomelo.on(ServerEventListener.ON_VOICE_CALL, (data) => {
            console.log(ServerEventListener.ON_VOICE_CALL, JSON.stringify(data));

            self.rtcCallListener.onVoiceCall(data);
        });
        self.pomelo.on(ServerEventListener.ON_HANGUP_CALL, (data) => {
            console.log(ServerEventListener.ON_HANGUP_CALL, JSON.stringify(data));

            self.rtcCallListener.onHangupCall(data);
        });
        self.pomelo.on(ServerEventListener.ON_THE_LINE_IS_BUSY, (data) => {
            console.log(ServerEventListener.ON_THE_LINE_IS_BUSY, JSON.stringify(data));

            self.rtcCallListener.onTheLineIsBusy(data);
        });
    }

    private callServerEvents() {
        var self = this;

        //<!-- AccessRoom Info -->
        self.pomelo.on(ServerEventListener.ON_ACCESS_ROOMS, (data) => {
            console.log(ServerEventListener.ON_ACCESS_ROOMS, data);

            self.serverListener.onAccessRoom(data);
        });
        self.pomelo.on(ServerEventListener.ON_ADD_ROOM_ACCESS, (data) => {
            console.log(ServerEventListener.ON_ADD_ROOM_ACCESS, data);

            self.serverListener.onAddRoomAccess(data);
        });
        self.pomelo.on(ServerEventListener.ON_UPDATED_LASTACCESSTIME, (data) => {
            console.log(ServerEventListener.ON_UPDATED_LASTACCESSTIME, data);

            self.serverListener.onUpdatedLastAccessTime(data);
        });

        //<!-- User -->
        self.pomelo.on(ServerEventListener.ON_USER_LOGIN, data => {
            console.log(ServerEventListener.ON_USER_LOGIN);

            self.serverListener.onUserLogin(data);
        });
        self.pomelo.on(ServerEventListener.ON_USER_UPDATE_PROFILE, (data) => {
            console.log(ServerEventListener.ON_USER_UPDATE_PROFILE);

            self.serverListener.onUserUpdateProfile(data);
        });
        self.pomelo.on(ServerEventListener.ON_USER_UPDATE_IMAGE_PROFILE, (data) => {
            console.log(ServerEventListener.ON_USER_UPDATE_IMAGE_PROFILE);

            self.serverListener.onUserUpdateImageProfile(data);
        });

        //<!-- Group -->
        self.pomelo.on(ServerEventListener.ON_CREATE_GROUP_SUCCESS, (data) => {
            console.log(ServerEventListener.ON_CREATE_GROUP_SUCCESS);

            self.serverListener.onCreateGroupSuccess(data);
        });
        self.pomelo.on(ServerEventListener.ON_EDITED_GROUP_MEMBER, (data) => {
            console.log(ServerEventListener.ON_EDITED_GROUP_MEMBER);

            self.serverListener.onEditedGroupMember(data);
        });
        self.pomelo.on(ServerEventListener.ON_EDITED_GROUP_NAME, (data) => {
            console.log(ServerEventListener.ON_EDITED_GROUP_NAME);

            self.serverListener.onEditedGroupName(data);
        });
        self.pomelo.on(ServerEventListener.ON_EDITED_GROUP_IMAGE, (data) => {
            console.log(ServerEventListener.ON_EDITED_GROUP_IMAGE);

            self.serverListener.onEditedGroupImage(data);
        });
        self.pomelo.on(ServerEventListener.ON_NEW_GROUP_CREATED, (data) => {
            console.log(ServerEventListener.ON_NEW_GROUP_CREATED);

            self.serverListener.onNewGroupCreated(data);
        });
        self.pomelo.on(ServerEventListener.ON_UPDATE_MEMBER_INFO_IN_PROJECTBASE, (data) => {
            console.log(ServerEventListener.ON_UPDATE_MEMBER_INFO_IN_PROJECTBASE);

            self.serverListener.onUpdateMemberInfoInProjectBase(data);
        });
    }
}