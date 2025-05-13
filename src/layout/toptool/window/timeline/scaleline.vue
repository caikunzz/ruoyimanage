<template>
  <div ref="canvasContainer">
    <canvas
      :style="canvasStyle"
      v-bind="canvasAttr"
      ref="scaleline"
      @click="handleClick"
    />
  </div>
</template>

<script>
import { drawTimeLine } from "@/utils/scalelineUtils";
import store from "@/store";

export default {
  name: "scaleline",
  props: {
    start: {
      // 开始坐标
      type: Number,
      default: 0,
    },
    step: {
      // 步进，与视频fps同步
      type: Number,
      default: 30,
    },
    scale: {
      // 时间轴缩放比例
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      canvasConfigs: {
        bgColor: "#d5d5d5", // 背景颜色
        ratio: 1, // 设备像素比
        textSize: 12, // 字号
        textScale: 1, // 支持更小号字： 10 / 12
        lineWidth: 1, // 线宽
        textBaseline: "middle", // 文字对齐基线 (ts 中定义的textBaseLine是一个联合类型)
        textAlign: "center", // 文字对齐方式
        longColor: "#374151", // 长线段颜色
        shortColor: "#6B7280", // 短线段颜色
        textColor: "#000000", // 文字颜色
        subTextColor: "#6B7280", // 小文字颜色
        focusColor: "#C4B5FD", // 选中元素区间
      },
      canvasAttr: {
        width: 0,
        height: 0,
      },
      canvasContext: {},
    };
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
    // 当前激活函数 用于元素颜色显示
    // focusPosition(){
    //   const activate = store.getters.activateEntity
    //   if (activate == null || !activate.startTime || !activate.endTime) return {start: 0, end:0}
    //   const startTimeSecond = transformSecond(transformTimeString(activate.startTime, this.timeline.startTime))
    //   const endTimeSecond = transformSecond(transformTimeString(activate.endTime, this.timeline.startTime))
    //   return {
    //     start: startTimeSecond * this.step,
    //     end: endTimeSecond * this.step
    //   }
    // },
    canvasStyle() {
      return {
        width: `${this.canvasAttr.width / this.canvasConfigs.ratio}px`,
        height: `${this.canvasAttr.height / this.canvasConfigs.ratio}px`,
      };
    },
    userConfigs() {
      return {
        start: this.start,
        step: this.step,
        scale: this.scale,
        // focusPosition: this.focusPosition
      };
    },
  },
  methods: {
    /** 重绘线条 */
    updateTimeLine() {
      drawTimeLine(
        this.canvasContext,
        { ...this.userConfigs },
        { ...this.canvasAttr, ...this.canvasConfigs }
      );
    },

    /** 设置 canvas 上下文环境 */
    setCanvasContext() {
      this.canvasContext = this.$refs.scaleline.getContext("2d");
      this.canvasContext.font = `${
        this.canvasConfigs.textSize * this.canvasConfigs.ratio
      }px -apple-system, ".SFNSText-Regular", "SF UI Text", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", "WenQuanYi Zen Hei", "Microsoft YaHei", Arial, sans-serif`;
      this.canvasContext.lineWidth = this.canvasConfigs.lineWidth;
      this.canvasContext.textBaseline = this.canvasConfigs.textBaseline;
      this.canvasContext.textAlign = this.canvasConfigs.textAlign;
    },

    /** 设置 canvas 大小 */
    setCanvasRect() {
      const { width, height } =
        this.$refs.canvasContainer?.getBoundingClientRect();
      this.canvasAttr.width = width * this.canvasConfigs.ratio;
      this.canvasAttr.height = height * this.canvasConfigs.ratio;
      this.$nextTick(() => {
        this.setCanvasContext();
        this.updateTimeLine();
      });
    },

    /** 单击时间线 */
    handleClick(event) {
      this.$emit("selectFrame", event.offsetX);
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.setCanvasRect();
    });
  },
  watch: {
    canvasConfigs() {
      this.updateTimeLine();
    },
    userConfigs() {
      this.updateTimeLine();
    },
  },
};
</script>
<style scoped></style>
