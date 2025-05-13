<template>
  <!-- 态势组件 -->
  <div class="situation-plotting-contain">
    <el-collapse accordion v-model="activeName">
      <el-collapse-item
        v-for="(item, index) in situationMenu"
        :key="index"
        :title="item.name"
        :name="index"
      >
        <div class="icon-plot-situation-item">
          <div v-for="(i_item, i_index) in item.value" :key="i_index">
            <img
              draggable="false"
              @click="draw(i_item.type)"
              :src="i_item.image"
            />
            <span>{{ i_item.name }}</span>
          </div>
        </div>
        <el-switch
          style="margin-left: 362px; margin-top: 20px; display: block"
          v-model="isSolid"
          active-color="#13ce66"
          inactive-color="#ff4949"
          active-text="虚线"
          inactive-text="实线"
        >
        </el-switch>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import store from "@/store";

export default {
  name: "situationPlotting",
  data() {
    return {
      activeName: 0,
      isSolid: false,
      /* 态势标绘菜单 */
      situationMenu: [],

      /* 作战标绘工具 */
      militaryPlotting: null,
    };
  },
  methods: {
    /** 获取标绘图标 */
    getIconList() {
      this.situationMenu = [
        {
          name: "作战标绘",
          value: [
            {
              name: "折线",
              image: require("../../../../assets/images/situationPlotImgs/折线.png"),
              type: "Polyline",
            },
            {
              name: "曲线",
              image: require("../../../../assets/images/situationPlotImgs/curve.png"),
              type: "Curve",
            },
            {
              name: "曲面",
              image: require("../../../../assets/images/situationPlotImgs/曲面多边形.png"),
              type: "CurvedPolygon",
            },
            {
              name: "多边形",
              image: require("../../../../assets/images/situationPlotImgs/多边形.png"),
              type: "Polygon",
            },
            {
              name: "简单直线箭头",
              image: require("../../../../assets/images/situationPlotImgs/直线箭头.png"),
              type: "StraightLineArrow",
            },
            {
              name: "简单曲线箭头",
              image: require("../../../../assets/images/situationPlotImgs/曲线箭头.png"),
              type: "CurveLineArrow",
            },
            {
              name: "直角箭头",
              image: require("../../../../assets/images/situationPlotImgs/平尾箭头.png"),
              type: "RightAngleArrow",
            },
            {
              name: "燕尾箭头",
              image: require("../../../../assets/images/situationPlotImgs/燕尾箭头.png"),
              type: "SwallowtailArrow",
            },
            {
              name: "钳击箭头",
              image: require("../../../../assets/images/situationPlotImgs/钳击箭头.png"),
              type: "PincerArrow",
            },
            {
              name: "进攻箭头",
              image: require("../../../../assets/images/situationPlotImgs/曲线进攻.png"),
              type: "AttackArrow",
            },
            {
              name: "圆角矩形",
              image: require("../../../../assets/images/situationPlotImgs/圆角矩形.png"),
              type: "RoundRectangle",
            },
            {
              name: "集结地",
              image: require("../../../../assets/images/situationPlotImgs/集结地.png"),
              type: "StagingArea",
            },
            {
              name: "防御阵形",
              image: require("../../../../assets/images/situationPlotImgs/防御.png"),
              type: "DefenseLine",
            },
            {
              name: "旗帜",
              image: require("../../../../assets/images/situationPlotImgs/旗帜.png"),
              type: "Flag",
            },
            {
              name: "文本框",
              image: require("../../../../assets/images/situationPlotImgs/文本框.png"),
              type: "TextBox",
            },
          ],
        },
      ];
    },
    /** 作战标绘 */
    draw(type) {
      console.log("当前绘制的箭头类型", type);
      switch (type) {
        case "Polyline":
          this.createPolyline();
          break;
        case "Curve":
          this.createCurve();
          break;
        case "Polygon":
          this.createPolygon();
          break;
        case "StraightLineArrow":
          this.createLineArrow();
          break;
        case "CurveLineArrow":
          this.createCurveArrow();
          break;
        case "SwallowtailArrow":
          this.createSwallowtailArrow();
          break;
        case "RightAngleArrow":
          this.createRightAngleArrow();
          break;
        case "RoundRectangle":
          this.createRoundRectangle();
          break;
        case "PincerArrow":
          this.createPincerArrow();
          break;
        case "AttackArrow":
          this.createAttackArrow();
          break;
        case "StagingArea":
          this.createStagingArea();
          break;
        case "Flag":
          this.createFlag();
          break;
        case "DefenseLine":
          this.createDefenseLine();
          break;
        case "CurvedPolygon":
          this.createCurvedPolygon();
          break;
        case "TextBox":
          this.createTextBox();
          break;
        // case "PerfectCircle":
        //   this.createPerfectCircle()
        //   break
      }
    },
    drawActivate(plotType) {
      this.$cesiumHelper.xt3d.getPlotType(plotType);
    },
    /** 创建旗帜 */
    createFlag() {
      const options = {
        borderColor: "rgba(255,0,0,8)",
        textColor: "rgba(255,255,0,1)",
        backgroundColor: "rgba(255,0,0,0.3)",
      };
      this.$cesiumHelper.plotting.situationPlotting.CreateFlag(options).then(
        (entity) => {
          const info = this.$cesiumHelper.getEntityInfo(entity);
          store.dispatch("addEntitySource", info);
        },
        (err) => {
          this.$message.info(err);
        }
      );
    },

    /** 创建多边形 */
    createPolygon() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting.CreatePolygon(options).then(
        (entity) => {
          const info = this.$cesiumHelper.getEntityInfo(entity);
          store.dispatch("addEntitySource", info);
        },
        (err) => {
          this.$message.info(err);
        }
      );
    },
    /**创建曲面多边形*/
    createCurvedPolygon() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateCurvedPolygon(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建圆滑曲线 */
    createCurve() {
      const options = {
        material: {
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting.CreateCurve(options).then(
        (entity) => {
          const info = this.$cesiumHelper.getEntityInfo(entity);
          store.dispatch("addEntitySource", info);
        },
        (err) => {
          this.$message.info(err);
        }
      );
    },

    /** 创建折线 */
    createPolyline() {
      const options = {
        material: {
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreatePolyline(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建集结地 */
    createStagingArea() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateAssemble(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建进攻箭头 */
    createAttackArrow() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateAttackArrow(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建钳击箭头 */
    createPincerArrow() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreatePincerArrow(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建圆角矩形 */
    createRoundRectangle() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateRoundRectangle(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建直角箭头 */
    createRightAngleArrow() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateRightAngleArrow(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建燕尾箭头 */
    createSwallowtailArrow() {
      const options = {
        material: {
          fill: {
            color: "rgba(255, 0, 0, 0.3)",
          },
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateSwallowtailArrow(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建简单箭头-直线 */
    createLineArrow() {
      const options = {
        material: {
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateLineArrow(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建简单箭头-曲线 */
    createCurveArrow() {
      const options = {
        material: {
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            width: this.isSolid ? 3 : 2,
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateCurveArrow(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建防御 */
    createDefenseLine() {
      const options = {
        material: {
          border: {
            color: "rgba(255,0,0,0.8)",
          },
          line: {
            style: this.isSolid ? "dashed" : "solid",
            width: this.isSolid ? 3 : 2,
            color: this.isSolid ? "rgba(255, 255,0,1)" : "rgba(255,0,0,0.8)",
          },
        },
      };
      this.$cesiumHelper.plotting.situationPlotting
        .CreateDefenseLine(options)
        .then(
          (entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
          },
          (err) => {
            this.$message.info(err);
          }
        );
    },

    /** 创建文本框 */
    createTextBox() {
      this.$cesiumHelper.plotting.situationPlotting.CreateTextBox({}).then(
        (res) => {
          const info = this.$cesiumHelper.getEntityInfo(res);
          store.dispatch("addEntitySource", info);
        },
        (err) => {
          this.$message.info(err);
        }
      );
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.getIconList();
    });
  },
};
</script>

<style scoped>
.situation-plotting-contain {
  width: 500px;
}

.icon-plot-situation-item {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
}

.icon-plot-situation-item > div {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  width: 55px;
  padding: 2px;
}

.icon-plot-situation-item > div:hover {
  background-color: #ebebeb;
}

.icon-plot-situation-item > div > img {
  width: 25px;
  cursor: pointer;
}

.icon-plot-situation-item > div > span {
  text-align: center;
  font-size: 12px;
  line-height: 1;
}

/deep/ .el-collapse-item__content {
  padding: 10px;
}

.situation-plotting-contain /deep/ .el-collapse-item__header {
  font-size: 12px;
}
</style>
