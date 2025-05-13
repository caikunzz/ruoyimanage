<template>
  <div class="audio-group-container">
    <el-collapse accordion v-model="activeName">
      <el-collapse-item title="文本转换">
        <div class="audio-group-body">
          <div
            class="audio-item text-to-audio"
            @click="dialogFormVisible = true"
          >
            <img
              draggable="false"
              class="audio-icon"
              src="../../../../assets/images/audio/text_to_audio.png"
            />
            <span class="text" style="margin-top: auto">文本转语音</span>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item
        v-for="(item, index) in audioList"
        :key="index"
        :title="item.name"
        :name="index"
      >
        <div class="audio-group-body">
          <div
            class="audio-item"
            v-for="(i_item, i_index) in item.value"
            :key="i_index"
          >
            <img
              class="audio-icon"
              @dragend="addAudio(i_item)"
              src="../../../../assets/images/audio/effect_0.gif"
            />
            <span class="text" style="margin-top: auto">{{ i_item.text }}</span>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="导入文件" v-loading="customAudioLoading">
        <div class="input-wrapper">
          <el-input
            placeholder="请输入文件名"
            size="mini"
            v-model="queryParams.fileName"
          />
          <el-button
            size="mini"
            type="primary"
            @click="getCustomAudioList(1)"
            icon="el-icon-search"
            >搜索</el-button
          >
          <el-upload
            size="mini"
            class="upload-demo"
            :action="uploadFileUrl"
            :headers="headers"
            accept=".mp3,.wav"
            :on-success="handleUploadSuccess"
          >
            <el-button size="mini" type="success" icon="el-icon-upload2"
              >上传</el-button
            >
          </el-upload>
        </div>
        <div class="audio-group-body">
          <div
            class="audio-item audio-item-custom"
            v-for="(i_item, i_index) in customAudio"
            :key="i_index"
          >
            <img
              src="../../../../assets/images/audio/effect_0.gif"
              :data-url="i_item.url"
              @dragend="addAudio(i_item)"
            />
            <span>{{ i_item.text }}</span>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            small
            layout="prev, pager, next"
            :total="total"
            @current-change="getCustomAudioList"
          >
          </el-pagination>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!--  语音转文字弹出框  -->
    <el-dialog
      custom-class="caption-dialog"
      title="文本转语音"
      width="400px"
      :visible.sync="dialogFormVisible"
      :modal="false"
    >
      <el-form :model="textToAudioForm" label-position="right">
        <el-form-item label="文本：" label-width="90px">
          <el-input
            size="mini"
            style="width: 100%"
            type="textarea"
            :rows="2"
            v-model="textToAudioForm.text"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog" size="mini">取 消</el-button>
        <el-button type="primary" @click="textToAudio" size="mini"
          >添 加</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import store from "@/store";
import * as speechApi from "@/api/cesium/speech.js";
import * as fileNodeApi from "@/api/file/node";

export default {
  name: "index",
  data() {
    return {
      activeName: 0,

      /* 音频菜单 */
      audioList: [],

      dialogFormVisible: false,

      textToAudioForm: {
        text: "",
      },

      uploadFileUrl: process.env.VUE_APP_BASE_API + "/file/upload", // 上传文件服务器地址
      headers: {
        Authorization: "Bearer " + this.getToken(),
      },

      /* 自定义图形 菜单 */
      customAudio: [],

      customAudioLoading: false,

      /* 自定义图形列表分页 */
      total: 0,

      /* 自定义图形过滤条件 */
      queryParams: {
        classifyId: 4,
        status: 1,
        pageSize: 12,
        pageNum: 1,
        fileName: undefined,
      },
    };
  },
  methods: {
    /** 获取token */
    getToken() {
      return localStorage.getItem("token");
    },
    /** 获取模型菜单列表 */
    getModelList() {
      const data = [
        {
          name: "音频文件",
          value: [
            { text: "机关枪", url: "/static/audio/机关枪.mp3" },
            { text: "炮弹声", url: "/static/audio/炮声.mp3" },
            { text: "刀剑碰撞", url: "/static/audio/刀剑碰撞.mp3" },
            { text: "空中力量", url: "/static/audio/空中力量.mp3" },
          ],
        },
      ];
      this.audioList = data;
    },

    getCustomAudioList(val) {
      this.customAudioLoading = true;
      this.queryParams.pageNum = val;
      fileNodeApi
        .list(this.queryParams)
        .then((res) => {
          this.total = res.total;
          this.customAudio = res.rows.map((item) => {
            return { id: item.id, text: item.fileName, url: item.fileUrl };
          });
          this.customAudioLoading = false;
        })
        .catch(() => {
          this.customAudioLoading = false;
        });
    },

    /** 上传成功回调 */
    handleUploadSuccess(res, file) {
      this.queryParams.fileName = file.name;
      this.getCustomModelList(1);
    },
    /** 关闭对话框 */
    closeDialog() {
      this.textToAudioForm.text = "";
      this.dialogFormVisible = false;
    },

    /** 文本转语音 */
    async textToAudio() {
      const text = this.textToAudioForm.text;
      const url = await speechApi.tts(text);
      const options = {
        name: text,
        url: url,
      };
      await this.addAudio(options);
      this.closeDialog();
    },
    /** 添加音频 */
    async addAudio(options) {
      const entity = await this.$cesiumHelper.audio.addAudio({
        name: options.text,
        references: options.url,
      });
      const info = this.$cesiumHelper.audio.getAudioToJson(entity);
      await store.dispatch("addEntitySource", info);
    },
  },
  mounted() {
    this.getModelList();
    this.getCustomAudioList(1);
  },
};
</script>

<style lang="less" scoped>
.audio-group-container {
  width: 400px;
  background-color: red;
}
.audio-group-body {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
}
.text-to-audio > .audio-icon {
  width: 20px;
  height: 20px;
}
.audio-item {
  display: flex;
  flex-direction: column;
  align-items: center; /* 居中对齐子元素（图标和文本） */
  cursor: pointer;
  width: 60px;
  overflow: hidden;
}
.audio-item:hover {
  background-color: #ebebeb;
}
.audio-item > img {
  width: 40px;
  height: 30px;
  padding: 5px;
}
.audio-item > span {
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: start;
  cursor: pointer;
  padding: 0 5px;
}
.audio-item-custom {
  align-items: start; /* 居中对齐子元素（图标和文本） */
  > img {
    margin: auto;
  }
  > span {
    width: 60px;
  }
}

.input-wrapper {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;

  padding-bottom: 10px;

  .el-input {
    width: 120px;
    margin-left: 10px;
  }

  .el-button {
    padding: 0;
    margin-left: 10px;
    width: 55px;
    height: 28px;
  }
}

.pagination-wrapper {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
}

/deep/.upload-demo {
  .el-upload-list {
    display: none;
  }
}

/deep/.el-collapse-item__content {
  padding: 10px;
}
.model-plotting-contain /deep/.el-collapse-item__header {
  font-size: 12px;
}

.audio-group-container /deep/.el-collapse-item__header {
  font-size: 12px;
}
</style>
