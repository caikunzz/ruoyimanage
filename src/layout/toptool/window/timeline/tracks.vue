<template>
  <!-- 轨道区域 -->
  <div
    class="operate-track-list"
    ref="operateTrackListRef"
    @contextmenu="(event) => event.preventDefault()"
    :style="{ paddingLeft: offsetLine.left + 'px' }"
  >
    <div
      class="operate_track_item"
      :id="item.id"
      :class="activeTrack && activeTrack.id === item.id ? 'is-active' : ''"
      :style="{ height: item.h + 'px' }"
      v-for="item in trackList.entityList"
      :key="item.id"
    >
      <vue-draggable-resizable
        ref="dragBox"
        axis="x"
        class-name-handle="handle"
        :class="item.class"
        :style="{ backgroundColor: item.color }"
        :w="item.w"
        :h="item.h"
        :x="item.x"
        :handles="['ml', 'mr']"
        :parent="true"
        @activated="activatedTrack(item)"
        @deactivated="deactivatedTrack"
        @dragstop="
          (x, y) => {
            elementDrag(x, y, item);
          }
        "
        @resizestop="
          (x, y, w) => {
            elementResize(x, y, w, item);
          }
        "
        @mouseup.native.right="(event) => handleContextmenu(event, item)"
      >
        <div
          style="
            width: 100%;
            height: 100%;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          "
          @dblclick="selectEntity(item)"
        >
          <div class="track-item-title">
            <span>{{ item.name }}</span>
          </div>
        </div>
      </vue-draggable-resizable>
    </div>
    <!--  摄像头为同一行渲染  单独分开  -->
    <div
      id="camera-track"
      class="operate_track_item"
      :class="activeTrack && activeTrack.type === 'camera' ? 'is-active' : ''"
      style="height: 17px"
      v-if="trackList.cameraList.length > 0"
    >
      <vue-draggable-resizable
        ref="dragBox"
        v-for="item in trackList.cameraList"
        :key="item.id"
        :w="10"
        :h="10"
        :x="item.x"
        :parent="true"
        axis="x"
        :class="item.class"
        :style="{
          backgroundColor:
            activateEntity?.id === item.id ? '#00D7C6' : item.color,
        }"
        :resizable="false"
        @mouseup.native.right="(event) => handleContextmenu(event, item)"
        @activated="activatedTrack(item)"
        @deactivated="deactivatedTrack"
        @dragstop="
          (x) => {
            cameraDrag(x, item);
          }
        "
      >
        <div
          style="
            width: 100%;
            height: 100%;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          "
          @dblclick="selectEntity(item)"
        >
          <div class="track-item-title"></div>
        </div>
      </vue-draggable-resizable>
    </div>

    <contextmenu ref="timelineContextmenuRef" class="timeline-context-bar" />
  </div>
</template>

<script>
import store from "@/store";
import { getGridPixel, getSelectTime } from "@/utils/scalelineUtils";
import vueDraggableResizable from "vue-draggable-resizable";
import { transformSecond, transformTimeString } from "@/utils/timelineUtil";
import contextmenu from "@/layout/toptool/window/timeline/contextmenu.vue";

