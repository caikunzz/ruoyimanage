<template>
    <floating-bar
        ref="timeLineFloatingRef"
        v-model="visible"
        title="素材时间线"
        :width="840"
        :height="250"
        :min-height="250"
        :max-height="500"
        :left="floatOffsetX"
        :top="floatOffsetY"
        :draggable="true"
        :resizable="true"
        @resizing="handleFloatResizing">
      <template slot="default">
        <div class="timeline-container">
          <!--  工具栏  -->
          <div class="top-operation-area">
            <div class="top-button-left">
              <el-tooltip v-if="!isPlay" class="item" effect="dark" content="播放" placement="top">
                <el-button type="text" @click="play" class="operation-area-btn el-icon-video-play"></el-button>
              </el-tooltip>
              <el-tooltip v-else class="item" effect="dark" content="暂停" placement="top">
                <el-button type="text" @click="pause" class="operation-area-btn el-icon-video-pause"></el-button>
              </el-tooltip>
              <div class="time-progress-bar">
                <span>{{ frameTimes.current }}</span>
                <span>/</span>
                <span>{{ frameTimes.end }}</span>
              </div>
              <div class="speed-change-bar">
                <el-popover
                    popper-class="customPopper"
                    class="speedItem"
                    placement="right"
                    trigger="click">
                  <el-slider
                      v-model="speed"
                      :step="0.5"
                      :max="60"
                      :min="0.5"
                      @change="speedChange"
                      width="120px">
                  </el-slider>
                  <span slot="reference" class="el-dropdown-link">
                  倍速 {{ speed }}x
                </span>
                </el-popover>
              </div>
            </div>
            <div class="top-button-right">
              <div class="search-entity-bar">
                <el-tooltip class="item" effect="dark" content="搜索" placement="top">
                  <el-button type="text" @click="searchFocus=!searchFocus"
                             class="operation-area-btn el-icon-search"></el-button>
                </el-tooltip>
                <el-autocomplete
                    class="search-entity-autocomplete"
                    popper-class="timeline-autocomplete-popper"
                    v-model="searchName"
                    :style="{width: searchFocus?'100px':'0'}"
                    :fetch-suggestions="querySearch"
                    size="mini"
                    @select="searchEntity"
                ></el-autocomplete>
              </div>
              <el-tooltip class="item" effect="dark" content="添加关键帧" placement="top">
                <el-button type="text" class="operation-area-btn iconfont icon-keyframes"
                           @click="addKeyframe"></el-button>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="删除元素" placement="top">
                <el-button :disabled="!activateEntity" type="text" class="operation-area-btn iconfont icon-delete"
                           @click="deleteEntity(activateEntity)"></el-button>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="缩小比例" placement="top">
                <el-button type="text" class="operation-area-btn iconfont icon-suoxiao"
                           @click="changeScale(-10)"></el-button>
              </el-tooltip>
              <el-slider
                  v-model="trackScale.value" class="operation-area-slider" style="width: 100px;" :step="10"
                  :max="trackScale.max" :min="trackScale.min">
              </el-slider>
              <el-tooltip class="item" effect="dark" content="放大比例" placement="top">
                <el-button type="text" class="operation-area-btn iconfont icon-fangda"
                           @click="changeScale(10)"></el-button>
              </el-tooltip>
            </div>
          </div>
          <!--  轨道容器  -->
          <div class="bottom-operation-area">
            <track-icons
                class="operation-area-icon"
                :ele-type-style="eleTypeStyle"
                :offsetTop="startY"
                :focusTrack="focusTrack"
            />
            <div class="operation-area-wrapper"
                 ref="operationAreaRef"
                 @scroll="handleScroll">
              <!-- 刻度尺 -->
              <scale-line
                  class="scale-line-container"
                  ref="scaleLineRef"
                  :start="startX"
                  :scale="trackScale.value"
                  :step="trackStep"
                  :activate="activateEntity"
                  @selectFrame="timeDrop">
              </scale-line>
              <!-- 轨道栏 -->
              <tracks
                  class="tracks-container"
                  ref="tracksRef"
                  :offsetTop="startY"
                  :ele-type-style="eleTypeStyle"
                  :offset-line="offsetLine"
                  :scale="trackScale.value"
                  :step="trackStep"
                  @selectTrack="activatedTrack">
              </tracks>
            </div>
            <!-- 滚动的线 -->
            <div class="run-time-bar">
              <vue-draggable-resizable
                  v-show="playCursorX >= 0"
                  class="run-line-content"
                  ref="dragTimeLine"
                  :style="{marginLeft: offsetLine.left+'px'}"
                  :x="playCursorX"
                  :w="1"
                  :h="170"
                  axis="x"
                  :parent="true"
                  @dragging="onRunTimeLineDragging"
                  @dragstop="timeDrop"
                  :handles="[]">
                <div class="run-line-head-icon">
                  <div class="run-line-head-icon-first"></div>
                  <div class="run-line-head-icon-second"></div>
                </div>
                <div class="run_line"></div>
              </vue-draggable-resizable>
            </div>
          </div>
        </div>
      </template>
    </floating-bar>
