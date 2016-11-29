var SocketComponent = (function () {
    function SocketComponent() {
    }
    SocketComponent.prototype.disconnected = function (reason) {
        if (!!this.onDisconnect) {
            this.onDisconnect(reason);
        }
        else {
            console.warn("onDisconnected delegate is empty.");
        }
    };
    return SocketComponent;
}());
