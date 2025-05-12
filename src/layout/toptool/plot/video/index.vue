<template>
  <div class="video-group-container" >
    <el-collapse accordion v-model="activeName">
      <el-collapse-item title="导入文件" name="0" v-loading="customVideoLoading">
        <div class="input-wrapper">
          <el-input placeholder="请输入文件名" size="mini" v-model="queryParams.fileName" />
          <el-button size="mini" type="primary" @click="getCustomVideoList(1)" icon="el-icon-search">搜索</el-button>
          <el-button @click="openDialog()" size="mini" type="success" icon="el-icon-upload2">上传</el-button>
        </div>
        <div class="video-group-body">
          <div class="video-item" @dragend="openDialog(i_item)" v-for="(i_item, i_index) in customVideo" :key="i_index">
            <video
                draggable="true"
                :src="i_item.url"
            />
            <span>{{ i_item.text }}</span>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
              small
              layout="prev, pager, next"
              :total="total"
              @current-change="getCustomVideoList">
          </el-pagination>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 添加或修改视频对话框 -->
    <el-dialog title="导入视频" custom-class="video-dialog" :visible.sync="videoDialog" width="650px" append-to-body>
      <el-form ref="videoForm" label-position="right" :model="form" :rules="rules" label-width="70px">
        <el-col :span="24">
          <el-form-item label="名称" prop="name">
            <el-input size="small" v-model.number="form.name" placeholder="请输入视频名称"/>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="宽度" prop="width">
            <el-input size="small" disabled v-model="form.width"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="高度" prop="height">
            <el-input size="small" disabled v-model="form.height"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="缩放" prop="height">
            <el-input-number size="small" v-model="form.scale" @change="handleScaleChange" :min="1"
                             :max="5"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="偏移(X)" prop="left">
            <el-input size="small" v-model="form.left"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="偏移(Y)" prop="top">
            <el-input size="small" v-model="form.top"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上传" prop="path">
            <file-upload size="small" v-model="form.path" :file-size="3072" :file-type="['mp4']" :limit="1"/>
          </el-form-item>
        </el-col>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submit">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import fileUpload from "@/components/fileUpload/index.vue";
import store from "@/store";
import * as fileNodeApi from "@/api/file/node";

export default {
  name: "index",
  components: {fileUpload},
  data() {
    return {
      activeName: ['0'],

      videoDialog: false,

      form: {
        id: null,
        name: null,
        path: null,
        width: 300,
        height: "auto",
        left: 185,
        top: 453,
        scale: 2.6
      },

      rules: {
        name: [
          {required: true, message: '请输入视频名称', trigger: "blur"}
        ],
        left: [
          {required: true, message: '请输入偏移量(X)', trigger: "blur"}
        ],
        top: [
          {required: true, message: '请输入偏移量(Y)', trigger: "blur"}
        ],
        path: [
          {required: true, message: '请上传视频', trigger: "change"}
        ],
      },

      uploadFileUrl: process.env.VUE_APP_BASE_API + "/file/upload", // 上传文件服务器地址
      headers: {
        Authorization: "Bearer " + this.getToken(),
      },

      /* 自定义图形 菜单 */
      customVideo: [],

      customVideoLoading: false,

      /* 自定义图形列表分页 */
      total: 0,

      /* 自定义图形过滤条件 */
      queryParams: {
        classifyId: 3,
        status: 1,
        pageSize: 12,
        pageNum: 1,
        fileName: undefined
      },
    }
  },
  methods: {

    /** 获取token */
    getToken(){
      return localStorage.getItem("token")
    },

    getCustomVideoList(val){
      this.customVideoLoading = true
      this.queryParams.pageNum = val
      fileNodeApi.list(this.queryParams).then(res=>{
        this.total = res.total
        this.customVideo = res.rows.map(item=>{return {id:item.id, text: item.fileName, url: item.fileUrl}})
        this.customVideoLoading = false
      }).catch(()=>{
        this.customAudioLoading = false
      })
    },

    /** 导入视频 */
    openDialog(data) {
      if (data){
        this.form.name = data.text
        this.form.path = data.url
      }
      this.videoDialog = true
    },

    /** 缩放改变 */
    handleScaleChange(num) {
      this.form.width = 300 * num
    },

    /** 添加视频 */
    submit() {
      this.$refs.videoForm.validate(valid => {
        if (valid) {
          const options = {
            name: this.form.name,
            position: [this.form.left, this.form.top, 0],
            scale: this.form.scale,
            references: this.form.path
          }
          this.$cesiumHelper.video.addVideo(options).then(entity=>{
            const info = this.$cesiumHelper.getEntityInfo(entity)
            store.dispatch("addEntitySource", info)
            this.reset()
            this.videoDialog = false
          })
        }
      })
    },

    /** 取消 */
    cancel() {
      this.reset()
      this.videoDialog = false
    },

    reset() {
      this.form.id = null
      this.form.name = ""
      this.form.width = 300
      this.form.height = "auto"
      this.form.top = 453
      this.form.left = 185
      this.form.scale = 2.6
      this.form.path = null
      this.$refs["videoForm"].resetFields();
    }
  },
  mounted() {
    this.getCustomVideoList(1)
  }
}
</script>

<style lang="less" scoped>
.video-group-container {
  width: 400px;

  /deep/ .el-collapse-item__content {
    padding-bottom: 0;
  }
}

/deep/.video-dialog{
  .el-dialog__body{
    .el-form-item.is-required:not(.is-no-asterisk) .el-form-item__label-wrap>.el-form-item__label:before, .el-form-item.is-required:not(.is-no-asterisk)>.el-form-item__label:before{
      display: none;
    }
  }
}

.video-group-body {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;

  padding: 10px;
}

.video-item {

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  width: 60px;
  cursor: pointer;
  overflow: hidden;
  user-select: none;

  &:hover{
    background-color: #EBEBEB;
  }

  video{
    width: 40px;
    height: 30px;
    padding: 5px;
    margin: auto;
  }

  span {
    font-size: 12px;
    overflow:hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: start;
    cursor: pointer;
    padding: 0 5px;
  }
}

.input-wrapper{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;

  padding-top: 10px;

  .el-input{
    width: 120px;
    margin-left: 10px;
  }

  .el-button{
    padding: 0;
    margin-left: 10px;
    width: 55px;
    height: 28px;
  }
}

/deep/.upload-demo{

  .el-upload-list{
    display: none;
  }
}

.pagination-wrapper{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
}
</style>