</template>

<script>
import floatingBar from "@/components/floatingBar/index.vue";
import scaleLine from "./scaleline.vue";
import vueDraggableResizable from "vue-draggable-resizable"
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'
import tracks from "./tracks.vue";
import trackIcons from "./trackicons.vue";
import {transformSecond, transformTimeString} from "@/utils/timelineUtil";
import {getGridPixel} from "@/utils/scalelineUtils";

export default {
  name: "timeLine",
  components: {
    trackIcons,
    scaleLine,
    floatingBar,
    tracks,
    vueDraggableResizable
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {

      searchName: "",

      /** 激活搜索栏 */
      searchFocus: false,

      offsetLine: {
        left: 10,  // 容器 margin, 为了显示拖拽手柄
        right: 200
      },

      startX: 0,
      startY: 0,

      /** 缩放 */
      trackScale: {
        min: 0,
        max: 100,
        value: 30
      },
      /** 帧数 步长 */
      trackStep: 30,

      /** 实体元素配置相关 */
      eleTypeStyle: {
        captions: {h: 17, class: 'entity_track', bgColor: "#ee4863"},
        model: {h: 17, class: 'entity_track', bgColor: "#73575c"},
        place: {h: 17, class: 'entity_track', bgColor: "#428675"},
        boundary: {h: 17, class: 'entity_track', bgColor: "#32d5f1"},
        image: {h: 17, class: 'entity_track', bgColor: "#73575c"},
        particle: {h: 17, class: 'entity_track', bgColor: "#00ff00"},
        situation: {h: 17, class: 'entity_track', bgColor: "#525288"},
        text: {h: 17, class: 'entity_track', bgColor: "#ff6300"},
        camera: {h: 17, class: 'camera_track', bgColor: "#ffed37"},
        river: {h: 17, class: 'entity_track', bgColor: "#2530fd"},
        road: {h: 17, class: 'entity_track', bgColor: "#67C23A"},
        router: {h: 17, class: 'entity_track', bgColor: "#909399"},
        video: {h: 17, class: 'video_track', bgColor: "#ff00df"},
        audio: {h: 50, class: 'audio_track', bgColor: null},
      },

      /** 当前是否正在播放 */
      isPlay: false,

      /** 展示时间线 */
      visible: false,

      /** 当前激活轨道 */
      focusTrack: null,

      /** 系统时间 */
      currentTime: null,

      /** 时间帧 */
      keyframe: "00:00:00",

      /** 播放速度 */
      speed: 1
    }
  },
  computed: {
    activateEntity() {
      return this.$store.state.cesium.activateEntity
    },

    /** 时间线 */
    timeline() {
      const exampleTimes = this.$store.state.cesium.availability.split("/")
      return {
        startTime: exampleTimes[0].replace("T", " ").replace("Z", ""),
        endTime: exampleTimes[1].replace("T", " ").replace("Z", ""),
      }
    },

    /** 时间显示栏 */
    frameTimes() {
      return {
        current: this.keyframe.substring(0, 8),
        end: transformTimeString(this.timeline.endTime, this.timeline.startTime)
      }
    },

    /** 时间条偏移量 */
    playCursorX() {
      const times = transformSecond(this.keyframe)
      return getGridPixel(this.trackScale.value, times) - this.startX - this.offsetLine.left;
    },

    floatOffsetX(){
      return (window.innerWidth - 840) / 2
    },
    floatOffsetY(){
      return window.innerHeight - 250
    }
  },

  watch: {
    /** 监听是否展示 */
    visible(val) {
      this.$emit('input', val)
    },
    value(val) {
      this.visible = val
    }
  },
  methods: {

    /** 改变缩放值 */
    changeScale(val) {
      let newVal = this.trackScale.value + val;
      if (newVal > this.trackScale.max) newVal = this.trackScale.max;
      if (newVal < this.trackScale.min) newVal = this.trackScale.min;
      this.trackScale.value = newVal;
    },

    /** 修改播放速度 */
    speedChange(val) {
      this.speed = val
      this.$cesiumHelper.player.setSpeed(this.speed)
    },

    /** 添加关键帧 */
    addKeyframe() {
      this.$cesiumHelper.camera.addCamera({availability: this.currentTime}).then(entity => {
        const info = this.$cesiumHelper.getEntityInfo(entity)
        this.$store.dispatch("addEntitySource", info)
      }).catch(err => {
        this.$message.warning(err)
      })
    },

    /** 过滤搜索实体 */
    querySearch(queryString, cb) {
      const list = this.$store.getters.entities
      const result = list.filter(item => item.name.indexOf(queryString) !== -1 && item.type !== "group" && item.type !== "root");
      cb(result.map(item => {
        return {id: item.id, type: item.type, value: item.name}
      }));
    },

    /** 搜索实体 */
    searchEntity(val) {
      const offset = this.$refs.tracksRef.searchTrackOffsetTop(val)
      const innerHeight = this.$refs.operationAreaRef.clientHeight
      this.$refs.operationAreaRef.scrollTop = offset - innerHeight / 2
      this.$refs.tracksRef.activatedTrack(this.$cesiumHelper.getEntityInfo(val.id))
      this.searchName = ""
    },

    /** 时间拖动 */
    timeDrop(x) {
      x = x + this.startX + this.offsetLine.left > 0 ? x + this.startX + this.offsetLine.left : 0
      const dateString = this.$refs.tracksRef.getDateStringFromOffsetX(x)
      this.currentTime = dateString.replace(" ", "T") + "Z"
      this.$cesiumHelper.setCurrentTime(this.currentTime)
      this.keyframe = transformTimeString(dateString, this.timeline.startTime)
      this.$store.dispatch("setCurrentTime", dateString.replace(" ", "T") + "Z")
    },

    /** 时间变动回调*/
    timeChange(iso8601) {
      this.currentTime = iso8601
      this.keyframe = iso8601.split("T")[1].replace("Z", "")
      this.$store.dispatch("setCurrentTime", iso8601)
    },

    /** 轨道滚动事件 */
    handleScroll() {
      const {scrollLeft, scrollTop} = this.$refs.operationAreaRef;
      this.startX = scrollLeft - this.offsetLine.left;
      this.startY = scrollTop;
    },

    /** 删除实体 */
    deleteEntity(item) {
      this.$cesiumHelper.deleteObjById(item.id)
      this.$store.dispatch("removeEntitySource", item.id)
    },

    /** 激活轨道 */
    activatedTrack(item) {
      this.focusTrack = item
    },

    /** 播放 */
    play() {
      this.$cesiumHelper.player.play()
      this.isPlay = true
    },

    /** 暂停 */
    pause() {
      this.$cesiumHelper.player.pause()
      this.isPlay = false
    },
    /** 浮动框尺寸变动回调 */
    handleFloatResizing(handle, x, y, width, height){
      this.$refs.dragTimeLine.height = height - 80
    },
    /** 指针位置变动回调 */
    onRunTimeLineDragging(){
      this.$refs.dragTimeLine.top = 0
    }
  },
  created() {
    this.startX = 0 - this.offsetLine.left
  },
  mounted() {
    this.$nextTick(() => {


      this.currentTime = this.$store.state.cesium.currentTime
      this.$cesiumHelper.player.addEventListener("change", "timeChange", this.timeChange.bind(this))
    })
  }
}
</script>

