<template xmlns:videoExport="http://www.w3.org/1999/html">
  <div class="tool-group-container">
    <div class="tool-group-item-body">
      <!--   二三维分屏   -->
      <div class="group-item-btn" @click="splitScreen" :class="split ? 'is-active' : ''">
        <div class="group-btn-top">
          <i class="iconfont icon-fenping"></i>
          <span>场景分屏</span>
        </div>
      </div>
      <!--   屏幕固定   -->
      <div class="group-item-btn" @click="fixedScreen" :class="fixed ? 'is-active' : ''">
        <div class="group-btn-top">
          <i class="iconfont icon-guding"></i>
          <span>固定屏幕</span>
        </div>
      </div>
      <!--   视频录制   -->
      <div class="group-item-btn" @click="videoRecording" :class="video ? 'is-active' : ''">
        <div class="group-btn-top">
          <i class="iconfont icon-shipin2"></i>
          <span>屏幕录制</span>
        </div>
      </div>
      <videoExport v-show="videoFormat" ref="video" @updateParent="updateParent"></videoExport>
      <!--   瓦片缓存   -->
      <div class="group-item-btn" @click="mapTilesCache" :class="mapSave ? 'is-active' : ''">
        <div class="group-btn-top">
          <i class="iconfont icon-tupianhuancun"></i>
          <span>瓦片缓存</span>
        </div>
      </div>
      <!--  协同标绘  -->
      <div class="group-item-btn" @click="openOutCooperate">
        <div class="group-btn-top">
          <i class="iconfont icon-xietong2"></i>
          <span>协同标绘</span>
        </div>
      </div>
    </div>

    <!--  协同标绘对话框  -->
    <el-dialog
        title="协同标绘"
        append-to-body
        width="500px"
        :modal="false"
        :visible.sync="cooperateOutVisible"
        custom-class="cooperate-out-dialog">
      <span>你可以邀请其他人到目前的画面中与你协作。</span>
      <el-dialog
          title="协同标绘"
          :modal="false"
          append-to-body
          :visible.sync="cooperateInnerVisible"
          custom-class="cooperate-inner-dialog"
          width="500px">
        <el-form label-position="top" label-width="80px" v-model="cooperateForm">
          <el-form-item label="房间名">
            <el-input v-model="cooperateForm.name"></el-input>
          </el-form-item>
          <el-form-item label="链接">
            <div class="link-rows">
              <el-input v-model="cooperateForm.link"></el-input>
              <el-button icon="el-icon-document-copy" @click="copyLink(cooperateForm.link)" type="success">拷贝链接</el-button>
            </div>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button type="danger" @click="openInnerCooperate">
            <i class="iconfont icon-tingzhi"></i>
            结束会话</el-button>
        </span>
      </el-dialog>
      <div slot="footer" class="dialog-footer">
        <el-button icon="el-icon-caret-right" type="primary" @click="openInnerCooperate">开始会话</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import videoExport from "@/layout/toptool/other/video.vue";
import * as uuid from "@/utils/uuid"
export default {
  name: "index",
  components: {videoExport},
  data() {
    return {
      fixed: false,
      video: false,
      mapSave:false,
      videoFormat: false, //控制视频设置弹框
      split: false,
      exportModule: null,

      // 协同标绘对话框
      cooperateOutVisible: false,
      cooperateInnerVisible: false,
      cooperateForm: {}
    }
  },
  methods: {

    /** 屏幕固定 */
    fixedScreen() {
      this.fixed = !this.fixed
      this.$cesiumHelper.isFixedScreen(this.fixed)
    },
    /** 点击屏幕录制按钮 */
    videoRecording() {
      this.video = !this.video
      if(this.video){
        this.$refs.video.startVideoRecording()
            .then(videoPopResult => {
              this.videoFormat = videoPopResult
              this.video = !videoPopResult
              // 在这里处理返回的结果
            })
            .catch(error => {
              console.error('视频录制出错：', error);
              // 在这里处理错误情况
            });
      }else {
        this.videoFormat =  this.$refs.video.endVideoRecording()
      }
    },
    /** 场景分屏 */
    splitScreen() {
      this.split ? this.$cesiumHelper.endSplitScreen() : this.$cesiumHelper.startSplitScreen()
      this.split = !this.split
    },
    /** 瓦片缓存 */
    mapTilesCache(){
      const url = process.env.VUE_APP_VIDEO_API +"/map/read/{z}/{x}/{y}.png"
      this.$cesiumHelper.changeMapSource(url)
      // this.mapSave ? this.$cesiumHelper.restoresDefaultSource() : this.$cesiumHelper.changeMapSource("http://localhost:9090/map/read/{z}/{x}/{y}.png")
      this.mapSave = !this.mapSave
    },
    /** 打开协同标绘外层弹框 */
    openOutCooperate(){
      if (this.$store.getters.mode === "coordination") {
        this.cooperateForm = { name: "Your room name", link: `http://${window.location.hostname}:${window.location.port}?room=${this.$route.query.room}` }
        this.cooperateInnerVisible = true
        this.cooperateOutVisible = false
      } else {
        this.cooperateOutVisible = true
        this.cooperateInnerVisible = false
      }
    },

    /** 打开协同标绘内层弹框 */
    openInnerCooperate(){
      const room = this.$route.query.room || uuid.uuid()
      this.$router.push({name: '', query: {room: room}})

      this.cooperateForm = { name: "Your room name", link: `http://${window.location.hostname}:${window.location.port}?room=${room}` }
      this.cooperateInnerVisible = true
      this.cooperateOutVisible = false
    },

    /** 拷贝到剪切板 */
    copyLink(link){
      navigator.clipboard.writeText(link).then(()=>this.$message.success("链接已复制到剪切板")).catch(()=>this.$message.error("链接复制失败，请重试"))
    },
    /** 控制设置视频弹框 */
    updateParent(newValue) {
      this.videoFormat = newValue;
    },
  }
}
</script>

<style scoped>
.tool-group-item-body {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
}

.group-item-btn {
  padding: 10px 10px 0 10px;
  cursor: pointer;
  height: 46px;
  box-sizing: border-box;
  position: relative;
}

.group-item-btn:hover {
  background-color: #D2D2D2;
}

.group-btn-top {
  display: flex;
  align-items: center;
}

.group-btn-top > span {
  display: inline-block;
  margin-left: 5px;
  font-size: 12px;
}

.group-btn-top > i {
  font-size: 20px;
}

.is-active {
  background-color: #D2D2D2;
}
</style>

<style>
.cooperate-out-dialog{
  border-radius: 0;

  .el-dialog__header{
    text-align: center;
    padding: 20px 0;
  }

  .el-dialog__body{
    padding: 10px 30px;
    text-align: center;
  }

  .el-dialog__footer{
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;

    padding: 20px 0;
  }
}

.cooperate-inner-dialog{
  .el-dialog__header{
    text-align: center;
    padding: 20px 0;
  }

  .el-dialog__body{
    padding: 10px 30px;
    text-align: left;

    .el-form-item{
      margin-bottom: 10px;

      .el-form-item__label{
        padding-bottom: 0;
      }
    }

    .link-rows{
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;

      button{
        margin-left: 15px;
      }
    }
  }

  .el-dialog__footer{
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;

    padding: 20px 0;
  }
}
</style>
