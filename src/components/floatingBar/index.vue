<template>
  <vue-draggable-resizable
      class-name="floating-bar-contain"
      class-name-handle="floating-bar-handle"
      ref="float-bar-ref"
      :w="f_width"
      :h="f_height"
      :x="f_left"
      :y="f_top"
      :minw="f_min_width"
      :minh="f_min_height"
      :z="999"
      :handles="['tm', 'bm']"
      :resizable="resizable"
      :draggable="draggable"
      drag-handle=".top-title-bar"
      :parent="false"
      v-show="visible"
      :onResize="onResizeCallback"
      :onDrag="onDragCallback"
  >
    <div class="float-bar-warpper" v-if="visible">
      <!--  顶部标题栏  -->
      <div class="top-title-bar">
        <span>{{ title }}</span>
        <div>
          <span v-if="resizable" @click="resizeQuick" style="cursor: pointer"><i class="iconfont" :class="isBig?'icon-suoxiao1':'icon-fangda1'"></i></span>
          <span @click="closeDialog" style="cursor: pointer;margin-left: 5px"><i class="el-icon-minus"></i></span>
        </div>
      </div>
      <div class="floating-body">
        <!--  内容插槽  -->
        <slot></slot>
      </div>
    </div>
  </vue-draggable-resizable>
</template>

<script>
import vueDraggableResizable from "vue-draggable-resizable"
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

export default {
  name: "index",
  components: {vueDraggableResizable},
  props: {
    value: {
      type: Boolean,
      default: false
    },
    draggable: {
      type: Boolean,
      default: false
    },
    resizable: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "悬浮框"
    },
    width: {
      type: [String, Number],
    },
    minWidth: {
      type: [String, Number]
    },
    maxWidth: {
      type: [String, Number]
    },
    height: {
      type: [String, Number]
    },
    minHeight: {
      type: [String, Number]
    },
    maxHeight: {
      type: [String, Number]
    },
    top: {
      type: [String, Number],
      default: 0
    },
    left: {
      type: [String, Number],
      default: 0
    },
    closed: {
      type: Function,
      default: () => {
      }
    }
  },
  computed: {
    config() {
      return {
        width: this.width,
        minWidth: this.minWidth,
        maxWidth: this.maxWidth,
        height: this.height,
        minHeight: this.minHeight,
        maxHeight: this.maxHeight,
        top: this.top,
        left: this.left,
      }
    }
  },
  data() {
    return {
      visible: false,
      isBig: false,
      f_width: null,
      f_min_width: null,
      f_max_width: null,
      f_height: null,
      f_min_height: null,
      f_max_height: null,
      f_top: null,
      f_left: null
    }
  },
  watch: {
    visible(val) {
      this.$emit('input', val)
    },
    value(val) {
      this.visible = val
    },
    "config": {
      handler(val) {
        this.refreshSize(val)
      }
    }
  },
  methods: {
    resizeQuick(){
      this.isBig = !this.isBig
      // this.$refs["float-bar-ref"].width = this.isBig ? this.config.maxWidth : this.config.width;
      this.$refs["float-bar-ref"].height = this.isBig ? this.config.maxHeight : this.config.height;
      this.$emit("resizing",
          null,
          this.$refs["float-bar-ref"].left,
          this.$refs["float-bar-ref"].top,
          this.$refs["float-bar-ref"].width,
          this.$refs["float-bar-ref"].height)
    },
    closeDialog() {
      this.visible = false
    },
    refreshSize(config) {
      this.$nextTick(() => {
        if (config.width !== undefined) {
          this.f_width = config.width
          this.$refs["float-bar-ref"].width = config.width;
        }
        if (config.minWidth !== undefined) {
          this.f_min_width = config.minWidth
          this.$refs["float-bar-ref"].minW = config.minWidth;
        }
        if (config.maxWidth !== undefined) {
          this.f_max_width = config.maxWidth
          this.$refs["float-bar-ref"].maxW = config.maxWidth;
        }
        if (config.height !== undefined) {
          this.f_height = config.height
          this.$refs["float-bar-ref"].height = config.height;
        }
        if (config.minHeight !== undefined) {
          this.f_min_height = config.minHeight
          this.$refs["float-bar-ref"].minH = config.minHeight;
        }
        if (config.maxHeight !== undefined) {
          this.f_max_height = config.maxHeight
          this.$refs["float-bar-ref"].maxH = config.maxHeight;
        }
        if (config.top !== undefined) {
          this.f_top = config.top
          this.$refs["float-bar-ref"].top = config.top;
        }
        if (config.left !== undefined) {
          this.f_left = config.left
          this.$refs["float-bar-ref"].left = config.left;
        }
      })
    },
    onResizeCallback(handle, x, y, width, height) {
      this.$refs["float-bar-ref"].width = width
      this.$refs["float-bar-ref"].height = height
      this.$emit("resizing", handle, x, y, width, height)
    },
    onDragCallback(x, y){
      this.$emit("dragging", x, y)
    }
  },
  mounted() {
    // 挂载到body中
    document.getElementById("app").appendChild(this.$el);
    this.$nextTick(()=>{
      this.refreshSize(this.config)
    })
  },
  destroyed() {
    this.closed()
  }
}
</script>

<style lang="less" scoped>
.floating-bar-contain {
  position: absolute;
  opacity: .85;
  top: 0;
  left: 0;
  box-sizing: content-box;

  .float-bar-warpper {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .top-title-bar {
      height: 30px;
      width: 100%;
      line-height: 30px;
      padding: 0 5px;
      box-sizing: border-box;
      background: linear-gradient(90deg, rgba(39, 67, 132, 1) 0%, rgba(54, 91, 180, 1) 100%), rgba(169, 190, 222, 1);
      color: white;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      cursor: move;

      & > span {
        font-size: 12px;
      }
    }

    .floating-body {
      height: calc(100% - 30px);
      background-color: rgb(255, 255, 255);
      position: relative;

      ::-webkit-scrollbar {
        background-color: rgba(255, 255, 255, 1);
        width: 5px;
      }
    }
  }
}
</style>
<style>
.floating-bar-handle{
  background-color: transparent;
  width: 100%;
  height: 8px;
  border: 0;
  z-index: 999;
}
.floating-bar-handle-tm {
  cursor: n-resize;
  position: absolute;
  top: 0;
}

.floating-bar-handle-bm {
  cursor: s-resize;
  position: absolute;
  bottom: 0;
}
</style>