export default {
  name: "tracks",
  components: { vueDraggableResizable, contextmenu },
  props: {
    value: {
      type: String,
      default: "00:00:00",
    },
    offsetLine: {
      left: {
        type: Number,
        default: 0,
      },
      right: {
        type: Number,
        default: 0,
      },
    },
    eleTypeStyle: {
      type: Object,
      default: () => {},
    },
    scale: {
      type: Number,
    },
    step: { type: Number },
  },
  data() {
    return {
      /** 实体元素 */
      trackList: {
        entityList: [],
        cameraList: [],
      },

      /** 当前激活轨道 */
      activeTrack: null,
    };
  },
  watch: {
    /** 监听实体列表部分属性变化 */
    entities: {
      handler(value) {
        this.render(value);
      },
      deep: true,
    },

    /** 监听实体列表部分属性变化 */
    scale: {
      handler() {
        this.render(this.entities);
      },
    },
  },

  computed: {
    /** 时间线 */
    timeline() {
      const exampleTimes = store.state.cesium.availability.split("/");
      return {
        startTime: exampleTimes[0].replace("T", " ").replace("Z", ""),
        endTime: exampleTimes[1].replace("T", " ").replace("Z", ""),
      };
    },

    /** 实体资源 */
    entities() {
      return store.getters.entities
        .filter((p) => p.type !== "group" && p.type !== "root")
        .map((item) => {
          return {
            id: item.id,
            show: item.show,
            name: item.name,
            type: item.type,
            startTime: item.startTime,
            endTime: item.endTime,
            groupId: item.groupId,
          };
        });
    },

    /** 当前选中实体 */
    activateEntity() {
      return store.getters.activateEntity;
    },
  },
  methods: {
    /**
     * 根据时间线偏移量计算当前时间
     *
     * @param {number} x 时间线偏移量
     * */
    getDateStringFromOffsetX(x) {
      const times = getSelectTime(x, this.scale, this.step);
      const timeArr = this.timeline.startTime.split(" ")[1].split(":");
      const timeNum =
        parseInt(timeArr[0]) * 60 * 60 +
        parseInt(timeArr[1]) * 60 +
        parseInt(timeArr[2]);
      const seconds = times + timeNum;
      let hours = Math.floor(seconds / 3600);
      let minutes = Math.floor((seconds % 3600) / 60);
      let remainingSeconds = seconds % 60;
      hours = hours < 10 ? "0" + hours : hours;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      remainingSeconds =
        remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
      return "2000-01-01 " + hours + ":" + minutes + ":" + remainingSeconds;
    },

    /**
     * 根据矩形宽度计算时间范围
     * */
    getTimeRangeFromRectWidthAndOffsetX(x, width) {
      const startTime = this.getDateStringFromOffsetX(x);
      const endTime = this.getDateStringFromOffsetX(x + width);
      return [startTime, endTime];
    },

    /**
     * 实体条拖动
     *
     * @param {number} x 偏移量
     * @param {number} y 高度
     * @param {*} item 元素
     * */
    elementDrag(x, y, item) {
      item.x = x;
      const times = this.getTimeRangeFromRectWidthAndOffsetX(x, item.w);
      const iso8601 =
        times[0].replace(" ", "T") + "Z/" + times[1].replace(" ", "T") + "Z";
      this.$cesiumHelper.updateObjById(item.id, { availability: iso8601 });
      const info = this.$cesiumHelper.getEntityInfo(item.id);
      store.dispatch("updateEntitySource", info);
    },

    /**
     * 摄像头拖拽
     *
     * @param {number} x 偏移量
     * @param {*} item 元素
     * */
    cameraDrag(x, item) {
      item.x = x;
      const temp = this.getDateStringFromOffsetX(x);
      const iso8601 = temp.replace(" ", "T") + "Z";
      this.$cesiumHelper.updateObjById(item.id, { availability: iso8601 });
      const info = this.$cesiumHelper.getEntityInfo(item.id);
      store.dispatch("updateEntitySource", info);
    },

    /**
     * 实体条尺寸移动
     *
     * @param {number} x 偏移量
     * @param {number} y 高度
     * @param {number} w 宽度
     * @param {*} item 元素
     * */
    elementResize(x, y, w, item) {
      item.x = x;
      item.w = w;
      const times = this.getTimeRangeFromRectWidthAndOffsetX(x, item.w);
      const iso8601 =
        times[0].replace(" ", "T") + "Z/" + times[1].replace(" ", "T") + "Z";
      this.$cesiumHelper.updateObjById(item.id, { availability: iso8601 });
      const info = this.$cesiumHelper.getEntityInfo(item.id);
      store.dispatch("updateEntitySource", info);
    },

    /** 实体右键菜单函数 */
    handleContextmenu(event, item) {
      event.preventDefault(); // 阻止默认的右键菜单显示
      this.activeTrack = item;
      this.$emit("selectTrack", item);
      this.$refs.timelineContextmenuRef.show(event, item);
    },

    /** 实体渲染 */
    render(itemList) {
      setTimeout(() => {
        const elements = [];
        const cameras = [];
        let maxw = 0;
        for (let i = 0; i < itemList.length; i++) {
          const o = itemList[i];
          if (!o.startTime || !o.endTime) continue; // 如果实体当前为隐藏 或者不存在生存周期 则不展示
          const startTimeSecond = transformSecond(
            transformTimeString(o.startTime, this.timeline.startTime)
          );
          const endTimeSecond = transformSecond(
            transformTimeString(o.endTime, this.timeline.startTime)
          );
          if (o.type === "camera") {
            const x = getGridPixel(this.scale, endTimeSecond);
            const w = getGridPixel(this.scale, endTimeSecond - startTimeSecond);
            x + w > maxw && (maxw = x + w); // 获取最大宽度
            const info = {
              id: o.id,
              name: o.name,
              type: o.type,
              color: this.eleTypeStyle[o.type]?.bgColor,
              w: w,
              x: x,
              h: this.eleTypeStyle[o.type].h,
              class: this.eleTypeStyle[o.type].class,
            };
            cameras.push(info);
          } else {
            const x = getGridPixel(this.scale, startTimeSecond);
            const w = getGridPixel(this.scale, endTimeSecond - startTimeSecond);
            x + w > maxw && (maxw = x + w); // 获取最大宽度
            const info = {
              id: o.id,
              name: o.name,
              type: o.type,
              color: this.eleTypeStyle[o.type]?.bgColor,
              w: w,
              x: x,
              h: this.eleTypeStyle[o.type].h,
              class: this.eleTypeStyle[o.type].class,
            };
            elements.push(info);
          }
        }
        this.trackList.entityList = elements.sort(
          (a, b) => a.groupId - b.groupId
        );
        this.trackList.cameraList = cameras;

        const windowWidth = this.$refs.operateTrackListRef.style.width;
        this.$refs.operateTrackListRef.style.width =
          windowWidth > maxw ? windowWidth : maxw + 100 + "px";
        this.resetTimeLine();
      }, 0);
    },

    /**
     * 重载时间线渲染
     * 解决拖动组件 parent='true' 的 bug
     *
     * */
    resetTimeLine() {
      this.$nextTick(() => {
        // console.log(this.$refs.dragTimeLine)
        if (this.$refs.dragBox?.length !== undefined) {
          this.$refs.dragBox.forEach((ele) => {
            ele.checkParentSize();
          });
        } else {
          this.$refs.dragBox?.checkParentSize();
        }
        this.$refs.dragTimeLine?.checkParentSize();
      });
    },

    /** 激活轨道 */
    activatedTrack(track) {
      this.activeTrack = track;
      this.$emit("selectTrack", track);
    },

    /** 取消激活轨道 */
    deactivatedTrack() {
      this.activeTrack = null;
      this.$emit("selectTrack", null);
    },

    /** 实体激活函数 */
    selectEntity(val) {
      // 选中逻辑
      const info = this.$cesiumHelper.getEntityInfo(val.id);
      store.dispatch("setActivateEntity", info);
    },

    /** 根据实体id 搜索其所在轨道距顶部偏移量 */
    searchTrackOffsetTop(item) {
      const track =
        item.type === "camera"
          ? document.getElementById("camera-track")
          : document.getElementById(item.id);
      return track?.offsetTop || 0;
    },
  },
  mounted() {
    this.render(this.entities);
  },
};
</script>