<style lang="less" scoped>

.timeline-control-resizable{
  position: fixed;
  z-index: 999 !important;
  opacity: .85;
}

.czml-group {
  border: 1px white dashed;
}

.timeline-container {
  height: 100%;
  user-select: none;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  // 顶部工具栏
  .top-operation-area {
    min-height: 30px;
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;

    div {
      display: flex;
      align-items: center;
    }

    .operation-area-btn {
      color: #7a7a7a;
      font-size: 16px;

      &:hover {
        color: #000000;
      }
    }

    .top-button-left {
      width: 220px;
      margin-left: 5px;

      > .time-progress-bar {
        > span:last-child {
          font-size: 12px;
          margin: 0 5px;
        }

        > span:first-child {
          font-size: 12px;
          color: #409eff;
          margin-left: 10px;
          margin-right: 5px;
        }
      }

      .speed-change-bar {
        text-align: center;
        margin-left: 10px;

        .el-dropdown-link {
          cursor: pointer;
          line-height: 30px;
          font-size: 12px;
          color: #000000;
        }
      }
    }

    .top-button-right {
      height: 20px;
      display: flex;
      flex-flow: row;
      justify-content: space-around;

      .operation-area-slider {
        margin: 0 10px;
      }

      .search-entity-bar {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;
        margin-right: 10px;

        /deep/ .el-input__inner {
          padding: 0;
          border: none;
          border-bottom: 1px solid #838383;
          border-radius: 0;
        }

        .search-entity-autocomplete {
          transition: width .1s;
        }
      }
    }
  }

  // 内容栏
  .bottom-operation-area {
    min-height: calc(100% - 30px);
    display: flex;
    flex-direction: row;
    background-color: #d5d5d5;
    position: relative;
    overflow: hidden;

    .operation-area-icon {
      min-height: 100%;
      min-width: 48px;
    }

    .operation-area-wrapper {
      position: relative;
      min-height: 100%;
      min-width: calc(100% - 48px);
      overflow-x: scroll;
      overflow-y: auto;

      // 刻度尺
      .scale-line-container {
        z-index: 2;
        min-width: 100%;
        min-height: 20px;
        position: sticky;
        top: 0;
        left: 0;
      }

      // 时间轨道
      .tracks-container {
        min-height: calc(100% - 20px);
        position: absolute;
        z-index: 1;
        top: 20px;
      }

      &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 2px;
        background: rgba(0, 0, 0, 0.2);
      }

      &::-webkit-scrollbar-track {
        border-radius: 2px;
        background: rgba(0, 0, 0, 0.1);
      }
    }

    // 时间轨道
    .run-time-bar {
      height: calc(100% - 5px);
      min-width: 100%;
      position: absolute;
      left: 48px;

      .run-line-content {
        z-index: 2 !important;
        position: absolute;
        border: 0;
        top: 0;

        // 顶部小图标
        .run-line-head-icon {
          margin-bottom: -10px;
          cursor: col-resize;

          > .run-line-head-icon-first {
            width: 10px;
            height: 13px;
            transform: translateX(-50%);
            background-color: #000000;
          }

          > .run-line-head-icon-second {
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border: 5px solid transparent;
            border-top-color: #000000;
          }
        }

        // 线
        .run_line {
          width: 1px;
          background: #000000;
          height: 100%;
        }
      }
    }
  }
}
</style>

<style lang="less">
.customPopper {
  background-color: rgba(255, 255, 255, 0);
  border: none;
  padding: 0 15px;
  box-shadow: none;

  .el-slider__runway{
    background-color: rgba(195, 198, 203, 0.6);
  }

  .el-slider__button-wrapper{
    height: 15px;
    width: 15px;
    left: 0;
    top: -8px;
  }

  .el-tooltip {
    width: 8px;
    height: 8px;
  }

  .popper__arrow{
    display: none;
  }
}

.timeline-container {
  .timeline-autocomplete-popper {
    width: unset !important;
    min-width: 100px;
    max-width: 300px;
  }
}

</style>
