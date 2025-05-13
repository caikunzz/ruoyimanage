<template>
  <div class="entity-animation">
    <el-collapse accordion v-model="activeName">
      <el-collapse-item
        v-for="(item, index) in modelMenu"
        :key="index"
        :title="item.name"
        :name="index"
      >
        <div class="particles-plot-item">
          <div
            class="particles-wrapper"
            v-for="(i_item, i_index) in item.value"
            :key="i_index"
          >
            <img
              class="particles"
              data-drop-type="cesium-drop-particles"
              :src="i_item.img"
              :data-gif="i_item.text"
              :data-url="i_item.url"
              @dragend="dragend"
            />
            <span class="text" style="margin-top: auto">{{ i_item.text }}</span>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item title="导入文件" v-loading="customParticleLoading">
        <div class="input-wrapper">
          <el-input
            placeholder="请输入文件名"
            size="mini"
            v-model="queryParams.fileName"
          />
          <el-button
            size="mini"
            type="primary"
            @click="getCustomParticleList(1)"
            icon="el-icon-search"
            >搜索</el-button
          >
          <el-upload
            size="mini"
            class="upload-demo"
            :action="uploadFileUrl"
            :headers="headers"
            accept=".gif"
            :on-success="handleUploadSuccess"
          >
            <el-button size="mini" type="success" icon="el-icon-upload2"
              >上传</el-button
            >
          </el-upload>
        </div>
        <div class="particles-plot-item">
          <div
            class="particles-wrapper particles-wrapper-custom"
            v-for="(i_item, i_index) in customParticle"
            :key="i_index"
          >
            <img :src="i_item.url" :data-url="i_item.url" @dragend="dragend" />
            <span>{{ i_item.name }}</span>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            small
            layout="prev, pager, next"
            :total="total"
            @current-change="getCustomParticleList"
          >
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
  name: "particlePlotting",
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
      customParticle: [],

      customParticleLoading: false,

      /* 自定义图形列表分页 */
      total: 0,

      /* 自定义图形过滤条件 */
      queryParams: {
        fileType: "gif",
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
          name: "粒子特效",
          value: [
            {
              img: require("@/assets/images/gif/blast.png"),
              text: "爆炸",
              url: "/static/gif/blast2.gif",
            },
            {
              img: require("@/assets/images/gif/碰撞.png"),
              text: "撞击",
              url: "/static/gif/碰撞.gif",
            },
            {
              img: require("@/assets/images/gif/giphy.png"),
              text: "枪焰",
              url: "/static/gif/giphy.gif",
            },
            {
              img: require("@/assets/images/gif/Wildfire.png"),
              text: "火焰",
              url: "/static/gif/Wildfire.gif",
            },
            {
              img: require("@/assets/images/gif/smoke.png"),
              text: "烟雾",
              url: "/static/gif/smoke.gif",
            },
          ],
        },
      ];
      this.modelMenu = data;
    },
    /** 获取自定义模型 */
    getCustomParticleList(val) {
      this.customParticleLoading = true;
      this.queryParams.pageNum = val;
      fileNodeApi
        .list(this.queryParams)
        .then((res) => {
          this.total = res.total;
          this.customParticle = res.rows.map((item) => {
            return { id: item.id, name: item.fileName, url: item.fileUrl };
          });
          this.customParticleLoading = false;
        })
        .catch(() => {
          this.customParticleLoading = false;
        });
    },
    /** 上传成功回调 */
    handleUploadSuccess(res, file) {
      this.queryParams.fileName = file.name;
      this.getCustomParticleList(1);
    },
    async dragend(event) {
      event.preventDefault();
      event.stopPropagation();
      const url = event.target.dataset.url;
      // 获取鼠标所在坐标对应的经纬度
      const position =
        await this.$cesiumHelper.windowLocationToLatitudeAndLongitude(event);
      this.$cesiumHelper.plotting.particlePlotting
        .createParticlePlot({ url, position })
        .then((entity) => {
          const info = this.$cesiumHelper.getEntityInfo(entity);
          store.dispatch("addEntitySource", info);
        });
    },
  },
  mounted() {
    this.getModelList();
    this.getCustomParticleList(1);
  },
};
</script>

<style lang="less" scoped>
.el-dialog__wrapper {
  z-index: 0;
}

.entity-animation {
  width: 400px;
  background-color: red;
}

.particles-plot-item {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
}

.particles-plot-item .particles-wrapper > img {
  width: 40px;
  height: 40px;
  padding: 5px;
  cursor: pointer;
  margin: auto;
}

.particles-wrapper:hover {
  background-color: #ebebeb;
}
.particles-wrapper > span {
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
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

/deep/ .el-collapse-item__content {
  padding: 10px;
}

.model-plotting-contain /deep/ .el-collapse-item__header {
  font-size: 12px;
}

.particles-wrapper {
  display: flex;
  flex-direction: column;
  width: 60px;
  overflow: hidden;
  text-align: center;
}

.particles-wrapper-custom {
  text-align: start;
  > span {
    padding: 0 5px;
  }
}

.positionInput {
  width: 130px;
  /*padding: 0 15px;*/
  /*margin-top: 6px;*/
}

.pickupIco {
  margin-left: 5px;
  display: inline;
  cursor: pointer;
  border-radius: 2px; /* 圆角边框 */
  transition: background-color 0.3s ease; /* 添加平滑过渡效果 */
}
.pickupIco:hover {
  background-color: rgb(210, 210, 210);
}

/*在方向输入框中添加s*/
.el-input-number[data-unit] {
  --el-input-number-unit-offset-x: calc(40px + 5px);
}

.el-input-number--small[data-unit] {
  --el-input-number-unit-offset-x: calc(32px + 14px);
}

.el-input-number[data-unit]::after {
  content: attr(data-unit);
  position: absolute;
  top: 0;
  right: var(--el-input-number-unit-offset-x);
  color: rgba(51, 63, 66, 0.7);
  height: 100%;
  display: flex;
  align-items: center;
}

.el-input-number[data-unit] .el-input__inner {
  padding-right: calc(1em + var(--el-input-number-unit-offset-x) + 4px);
}
</style>
