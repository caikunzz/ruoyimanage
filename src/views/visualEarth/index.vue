<template>
  <div id="visualEarth" class="visual-earth">
    <!-- Cesium 地球 -->
    <div id="cesiumContainer">
      <!--   顶部导航窗格组件   -->
      <top-tool class="top-tool-bar" />
      <!--   实体信息编辑栏   -->
      <info-edit-bar class="entity-info-bar" ref="entityEditRef" />
      <!--   实体右键菜单   -->
      <contextmenu ref="entityContextMenuRef" />
      <!--   此处加三个小按钮   -->
      <div class="earth-tool-group">
        <div class="earth-tool-btn" @click="changeLayer" v-if="is2d">2D</div>
        <div class="earth-tool-btn" @click="changeLayer" v-else>3D</div>
      </div>
    </div>
    <!-- 二三维分屏容器 -->
    <div id="cesiumContainer-split"></div>

    <!--  测试功能组件  -->
    <test-vue />
  </div>
</template>

<script>
import topTool from "@/layout/toptool";
import infoEditBar from "@/components/infoEditBar/index.vue";
import contextmenu from "@/views/visualEarth/contextmenu.vue";
import testVue from "./test.vue";
import Vue from "vue";
import CesiumHelper from "@/plugins/cesiumHelper";
import WebsocketHelper from "@/utils/websocket";
import * as socketApi from "@/api/cesium/socket";
import * as plottingUtils from "@/plugins/cesiumHelper/src/common/plottingUtils";

export default {
  name: "index",
  components: {
    topTool,
    infoEditBar,
    contextmenu,
    testVue,
  },
  data() {
    return {
      /* 当前视角 */
      is2d: false,
    };
  },
  computed: {
    room() {
      return this.$route.query.room;
    },
  },
  watch: {
    room: {
      handler(val) {
        if (val) {
          this.initWebsocket();
        }
      },
      immediate: true,
    },
  },
  methods: {
    /** 右键单击菜单 */
    contextMenu(event, entity) {
      this.$refs.entityContextMenuRef.show(event, entity);
    },

    /** 初始化 Cesium */
    initCesium() {
      // 绑定到全局使用
      const cesiumHelper = new CesiumHelper({
        container: "cesiumContainer", // 容器 id
        showFramesPerSecond: true,
        showInfobox: true,
        enableFxaa: true,
        showCompass: true,
        showPositionInfo: false,
        enableLighting: false,
        highDynamicRange: false,
        splitLayers:
          process.env.VUE_APP_MAP_API + "/pieces2/world/{z}/{x}/{y}.jpg",
        imageryLayers:
          process.env.VUE_APP_MAP_API + "/pieces1/world/{z}/{x}/{y}.png",
        terrainProvider: process.env.VUE_APP_MAP_API + "/terrain/",
        clock: {
          // 系统时间
          startTime: this.$store.state.cesium.availability.split("/")[0],
          endTime: this.$store.state.cesium.availability.split("/")[1],
          currentTime: this.$store.state.cesium.currentTime,
        },
        userData: {
          author: localStorage.getItem("username"),
        },
      });

      cesiumHelper.bindContextmenu(this.contextMenu.bind(this));

      Vue.prototype.$cesiumHelper = cesiumHelper;
      const root = cesiumHelper.viewer.root;
      this.$store.dispatch("addEntitySource", cesiumHelper.getEntityInfo(root));
    },

    /** 修改视角 2/3维 */
    changeLayer() {
      if (this.is2d) {
        this.is2d = false;
        this.$cesiumHelper.removeLocalityMap2d();
      } else {
        this.$cesiumHelper.loadingLocalityMap2d();
        this.is2d = true;
      }
    },

    /**
     * 动态设置实体点位
     *
     * @param {*} id 实体 id
     * @param {*} time 2000-01-01T00:00:00Z
     * @param {*} point 经纬度
     * */
    func(id, time, point) {
      const Cesium = window.Cesium;
      const source = this.getEntityById(id);
      time = Cesium.JulianDate.fromIso8601(time);
      point = plottingUtils.latitudeAndLongitudeToDegrees(point);
      if (source.position instanceof Cesium.SampledPositionProperty) {
        source.position.removeSample(
          Cesium.JulianDate.fromIso8601("2099-01-01T00:00:00.000Z")
        );
        source.position.addSample(time, point);
        source.position.addSample(
          Cesium.JulianDate.fromIso8601("2099-01-01T00:00:00.000Z"),
          point
        );
      } else {
        const positionProperty = new Cesium.SampledPositionProperty();
        positionProperty.addSample(time, point);
        positionProperty.addSample(
          Cesium.JulianDate.fromIso8601("2099-01-01T00:00:00.000Z"),
          point
        );
        source.position = positionProperty;
      }
    },

    // 初始化websocket
    initWebsocket() {
      if (this.$websocketHelper) {
        this.$websocketHelper.close();
        delete Vue.prototype.$websocketHelper;
      }
      socketApi.getSocketId().then((res) => {
        const socketId = res.data;
        const room = this.$route.query.room;
        Vue.prototype.$websocketHelper = new WebsocketHelper(room, socketId);
        this.$store.dispatch("setMode", "coordination");
        Vue.prototype.$websocketHelper.addOnMessageEventListener(
          "plot",
          this.handleOnMessageEvent.bind(this)
        );
      });
    },

    handleOnMessageEvent(message) {
      const object = JSON.parse(message);
      switch (object.signal) {
        case "plot_insert":
          // TODO 实体插入
          object.data && this.$cesiumHelper.loadEntity(object.data);
          break;
        case "plot_update":
          // TODO 实体信息更新
          object.data &&
            this.$cesiumHelper.updateObjById(object.data.id, object.data);
          break;
        case "plot_remove":
          // TODO 实体删除
          object.data && this.$cesiumHelper.deleteObjById(object.data.id);
          break;
        case "plot_remove_all":
          // TODO 实体清空
          object.data && this.$cesiumHelper.removeAll();
          break;
        default:
        // TODO 默认事件
      }
    },
  },
  mounted() {
    this.initCesium();
  },
  destroyed() {
    this.$websocketHelper?.close();
    delete Vue.prototype.$websocketHelper;
    this.$cesiumHelper.bindContextmenu(() => {});
  },
};
</script>

<style lang="less" scoped>
#visualEarth {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

#cesiumContainer {
  height: 100%;
  width: 100%;
}

.top-tool-bar {
  position: absolute;
  z-index: 2;
}

.tools-top-group {
  position: absolute;
  z-index: 3;
}

.entity-info-bar {
  position: absolute;
  width: 300px;
  z-index: 2;
  background-color: rgba(255, 255, 255);
  opacity: 0.8;
  right: 0;
  height: calc(100vh - 100px);
  top: 100px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
    background-color: #ffffff;
  }

  &::-webkit-scrollbar-thumb {
    background: #d5d5d5;
    border-radius: 3px;
  }
}

/* 小组件样式 */
.earth-tool-group {
  position: fixed;
  top: 200px;
  right: 32px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  z-index: 1;

  .earth-tool-btn {
    width: 30px;
    height: 30px;
    line-height: 30px;
    border-radius: 15px;
    background-color: #2a2b2e;
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 10px;
    cursor: pointer;
  }

  .earth-tool-btn:hover {
    background-color: #313235;
  }
}
</style>
