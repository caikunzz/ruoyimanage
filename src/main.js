import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import VueContextMenu from "vue-contextmenu";
import "./assets/styles/index.css";
import { handleTree } from "@/utils/ruoyi";
import modal from "@/plugins/modal";

Vue.config.productionTip = false;

window.CESIUM_BASE_URL = "/static/Cesium/";

Vue.use(ElementUI);
Vue.use(VueContextMenu);

Vue.prototype.handleTree = handleTree;

// 模态框对象
Vue.prototype.$modal = modal;

new Vue({
  router,
  store,
  render: (h) => h(App),
  beforeCreate() {
    // 安装全局事件总线
    Vue.prototype.$bus = this;
  },
}).$mount("#app");
