<template>
  <div class="plot-unit-container">
    <div class="plot-unit-item-body">
      <!--  二维图标标绘  -->
      <el-popover
        popper-class="unit-item-popper"
        placement="bottom"
        :visible-arrow="false"
        trigger="click"
      >
        <div class="popover-component">
          <icon-plotting />
        </div>
        <div slot="reference" class="unit-btn">
          <div class="unit-btn-top">
            <i class="iconfont icon-charutupian"></i>
            <span>二维图标</span>
          </div>
          <div><i class="el-icon-arrow-down el-icon--right"></i></div>
        </div>
      </el-popover>
      <!--  三维模型标绘  -->
      <el-popover
        popper-class="unit-item-popper"
        placement="bottom"
        :visible-arrow="false"
        trigger="click"
      >
        <div class="popover-component">
          <model-plotting />
        </div>
        <div slot="reference" class="unit-btn">
          <div class="unit-btn-top">
            <i class="iconfont icon-biaohuiguanli"></i>
            <span>三维模型</span>
          </div>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </el-popover>
      <!--  态势箭头标绘  -->
      <el-popover
        popper-class="unit-item-popper"
        placement="bottom"
        :visible-arrow="false"
        trigger="click"
      >
        <div class="popover-component">
          <situation-plotting />
        </div>
        <div slot="reference" class="unit-btn">
          <div class="unit-btn-top">
            <i class="iconfont icon-erweibiaohuimianban"></i>
            <span>态势箭头</span>
          </div>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </el-popover>
      <!--  动画标绘  -->
      <el-popover
        popper-class="unit-item-popper"
        placement="bottom"
        :visible-arrow="false"
        trigger="click"
      >
        <div class="popover-component">
          <particles-plotting />
        </div>
        <div slot="reference" class="unit-btn">
          <div class="unit-btn-top">
            <i class="iconfont icon-texiao"></i>
            <span>粒子特效</span>
          </div>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </el-popover>
      <!--  音频标绘  -->
      <el-popover
        popper-class="unit-item-popper"
        placement="bottom"
        :visible-arrow="false"
        trigger="click"
      >
        <div class="popover-component">
          <audio-group />
        </div>
        <div slot="reference" class="unit-btn">
          <div class="unit-btn-top">
            <i class="iconfont icon-icon_yinpin"></i>
            <span>音频</span>
          </div>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </el-popover>
      <!--  视频  -->
      <el-popover
        popper-class="unit-item-popper"
        placement="bottom"
        :visible-arrow="false"
        trigger="click"
      >
        <div class="popover-component">
          <video-group />
        </div>
        <div slot="reference" class="unit-btn">
          <div class="unit-btn-top">
            <i class="iconfont icon-shipin1"></i>
            <span>视频</span>
          </div>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </el-popover>
      <!--  字幕编辑  -->
      <div slot="reference" class="unit-btn" @click="openCaption">
        <div class="unit-btn-top">
          <i class="iconfont icon-zimu"></i>
          <span>字幕</span>
          <caption-plotting ref="captionRef" />
        </div>
      </div>
      <!--  添加文字  -->
      <div slot="reference" class="unit-btn">
        <div class="unit-btn-top" @click="createText">
          <i class="iconfont icon-wenbenkuang"></i>
          <span>文字</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import situationPlotting from "./situationPlotting.vue";
import particlesPlotting from "./particlePlotting.vue";
import modelPlotting from "./modelPlotting.vue";
import iconPlotting from "./iconPlotting.vue";
import audioGroup from "../audio/index.vue";
import videoGroup from "../video/index.vue";
import CaptionPlotting from "./captionPlotting.vue";

export default {
  name: "index",
  components: {
    CaptionPlotting,
    particlesPlotting,
    iconPlotting,
    modelPlotting,
    situationPlotting,
    audioGroup,
    videoGroup,
  },
  methods: {
    /** 添加文字 */
    createText() {
      this.$cesiumHelper.text.addText({ position: [184, 130] }).then((res) => {
        const info = this.$cesiumHelper.getEntityInfo(res);
        this.$store.dispatch("addEntitySource", info);
      });
    },

    /** 打开字幕编辑表 */
    openCaption() {
      this.$refs.captionRef.openOutDialog();
    },
  },
};
</script>

<style scoped>
.plot-unit-item-body {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
}

.unit-btn {
  padding: 10px 10px 0 10px;
  cursor: pointer;
  height: 46px;
  box-sizing: border-box;
}

.unit-btn:hover {
  background-color: #d2d2d2;
}

.unit-btn > i {
  font-size: 12px;
}

.unit-btn-top {
  display: flex;
  align-items: center;
}

.unit-btn-top > span {
  display: inline-block;
  margin-left: 5px;
  font-size: 12px;
}

.unit-btn-top > i {
  font-size: 20px;
}

/deep/ .el-tabs__content {
  padding: 0;
  box-sizing: border-box;
}

/deep/ .el-tabs__nav-scroll {
  background-color: #ffffff;
}

/deep/ .el-collapse-item__header {
  padding: 0 10px;
  height: 30px;
  background-color: #ebebeb;
}

/deep/ .el-tabs__item {
  height: 30px;
  line-height: 30px;
}

/deep/ .el-tabs__item:hover {
  color: #000000 !important;
}

/deep/ .el-tabs__item.is-active {
  color: #000000 !important;
  background-color: #ebebeb !important;
}
</style>

<style>
.unit-item-popper {
  padding: 0;
  border-radius: 0;
  border: none;
  margin-top: 0 !important;
}
</style>
