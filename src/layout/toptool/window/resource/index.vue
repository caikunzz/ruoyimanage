<template>
  <!-- 基础资源组件 -->
  <floating-bar
    ref="basicResourceFloatingRef"
    v-model="visible"
    title="基础资源"
    :width="200"
    :height="floatHeight"
    :top="floatHeight + 100"
    :left="0"
    :draggable="true"
  >
    <template slot="default">
      <el-tabs type="border-card" class="source-body" v-model="activeName">
        <el-tab-pane label="地名" name="place">
          <div class="top-search-bar">
            <el-autocomplete
              v-model="searchName"
              popper-class="source-autocomplete-popper"
              :fetch-suggestions="
                (queryString, cb) => {
                  querySearchAsync(queryString, cb, 'place');
                }
              "
              suffix-icon="el-icon-search"
              placeholder="请输入内容"
              :trigger-on-focus="false"
              size="mini"
              @select="handleSelect"
            ></el-autocomplete>
          </div>
          <div class="tree-bar">
            <el-tree
              :data="placeList"
              show-checkbox
              node-key="id"
              check-strictly
              props="{label: 'label',children: 'children'}"
              :default-checked-keys="
                placeList.filter((p) => p.show).map((item) => item.id)
              "
              @check="handleCheckClick"
              :indent="8"
            >
              <span class="custom-tree-node" slot-scope="{ node }">
                {{ node.label }}
              </span>
            </el-tree>
          </div>
        </el-tab-pane>
        <el-tab-pane label="河流" name="river">
          <div class="top-search-bar">
            <el-autocomplete
              v-model="searchName"
              popper-class="source-autocomplete-popper"
              :fetch-suggestions="
                (queryString, cb) => {
                  querySearchAsync(queryString, cb, 'river');
                }
              "
              suffix-icon="el-icon-search"
              placeholder="请输入内容"
              :trigger-on-focus="false"
              size="mini"
              @select="handleSelect"
            ></el-autocomplete>
          </div>
          <div class="tree-bar">
            <el-tree
              :data="riverList"
              show-checkbox
              node-key="id"
              check-strictly
              :props="{ label: 'name', children: 'children' }"
              :default-checked-keys="
                riverList.filter((p) => p.show).map((item) => item.id)
              "
              @check="handleCheckClick"
              :indent="8"
            >
              <span class="custom-tree-node" slot-scope="{ node }">
                {{ node.label }}
              </span>
            </el-tree>
          </div>
        </el-tab-pane>
        <el-tab-pane label="道路" name="road">
          <div class="top-search-bar">
            <el-autocomplete
              v-model="searchName"
              popper-class="source-autocomplete-popper"
              :fetch-suggestions="
                (queryString, cb) => {
                  querySearchAsync(queryString, cb, 'road');
                }
              "
              suffix-icon="el-icon-search"
              placeholder="请输入内容"
              :trigger-on-focus="false"
              size="mini"
              @select="handleSelect"
            ></el-autocomplete>
          </div>
          <div class="tree-bar">
            <el-tree
              :data="roadList"
              show-checkbox
              node-key="id"
              check-strictly
              :props="{ label: 'name', children: 'children' }"
              :default-checked-keys="
                roadList.filter((p) => p.show).map((item) => item.id)
              "
              @check="handleCheckClick"
              :indent="8"
            >
              <span class="custom-tree-node" slot-scope="{ node }">
                {{ node.label }}
              </span>
            </el-tree>
          </div>
        </el-tab-pane>
        <el-tab-pane label="边界" name="boundary">
          <div class="top-search-bar">
            <el-autocomplete
              v-model="searchName"
              popper-class="source-autocomplete-popper"
              :fetch-suggestions="
                (queryString, cb) => {
                  querySearchAsync(queryString, cb, 'boundary');
                }
              "
              suffix-icon="el-icon-search"
              placeholder="请输入内容"
              :trigger-on-focus="false"
              size="mini"
              @select="handleSelect"
            ></el-autocomplete>
          </div>
          <div class="tree-bar">
            <el-tree
              :data="boundaryList"
              show-checkbox
              node-key="id"
              check-strictly
              :default-checked-keys="
                boundaryList.filter((p) => p.show).map((item) => item.id)
              "
              :props="{ label: 'name', children: 'children' }"
              @check="handleCheckClick"
              :indent="8"
            >
              <span class="custom-tree-node" slot-scope="{ node }">
                {{ node.label }}
              </span>
            </el-tree>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>
  </floating-bar>
</template>

<script>
import floatingBar from "@/components/floatingBar/index.vue";
import store from "@/store";
import * as resourceApi from "@/api/cesium/gisInfo.js";