<style lang="less" scoped>
// 轨道容器
.operate-track-list {
  min-width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 0;
  padding-top: 20px;
  padding-bottom: 20px;
  box-sizing: border-box;
  position: relative;

  .operate_track_item {
    width: 100%;
    color: #000000;
    display: flex;
    position: relative;
    margin: 1px 0;

    .track-item-title {
      position: relative;
      font-size: 12px;
      transform: scale(0.8);
      transform-origin: 0;
    }

    .entity_track {
      height: 100%;
      color: #ffffff;
      border-radius: 2px;
    }

    .audio_track {
      background: url("../../../../assets/images/audio/audio-bg.png") repeat-x;
      background-size: 120px 35px;

      border-top: 15px solid #ffffff;
      border-bottom: 0;
      border-left: 0;
      border-right: 0;
      border-radius: 3px;

      .track-item-title {
        position: absolute;
        top: -16px;
        left: 7px;
        font-size: 12px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: pointer;
        text-align: left;
        transform: scale(0.8);
        transform-origin: 0;

        width: 100%;
      }
    }

    .video_track {
      height: 100%;
      color: #ffffff;
      border-radius: 2px;
    }

    .camera_track {
      cursor: pointer;
      border: 1px solid black;
      top: 4px;
      left: -4px;
    }
  }

  .is-active {
    background-color: #eeeeee;
  }
}
</style>

<style lang="less">
.operate-track-list {
  /** 元素句柄样式 */
  .handle {
    background-color: hsla(0, 0%, 100%, 0.9);
    bottom: -1px;
    position: absolute;
    top: -1px;
    width: 8px;
    padding: 3px 3px;
    line-height: 50px;
    height: 100%;
    border: 0;
  }

  .handle-mr {
    top: 0;
    margin-top: 0;
    right: -8px;
    cursor: e-resize;
    border-bottom-right-radius: 2px;
    border-top-right-radius: 2px;
  }

  .handle-ml {
    top: 0;
    margin-top: 0;
    left: -8px;
    cursor: w-resize;
    border-bottom-left-radius: 2px;
    border-top-left-radius: 2px;
  }

  .handle:before {
    left: 40%;
    background-color: #0006;
    content: "";
    display: block;
    height: 90%;
    width: 2px;
  }

  /** 摄像头句柄样式 */
  .camera-handle {
    background-color: rgba(255, 255, 0);
    position: absolute;
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    border: 1px black solid;
  }

  .camera-handle-mr {
    top: -5px;
    right: -8px;
    cursor: e-resize;
    border-bottom-right-radius: 2px;
    border-top-right-radius: 2px;
  }
}
</style>
