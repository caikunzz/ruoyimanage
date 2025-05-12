
class WebsocketHelper {

    url = null;

    roomId = null;

    socketId = null;

    websocket = null

    isConnected = false

    timeout = null

    callbacks = {
        open: {},
        message: {},
        close: {},
        error: {}
    }

    static WEB_SOCKET_CONF = {
        protocol: "ws",
        host: window.location.hostname,   // 这里的 IP 地址需要同步为后端的 IP 地址
        port: window.location.port,                       // 这里对应前端页面端口 即 window.location.host
        path: process.env.VUE_APP_BASE_API + "/gis/websocket"
    }

    // 创建websocket
    constructor(roomId, socketId, path = WebsocketHelper.WEB_SOCKET_CONF.path) {
        this.url = `${path}/${roomId}/${socketId}`;
        this.roomId = roomId
        this.socketId = socketId
        this.initWebSocket(this.url)
    }

    // 初始化websocket
    initWebSocket(url) {
        try {
            this.websocket = new WebSocket(url);
            this.websocket.onopen = () => {
                console.log("【websocket 建立连接】");
                // TODO 连接 open
                this.isConnected = true
                Object.values(this.callbacks.open).forEach(func => func())
            }
            this.websocket.onmessage = (msgEvent) => {
                // TODO 连接 message
                console.log("【websocket 消息接收】=>", msgEvent.data);
                Object.values(this.callbacks.message).forEach(func => func(msgEvent.data))
            }
            this.websocket.onerror = (e) => {
                // TODO 连接 error
                console.log("【websocket 连接失败】=> ", e)
                this.isConnected = false
                this.reconnted()
                Object.values(this.callbacks.error).forEach(func => func())
            }
            this.websocket.onclose = () => {
                // TODO 连接 close
                console.log("【websocket 关闭连接】")
                this.isConnected = false
                Object.values(this.callbacks.close).forEach(func => func())
            }
        } catch (e) {
            // console.log("尝试创建连接失败");
            this.reconnted()
        }
    }

    // 数据发送
    sendMessage(data) {
        this.websocket.send(JSON.stringify(data));
    }

    // 重连
    reconnted(){
        const that = this
        that.timeout && clearTimeout(this.timeout);
        that.timeout = setTimeout(function () {
            // 延迟5秒重连  避免过多次过频繁请求重连
            that.initWebSocket(that.url)
        }, 5000);
    }

    // 关闭 socket
    close(){
        this.websocket.close()
    }

    // 打开连接事件监听
    addOnOpenEventListener(id, func){
        this.callbacks.open[id] = func
    }

    // 收到消息事件监听
    addOnMessageEventListener(id, func){
        this.callbacks.message[id] = func
    }

    // 关闭连接事件监听
    addOnCloseEventListener(id, func){
        this.callbacks.close[id] = func
    }

    // 连接错误事件监听
    addOnErrorEventListener(id, func){
        this.callbacks.error[id] = func
    }
}

export default WebsocketHelper
