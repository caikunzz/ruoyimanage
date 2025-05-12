import axios from 'axios'
import { Notification, MessageBox, Message } from 'element-ui'
import router from "@/router";


axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

class Request{

    defaultUrl = ""

    request = undefined

    isRelogin = {show: false}

    constructor(baseUrl) {
        // 默认url
        this.defaultUrl = baseUrl
        // 响应正常
        const successResp = (res) => {
            // 未设置状态码则默认成功状态
            const code = res.data.code || 200;
            // 获取错误信息
            const msg = res.data.msg || res.data.data
            // 二进制数据则直接返回
            if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
                return res.data
            }
            if (code === 401) {
                if (!this.isRelogin.show) {
                    this.isRelogin.show = true;
                    MessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
                        confirmButtonText: '重新登录',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }).then(() => {
                        this.isRelogin.show = false;
                        localStorage.removeItem("username");
                        localStorage.removeItem("password");
                        localStorage.removeItem("token");
                        router.push("/login").then(()=>{});
                    }).catch(() => {
                        this.isRelogin.show = false;
                    });
                }
                return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
            } else if (code === 500) {
                Message({message: msg, type: 'error'})
                return Promise.reject(new Error(msg))
            } else if (code === 601) {
                Message({message: msg, type: 'warning'})
                return Promise.reject('error')
            } else if (code !== 200) {
                Notification.error({title: msg})
                return Promise.reject('error')
            } else {
                return res.data
            }
        }

        // 响应异常
        const errorResp = (error) => {
            console.log('err' + error)
            let {message} = error;
            if (message === "Network Error") {
                message = "后端接口连接异常";
            } else if (message.includes("timeout")) {
                message = "系统接口请求超时";
            } else if (message.includes("Request failed with status code")) {
                message = "系统接口" + message.substr(message.length - 3) + "异常";
            }
            Message({message: message, type: 'error', duration: 5 * 1000})
            return Promise.reject(error)
        }

        // 创建axios
        this.request = axios.create({
            // axios中请求配置有baseURL选项，表示请求URL公共部分
            baseURL: baseUrl,
            // 超时
            timeout: 30000
        })

        // 配置请求头
        this.request.interceptors.request.use( config => {

            // 配置同源限制 解决ffmpeg引入问题
            // 如果后续上线部署  需要在nginx配置相同
            // 参考链接： https://blog.csdn.net/u012302552/article/details/132404422
            // config.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
            // config.headers["Cross-Origin-Embedder-Policy"] = "same-origin"
            // config.headers["Cross-Origin-Resource-Policy"] = "same-origin"

            // 携带token
            config.headers.Authorization = localStorage.getItem("token");
            return config;
        });

        // 全局响应拦截
        this.request.interceptors.response.use((response) => successResp(response), (error) => errorResp(error))

        // 重写 get, post, put, delete 方法
        this.get = this.request.get
        this.post = this.request.post
        this.put = this.request.put
        this.delete = this.request.delete
    }
}

export default Request
