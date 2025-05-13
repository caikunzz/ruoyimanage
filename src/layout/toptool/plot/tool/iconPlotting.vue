<template>
  <!-- 二维图形标绘 -->
  <div class="icon-plotting-contain">
    <el-tabs v-model="activeName" type="border-card">
      <el-tab-pane label="象形图形" name="first">
        <el-collapse accordion>
          <el-collapse-item
            v-for="(item, index) in pictographic"
            :key="index"
            :title="item.name"
          >
            <div class="icon-plot-pictographic-item">
              <img
                v-for="(i_item, i_index) in item.value"
                :key="i_index"
                :src="i_item"
                @dragend="dragend"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="军队图形" name="second">
        <el-collapse accordion>
          <el-collapse-item
            v-for="(item, index) in militaryGraphic"
            :key="index"
            :title="item.name"
          >
            <div class="icon-plot-military_graphic-item">
              <div v-for="(i_item, i_index) in item.value" :key="i_index">
                <img :src="i_item.url" @dragend="dragend" />
                <span>{{ i_item.name }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="其它图形" name="third">
        <el-collapse accordion>
          <el-collapse-item
            v-for="(item, index) in otherGraphic"
            :key="index"
            :title="item.name"
          >
            <div class="icon-plot-otherGraphic-item">
              <img
                v-for="(i_item, i_index) in item.value"
                :key="i_index"
                :src="i_item"
                @dragend="dragend"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="自定义图形" name="four">
        <el-collapse accordion>
          <el-collapse-item title="导入文件" v-loading="customGraphicLoading">
            <div class="input-wrapper">
              <el-input
                placeholder="请输入文件名"
                size="mini"
                v-model="queryParams.fileName"
              />
              <el-button
                size="mini"
                type="primary"
                @click="getCustomImgList(1)"
                icon="el-icon-search"
                >搜索</el-button
              >
              <el-upload
                size="mini"
                class="upload-demo"
                accept=".jpg,.png,.webp,.tiff,.svg,.bmp"
                :action="uploadFileUrl"
                :headers="headers"
                :on-success="handleUploadSuccess"
              >
                <el-button size="mini" type="success" icon="el-icon-upload2"
                  >上传</el-button
                >
              </el-upload>
            </div>
            <div class="icon-plot-customGraphic-item">
              <div v-for="(i_item, i_index) in customGraphic" :key="i_index">
                <img draggable="true" :src="i_item.url" @dragend="dragend" />
                <span>{{ i_item.name }}</span>
              </div>
            </div>
            <div class="pagination-wrapper">
              <el-pagination
                small
                layout="prev, pager, next"
                :total="total"
                @current-change="getCustomImgList"
              >
              </el-pagination>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import store from "@/store";
import * as fileNodeApi from "@/api/file/node";
export default {
  name: "iconPlotting",
  data() {
    return {
      activeName: "first",

      activeCollapse: "",

      uploadFileUrl: process.env.VUE_APP_BASE_API + "/file/upload", // 上传文件服务器地址
      headers: {
        Authorization: "Bearer " + this.getToken(),
      },

      /* 象形图形 菜单 */
      pictographic: [],

      /* 军队图形 菜单 */
      militaryGraphic: [],

      /* 其它图形 菜单 */
      otherGraphic: [],

      /* 自定义图形 菜单 */
      customGraphic: [],

      customGraphicLoading: false,

      /* 自定义图形列表分页 */
      total: 0,

      /* 自定义图形过滤条件 */
      queryParams: {
        classifyId: 1,
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
    /** 获取图标列表 */
    getIconList() {
      const data = {
        pictographic: [
          {
            name: "飞机",
            value: [
              require("@/assets/images/iconPlotImgs/red/110450011_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/110440011_ffff0000.png"),
            ],
          },
          {
            name: "坦克",
            value: [
              require("@/assets/images/iconPlotImgs/red/110210001_ffff0000.png"),
            ],
          },
          {
            name: "舰船",
            value: [
              require("@/assets/images/iconPlotImgs/red/110330001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/33.png"),
              require("@/assets/images/iconPlotImgs/red/44.png"),
              require("@/assets/images/iconPlotImgs/red/55.png"),
              require("@/assets/images/iconPlotImgs/red/11.png"),
            ],
          },
          {
            name: "车辆",
            value: [
              require("@/assets/images/iconPlotImgs/red/110290001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/油罐车.png"),
            ],
          },
          {
            name: "武器装备",
            value: [
              require("@/assets/images/iconPlotImgs/red/110220001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/110250001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/110260001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/110270001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/110550001_ffff0000.png"),
              require("@/assets/images/iconPlotImgs/red/110750001_ffff0000.png"),
            ],
          },
          {
            name: "军事设施",
            value: [
              require("@/assets/images/iconPlotImgs/red/110530011_ffff0000.png"),
            ],
          },
        ],
        militaryGraphic: [
          {
            name: "我军",
            value: [
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/navy.png"),
                name: "海军",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/air_force.png"),
                name: "空军",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/Rocket_Army.png"),
                name: "火箭军",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/artillery.png"),
                name: "炮兵部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/armor.png"),
                name: "装甲部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/anti-aircraft_fighter.png"),
                name: "防空部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/engineering.png"),
                name: "工程部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/chemistry.png"),
                name: "防化学部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/communication.png"),
                name: "通信部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/cavalry.png"),
                name: "骑兵部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/militia.png"),
                name: "民兵部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/ourMilitary/airborne.png"),
                name: "空降兵部队",
              },
            ],
          },
          {
            name: "北约",
            value: [
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/步兵.png"),
                name: "步兵",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/空军.png"),
                name: "空军",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/海军.png"),
                name: "海军",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/装甲部队.png"),
                name: "装甲部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/榴弹炮部队.png"),
                name: "火箭军",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/陆基防空.png"),
                name: "陆基防空",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/保养部队.png"),
                name: "保养部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/军事情报部队.png"),
                name: "军事情报",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/军需部队.png"),
                name: "军需部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/化学兵部队.png"),
                name: "化学部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/医疗部队.png"),
                name: "医疗部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/宪兵部队.png"),
                name: "宪兵部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/工程兵部队.png"),
                name: "工程部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/心理战部队.png"),
                name: "心理部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/特种部队.png"),
                name: "特种部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/运输部队.png"),
                name: "运输部队",
              },
              {
                url: require("@/assets/images/iconPlotImgs/usMilitary/通信部队.png"),
                name: "通信部队",
              },
            ],
          },
        ],
        otherGraphic: [
          {
            name: "坐标点",
            value: [
              require("@/assets/images/iconPlotImgs/other/coordinatePoints/route-start.png"),
              require("@/assets/images/iconPlotImgs/other/coordinatePoints/route-end.png"),
              require("@/assets/images/iconPlotImgs/other/coordinatePoints/place.png"),
            ],
          },
          {
            name: "建筑",
            value: [
              require("@/assets/images/iconPlotImgs/other/build/mark-red.png"),
            ],
          },
          {
            name: "车辆",
            value: [
              require("@/assets/images/iconPlotImgs/other/vehicle/bus.png"),
              require("@/assets/images/iconPlotImgs/other/vehicle/car.png"),
            ],
          },
          {
            name: "人员",
            value: [
              require("@/assets/images/iconPlotImgs/other/personnel/people.png"),
            ],
          },
        ],
      };
      this.pictographic = data.pictographic;
      this.militaryGraphic = data.militaryGraphic;
      this.otherGraphic = data.otherGraphic;
      this.getCustomImgList(1);
    },
    /** 获取用户上传图片列表 */
    getCustomImgList(val) {
      this.customGraphicLoading = true;
      this.queryParams.pageNum = val;
      fileNodeApi
        .list(this.queryParams)
        .then((res) => {
          this.total = res.total;
          this.customGraphic = res.rows.map((item) => {
            return { id: item.id, name: item.fileName, url: item.fileUrl };
          });
          this.customGraphicLoading = false;
        })
        .catch(() => {
          this.customGraphicLoading = false;
        });
    },
    /** 上传成功回调 */
    handleUploadSuccess(res, file) {
      this.queryParams.fileName = file.name;
      this.getCustomImgList(1);
    },

    /** 图标拖拽事件 */
    async dragend(event) {
      event.preventDefault();
      event.stopPropagation();
      // 获取鼠标所在坐标对应的经纬度
      const position =
        await this.$cesiumHelper.windowLocationToLatitudeAndLongitude(event);
      const img_path = event.target.src.replace(window.location.href, "/");
      this.$cesiumHelper.plotting.imagePlotting
        .createImagePlot({ url: img_path, position: position })
        .then((entity) => {
          const info = this.$cesiumHelper.getEntityInfo(entity);
          store.dispatch("addEntitySource", info);
        });
    },
  },
  mounted() {
    this.getIconList();
  },
};
</script>