export default {
  name: "basicSource",
  components: { floatingBar },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      /* 搜索名称 */
      searchName: "",
      /* 当前激活标签页 */
      activeName: "place",

      /* 地名默认配置 */
      placeStyles: {
        1: {
          size: 10,
          outline: 2,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
        2: {
          size: 8,
          outline: 2,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
        3: {
          size: 6,
          outline: 2,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
        4: {
          size: 6,
          outline: 1,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
        5: {
          size: 4,
          outline: 1,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
        6: {
          size: 3,
          outline: 0,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
        7: {
          size: 2,
          outline: 0,
          color: "rgba(66,66,148,1)",
          outlineColor: "rgba(255,255,255,1)",
        },
      },

      /* 是否展示窗格 */
      visible: false,
    };
  },
  computed: {
    /** 地名资源 */
    placeList() {
      return store.getters.entities.filter((p) => p.type === "place");
    },
    /** 河流资源 */
    riverList() {
      return store.getters.entities.filter((p) => p.type === "river");
    },
    /** 道路资源 */
    roadList() {
      return store.getters.entities.filter((p) => p.type === "road");
    },
    /** 边界资源 */
    boundaryList() {
      return store.getters.entities.filter((p) => p.type === "boundary");
    },
    floatHeight() {
      return (window.innerHeight - 100) / 2;
    },
  },
  watch: {
    visible(val) {
      this.$emit("input", val);
    },
    value(val) {
      this.visible = val;
    },
  },
  methods: {
    handleSelect(val) {
      switch (val.type) {
        case "place":
          this.addPlace(val.id);
          break;
        case "river":
          this.addRiver(val.id);
          break;
        case "road":
          this.addRoad(val.id);
          break;
        case "boundary":
          this.addBoundary(val.id);
          break;
      }
      this.searchName = "";
    },
    async querySearchAsync(queryString, cb, type) {
      let searchValue = [];
      switch (type) {
        case "place":
          searchValue = await resourceApi.queryCityLike(queryString);
          break;
        case "river":
          searchValue = await resourceApi.queryRiverLike(queryString);
          break;
        case "road":
          searchValue = await resourceApi.queryRoadLike(queryString);
          break;
        case "boundary":
          searchValue = await resourceApi.queryBoundaryLike(queryString);
          break;
      }
      cb(searchValue.data);
    },
    buildTree(list, id, parentId) {
      id = id || "id";
      parentId = parentId || "groupId";
      return this.handleTree(list, id, parentId);
    },
    handleCheckClick(data) {
      const options = { show: !data.show };
      this.$cesiumHelper.updateObjById(data.id, options);
      const info = this.$cesiumHelper.getEntityInfo(data.id);
      store.dispatch("updateEntitySource", info);
    },

    /** 添加地名 */
    async addPlace(id) {
      resourceApi.queryCityById(id).then((res) => {
        const options = {
          data: { id: id },
          name: res.data.name,
          label: res.data.name,
          position: [res.data.lng, res.data.lat],
          material: {
            fill: {
              size: this.placeStyles[res.data.leave].size,
              color: this.placeStyles[res.data.leave].color,
            },
            border: {
              size: this.placeStyles[res.data.leave].outline,
              color: this.placeStyles[res.data.leave].outlineColor,
            },
            text: {
              color: "rgba(255,255,255,1)",
              outline: "rgba(0,0,0,1)",
              size: 15,
              family: "sans-serif",
              weight: "normal",
              italic: false,
              show: true,
            },
          },
        };
        this.$cesiumHelper.plotting.placePlotting
          .showPlottingForData(options)
          .then(
            (entity) => {
              const info = this.$cesiumHelper.getEntityInfo(entity);
              store.dispatch("addEntitySource", info);
            },
            (err) => this.$message.warning(err)
          );
      });
    },

    /** 添加河流 */
    async addRiver(id) {
      let res = await resourceApi.queryRiverById(id);
      const river = res.data;
      const options = {
        data: { id: id },
        name: river.name,
        position: {
          polygon: river.polygon,
          polyline: river.polyline,
        },
        material: {
          fill: { color: "rgba(16,57,255,0.5)" },
        },
      };
      this.$cesiumHelper.plotting.riverPlotting
        .showPlottingForData(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => this.$message.warning(err)
        );
    },

    /** 添加道路 */
    async addRoad(id) {
      let res = await resourceApi.queryRoadById(id);
      res = res.data;
      const options = {
        data: { id: id },
        name: res.name,
        position: res.polyline,
        material: {
          fill: { color: "rgba(149,243,9,0.5)" },
        },
      };
      this.$cesiumHelper.plotting.roadPlotting
        .showPlottingForData(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.warning(err);
          }
        );
    },

    /** 添加边界 */
    async addBoundary(id) {
      let res = await resourceApi.queryBoundaryById(id);
      res = res.data;
      const options = {
        data: { id: id },
        name: res.name,
        position: res.polyline,
        material: {
          fill: { color: "rgba(255,0,0,0.3)" },
          // border: {color: "rgba(130,175,89,0.8)"}
          border: { color: "rgba(0,255,255,0.8)" },
        },
      };
      this.$cesiumHelper.plotting.boundaryPlotting
        .showPlottingForData(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.warning(err);
          }
        );
    },
  },
};
</script>

<style lang="less" scoped>
.source-body {
  height: 100%;

  /deep/ .el-tabs__nav-scroll {
    background-color: transparent !important;
  }

  /deep/ .el-tabs__header {
    margin: 0;
  }

  /deep/ .el-tabs__item {
    padding: 0 !important;
    text-align: center;
    font-size: 12px;
    width: 50px;
    height: 24px !important;
    line-height: 24px !important;
    color: #d5d5d5 !important;

    &:not(.is-active):hover {
      color: #bebebe !important;
      background-color: transparent !important;
    }
  }

  /deep/ .is-active {
    color: #000000 !important;
  }

  /deep/ .el-tabs__content {
    padding: 5px !important;
    height: calc(100% - 32px);
    .el-tab-pane {
      height: 100%;
    }
  }

  .top-search-bar {
    height: 30px;
  }

  .tree-bar {
    height: calc(100% - 30px);
    overflow: auto;

    .custom-tree-node {
      flex: 1;
      align-items: center;
      font-size: 12px;
    }

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      background-color: #d5d5d5;
    }
  }
}
</style>

<style>
.source-autocomplete-popper {
  width: unset !important;
  min-width: 190px;
}
</style>
