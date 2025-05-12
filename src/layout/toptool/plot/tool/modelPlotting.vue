<template>
  <!-- 三维模型标绘 -->
  <div class="model-plotting-contain">
    <el-collapse accordion v-model="activeName">
      <el-collapse-item v-for="(item, index) in modelMenu" :key="index" :title="item.name" :name="index">
        <div class="icon-plot-model-item">
          <img
              data-drop-type="cesium-drop-model"
              v-for="(i_item, i_index) in item.value"
              :key="i_index" :src="i_item.img"
              :data-model="i_item.model"
              @dragend="dragend">
        </div>
      </el-collapse-item>
      <el-collapse-item title="导入" v-loading="customModelLoading">
        <div class="input-wrapper">
          <el-input placeholder="请输入文件名" size="mini" v-model="queryParams.fileName" />
          <el-button size="mini" type="primary" @click="getCustomModelList(1)" icon="el-icon-search">搜索</el-button>
          <el-upload
              size="mini"
              class="upload-demo"
              :action="uploadFileUrl"
              :headers="headers"
              accept=".glb"
              :on-success="handleUploadSuccess">
            <el-button size="mini" type="success" icon="el-icon-upload2">上传</el-button>
          </el-upload>
        </div>
        <div class="icon-plot-model-item">
          <div class="icon-plot-model-item-ata" v-for="(i_item, i_index) in customModel" :key="i_index">
            <img
                :src="i_item.url"
                :data-model="i_item.model"
                @dragend="dragend"
            >
            <span>{{ i_item.name }}</span>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
              small
              layout="prev, pager, next"
              :total="total"
              @current-change="getCustomModelList">
          </el-pagination>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>

import store from "@/store";
import * as fileNodeApi from "@/api/file/node";

export default {
  name: "modelPlotting",
  data() {
    return {
      activeName: 0,

      /* 三维模型菜单 */
      modelMenu: [],

      uploadFileUrl: process.env.VUE_APP_BASE_API + "/file/upload", // 上传文件服务器地址
      headers: {
        Authorization: "Bearer " + this.getToken(),
      },

      /* 自定义图形 菜单 */
      customModel: [],

      customModelLoading: false,

      /* 自定义图形列表分页 */
      total: 0,

      /* 自定义图形过滤条件 */
      queryParams: {
        fileType: "glb",
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
    /** 获取模型菜单列表 */
    getModelList() {
      const data = [
        {
          name: "飞机",
          value: [
            {img: require("@/assets/images/modelPlotImgs/fighter.png"), model: "/static/model/fighter.glb"},
            {img: require("@/assets/images/modelPlotImgs/mig-21.png"), model: "/static/model/mig-21.glb"},
            {img: require("@/assets/images/modelPlotImgs/mig-23.png"), model: "/static/model/mig-23.glb"},
            {img: require("@/assets/images/modelPlotImgs/mig-24.png"), model: "/static/model/mig-24.glb"},
          ]
        }, {
          name: "坦克",
          value: [
            {img: require("@/assets/images/modelPlotImgs/runTank.png"), model: "/static/model/runTank.glb"},
          ]
        }, {
          name: "舰船",
          value: [
            {img: require("@/assets/images/modelPlotImgs/srlandet.png"), model: "/static/model/untitled.glb"},
            {img: require("@/assets/images/modelPlotImgs/u_boart.png"), model: "/static/model/submarine.glb"},
          ]
        }, {
          name: "车辆",
          value: [
            {img: require("@/assets/images/modelPlotImgs/military_truck.png"), model: "/static/model/military_truck.glb"},
            {img: require("@/assets/images/modelPlotImgs/Snipaste.png"), model: "/static/model/btr_80a.glb"},
            {img: require("@/assets/images/modelPlotImgs/passengerCar.png"), model: "/static/model/passengerCar.glb"}
          ]
        },
        {
          name: "卫星",
          value: [
            {img: require("@/assets/images/modelPlotImgs/weixin.png"), model: "/static/model/weixin.glb"}
          ]
        },
      ]
      this.modelMenu = data
    },

    /** 获取自定义模型 */
    getCustomModelList(val){
      this.customModelLoading = true
      this.queryParams.pageNum = val
      fileNodeApi.list(this.queryParams).then(res=>{
        this.total = res.total
        this.customModel = res.rows.map(item=>{return {id:item.id, name: item.fileName, url: require("@/assets/images/modelPlotImgs/gltf.png"), model: "/static/model/military_truck.glb"}})
        this.customModelLoading = false
      }).catch(()=>{
        this.customModelLoading = false
      })
    },

    /** 上传成功回调 */
    handleUploadSuccess(res, file) {
      this.queryParams.fileName = file.name
      this.getCustomModelList(1)
    },

    async dragend(event) {
      event.preventDefault()
      event.stopPropagation();
      // 获取鼠标所在坐标对应的经纬度
      const position = await this.$cesiumHelper.windowLocationToLatitudeAndLongitude(event)
      this.$cesiumHelper.plotting.modelPlotting.createModelPlot({
        url: event.target.dataset.model,
        scale:0.1,
        position: position
      }).then(entity => {
        const info = this.$cesiumHelper.getEntityInfo(entity)
        store.dispatch("addEntitySource", info)
      })

    },
  },
  mounted() {
    this.getModelList()
    this.getCustomModelList(1)
  }
}
</script>

<style lang="less" scoped>
.model-plotting-contain {
  width: 400px;
}

.icon-plot-model-item {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
}
.icon-plot-model-item > img{
  width: 60px;
  cursor: pointer;
  padding: 5px;
}
.icon-plot-model-item-ata > img
{
  width: 40px;
  height: 40px;
  cursor: pointer;
  margin: auto;
}
.icon-plot-model-item-ata{
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow: hidden;
  width: 60px;
  padding-top: 5px;
}
.icon-plot-model-item-ata:hover{
  background-color: #EBEBEB;
}
.icon-plot-model-item-ata > span {
  font-size: 12px;
  overflow:hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: start;
  cursor: pointer;
  padding: 0 5px;
}

/deep/ .el-collapse-item__content {
  padding: 10px;
}

.model-plotting-contain /deep/ .el-collapse-item__header {
  font-size: 12px;
}

.input-wrapper{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;

  padding-bottom: 10px;

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

.pagination-wrapper{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
}

/deep/.upload-demo{

  .el-upload-list{
    display: none;
  }
}
</style>