<style lang="less" scoped>
.icon-plotting-contain {
  width: 400px;

  .icon-plot-pictographic-item {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
  }

  .icon-plot-pictographic-item > img {
    width: 30px;
    padding: 5px;
    cursor: pointer;
  }

  .icon-plot-pictographic-item > img:hover {
    background-color: #ebebeb;
  }

  .icon-plot-military_graphic-item {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
  }

  .icon-plot-military_graphic-item > div {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: center;
  }

  .icon-plot-military_graphic-item > div:hover {
    background-color: #ebebeb;
  }

  .icon-plot-military_graphic-item > div > img {
    width: 50px;
    padding: 5px;
    cursor: pointer;
  }

  .icon-plot-military_graphic-item > div > span {
    font-size: 12px;
  }

  /* 其它图形 */
  .icon-plot-otherGraphic-item > img {
    width: 25px;
    padding: 5px;
    cursor: pointer;
  }

  .icon-plot-customGraphic-item {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    user-select: none;
    margin-top: 20px;
  }

  .icon-plot-customGraphic-item > div {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    width: 60px;

    padding: 0 5px;
    text-align: left;

    box-sizing: border-box;

    position: relative;
  }

  .icon-plot-customGraphic-item > div:hover {
    background-color: #ebebeb;
  }

  .icon-plot-customGraphic-item > div > img {
    width: 40px;
    height: 40px;
    cursor: pointer;
    margin: auto;
  }

  .icon-plot-customGraphic-item > div > span {
    font-size: 12px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: start;
    cursor: pointer;
  }

  /* 自定义图形 */
  .input-wrapper {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;

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
}

/deep/.upload-demo {
  .el-upload-list {
    display: none;
  }
}

.img-upload {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  width: 60px;
  height: 40px;

  cursor: pointer;

  i {
    font-size: 24px;
    text-align: center;
  }

  span {
    font-size: 12px;
  }
}

/deep/ .el-collapse-item__content {
  padding: 10px;
}

.icon-plotting-contain /deep/ .el-tabs__item {
  font-size: 12px;
}

.icon-plotting-contain /deep/ .el-collapse-item__header {
  font-size: 12px;
}
</style>
