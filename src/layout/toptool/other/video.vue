<template>
  <div id="videoEdit">
    <el-dialog
      title="视频导出"
      :modal="false"
      :visible.sync="isDialogVisible"
      width="380px"
      :before-close="handleClose"
    >
      <el-form label-position="right" label-width="80px">
        <el-collapse v-model="activeNames" @change="handleChange">
          <el-collapse-item title="视频" name="1">
            <el-form-item label="名称：">
              <el-input
                size="mini"
                v-model="form.name"
                placeholder="请输入标题"
              ></el-input>
            </el-form-item>
            <el-form-item label="格式：" clearable size="mini">
              <el-select v-model="form.video.format" placeholder="请选择">
                <el-option
                  v-for="item in form.video.VideoFormat"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="编码：" clearable size="mini">
              <el-select v-model="form.video.coding" placeholder="请选择">
                <el-option
                  v-for="item in form.video.VideoCoding"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="帧率：" clearable size="mini">
              <el-select
                v-model="form.video.frameRateValue"
                placeholder="请选择"
              >
                <el-option
                  v-for="item in form.video.frameRate"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="分辨率：" clearable size="mini">
              <el-select
                v-model="form.video.resolutionValue"
                placeholder="请选择"
              >
                <el-option
                  v-for="item in form.video.resolution"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-collapse-item>
          <el-collapse-item title="音频" name="2">
            <el-form-item label="格式：" clearable size="mini">
              <el-select v-model="form.audio.format" placeholder="请选择">
                <el-option
                  v-for="item in form.audio.audioFormat"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="比特率：" clearable size="mini">
              <el-select v-model="form.audio.bitRateValue" placeholder="请选择">
                <el-option
                  v-for="item in form.audio.bitRate"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="采样率：" clearable size="mini">
              <el-select
                v-model="form.audio.samplingRateValue"
                placeholder="请选择"
              >
                <el-option
                  v-for="item in form.audio.samplingRate"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="submitDialog">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import * as gisFileApi from "@/api/cesium/gisFile";
import RecordRTC from "recordrtc";
import { Loading } from "element-ui";

export default {
  name: "videoExport",
  props: {
    videoFormat: Boolean,
  },
  data() {
    return {
      isDialogVisible: true,
      recorder: null,
      activeNames: ["1"],
      form: {
        name: "",
        video: {
          VideoFormat: [
            {
              value: "mkv",
              label: "mkv",
            },
            {
              value: "avi",
              label: "avi",
            },
            {
              value: "asf",
              label: "asf",
            },
            {
              value: "3gp",
              label: "3gp",
            },
            {
              value: "mov",
              label: "mov",
            },
            {
              value: "wmv",
              label: "wmv",
            },
            {
              value: "mp4",
              label: "mp4（MPEG-4）",
            },
            {
              value: "mpeg",
              label: "mpeg（MPEG-2）",
            },
          ],
          VideoCoding: [
            {
              value: "libx264",
              label: "H.264",
            },
            {
              value: "libx265",
              label: "HEVC",
            },
            {
              value: "libaom-av1",
              label: "Av1",
            },
          ],
          resolution: [
            { label: "480p", value: "640*480" },
            { label: "720p", value: "1280*720" },
            { label: "1080p", value: "1920*1080" },
            { label: "2k", value: "2560x1440" },
            { label: "4k", value: "3840x2160" },
          ],
          frameRate: [
            { label: "30fps", value: "30" },
            { label: "60fps", value: "60" },
          ],
          format: "mp4",
          coding: "libx264",
          resolutionValue: "1920*1080",
          frameRateValue: "30",
        },
        audio: {
          audioFormat: [
            { label: "MP3", value: "libmp3lame" },
            { label: "AAC", value: "aac " },
          ],
          bitRate: [
            { label: "32kbps", value: "32" },
            { label: "64kbps", value: "64" },
            { label: "128kbps", value: "128" },
            { label: "256kbps", value: "256" },
          ],
          samplingRate: [
            { label: "16kbps", value: "16000" },
            { label: "32kbps", value: "32000" },
            { label: "44.1kbps", value: "44100" },
            { label: "96kbps", value: "96000" },
          ],
          format: "aac",
          bitRateValue: "128",
          samplingRateValue: "44100",
        },
      },
    };
  },
  methods: {
    handleClose(done) {
      this.$confirm("确认关闭？")
        // eslint-disable-next-line no-unused-vars
        .then((_) => {
          done();
        })
        // eslint-disable-next-line no-unused-vars
        .catch((_) => {});
    },
    /** 开始屏幕录制 */
    startVideoRecording() {
      console.log("开始");
      const videoElement = document.getElementById("cesiumContainer");
      // 返回一个 Promise
      return new Promise((resolve, reject) => {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then((screenStream) => {
            screenStream.getVideoTracks()[0].onended = async () => {
              // 单击停止共享按钮后，触发这个事件
              console.log("停止共享");
              // 内置停止分享触发的媒体流状态变化
              const result = this.endVideoRecording();
              // 使用 resolve 返回结果
              resolve(result);
            };
            videoElement.srcObject = screenStream;
            this.recorder = RecordRTC(screenStream, {
              type: "video",
              mimeType: "video/mp4",
              canvas: {
                width: videoElement.clientWidth,
                height: videoElement.clientHeight,
              },
            });
            this.recorder.startRecording();

            // 添加媒体流状态变化的监听器
            // screenStream.addEventListener('inactive', () => {
            //     // 内置停止分享触发的媒体流状态变化
            //     this.endVideoRecording();
            // });
          })
          .catch((error) => {
            console.error("获取屏幕音频和视频流失败：", error);
            reject(error); // 如果出现错误，使用 reject 返回错误信息
          });
      });
    },
    /** 结束屏幕录制 */
    endVideoRecording() {
      console.log("结束");
      if (this.recorder) {
        // 停止屏幕共享
        const videoElement = document.getElementById("cesiumContainer");
        const screenStream = videoElement.srcObject;
        if (screenStream) {
          const tracks = screenStream.getTracks();
          tracks.forEach((track) => {
            track.stop();
          });
        }
      }
      return true;
    },
    submitDialog() {
      const loadingInstance = Loading.service({
        fullscreen: true,
        text: "正在导出视频...",
        background: "rgba(0,0,0,.6)",
      });
      const formData = new FormData();
      formData.append("name", this.form.name);
      formData.append("format", this.form.video.format);
      formData.append("coding", this.form.video.coding);
      formData.append("resolutionValue", this.form.video.resolutionValue);
      formData.append("frameRateValue", this.form.video.frameRateValue);
      formData.append("audioFormat", this.form.audio.format);
      formData.append("bitRateValue", this.form.audio.bitRateValue);
      formData.append("samplingRateValue", this.form.audio.samplingRateValue);
      formData.append("file", this.recorder.getBlob());
      gisFileApi.exportVideo(formData).then((response) => {
        // 创建 Blob 对象
        const blob = new Blob([response]);
        const fileName = this.form.name + "." + this.form.video.format;

        // 创建下载链接并触发点击
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = decodeURIComponent(fileName); // 设置下载文件名
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // 清理临时节点
        loadingInstance.close();
      });
      this.$emit("updateParent", false);
    },
    closeDialog() {
      this.$emit("updateParent", false);
    },
    handleChange(val) {
      console.log(val);
    },
  },
};
</script>

<style scoped>
#videoEdit .el-input {
  width: 220px;
  margin-left: -65px;
  margin-bottom: -25px !important;
}

#videoEdit .el-select {
  width: 220px;
  margin-left: -65px;
}

#videoEdit . {
  padding-bottom: -2px;
}
</style>
