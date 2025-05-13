<template>
  <el-form
    class="material-form"
    label-position="right"
    label-width="80px"
    :model="form"
  >
    <el-form-item
      v-if="
        supports.textColor.indexOf('**') !== -1 ||
        supports.textColor.indexOf(form.type) !== -1 ||
        supports.textColor.indexOf(form.geoType) !== -1
      "
      label="字体颜色："
    >
      <div class="material-form-color">
        <el-input
          style="padding-left: 0"
          v-model="form.material.text.color"
          @blur="colorTextChange"
          size="mini"
        ></el-input>
        <el-color-picker
          v-model="form.material.text.color"
          :predefine="colorOptions"
          @change="colorTextChange"
          size="mini"
          show-alpha
        ></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item
      v-if="
        supports.fillColor.indexOf('**') !== -1 ||
        supports.fillColor.indexOf(form.type) !== -1 ||
        supports.fillColor.indexOf(form.geoType) !== -1
      "
      label="填充颜色："
    >
      <div class="material-form-color">
        <el-input
          style="padding-left: 0"
          v-model="form.material.fill.color"
          @blur="colorChange"
          size="mini"
        ></el-input>
        <el-color-picker
          v-model="form.material.fill.color"
          :predefine="colorOptions"
          @change="colorChange"
          size="mini"
          show-alpha
        ></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item
      v-if="
        supports.borderColor.indexOf('**') !== -1 ||
        supports.borderColor.indexOf(form.type) !== -1 ||
        supports.borderColor.indexOf(form.geoType) !== -1
      "
      label="边框颜色："
    >
      <div class="material-form-color">
        <el-input
          style="padding-left: 0"
          v-model="form.material.border.color"
          @blur="outlineColorChange"
          size="mini"
        ></el-input>
        <el-color-picker
          v-model="form.material.border.color"
          :predefine="colorOptions"
          @change="outlineColorChange"
          size="mini"
          show-alpha
        ></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item
      label="边框宽度："
      v-if="
        supports.borderWidth.indexOf('**') !== -1 ||
        supports.borderWidth.indexOf(form.type) !== -1 ||
        supports.borderWidth.indexOf(form.geoType) !== -1
      "
    >
      <el-input-number
        size="mini"
        v-model="form.material.border.width"
        controls-position="right"
        @change="changeLineWidth"
        :min="1"
        :max="100"
      ></el-input-number>
    </el-form-item>
    <el-form-item
      v-if="
        supports.lineColor.indexOf('**') !== -1 ||
        supports.lineColor.indexOf(form.type) !== -1 ||
        supports.lineColor.indexOf(form.geoType) !== -1
      "
      label="线段颜色："
    >
      <div class="material-form-color">
        <el-input
          style="padding-left: 0"
          v-model="form.material.line.color"
          @blur="colorChange"
          size="mini"
        ></el-input>
        <el-color-picker
          v-model="form.material.line.color"
          :predefine="colorOptions"
          @change="colorChange"
          size="mini"
          show-alpha
        ></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item
      label="线段宽度："
      v-if="
        supports.lineWidth.indexOf('**') !== -1 ||
        supports.lineWidth.indexOf(form.type) !== -1 ||
        supports.lineWidth.indexOf(form.geoType) !== -1
      "
    >
      <el-input-number
        size="mini"
        v-model="form.material.line.width"
        controls-position="right"
        @change="changeLineWidth"
        :min="1"
        :max="100"
      ></el-input-number>
    </el-form-item>
    <el-form-item
      v-if="
        supports.showFill.indexOf('**') !== -1 ||
        supports.showFill.indexOf(form.type) !== -1 ||
        supports.showFill.indexOf(form.geoType) !== -1
      "
      label="颜色填充："
    >
      <el-checkbox
        size="mini"
        @change="isShowFillChange"
        style="width: 160px; padding: 0 20px 0 5px; text-align: left"
        v-model="form.material.fill.show"
      >
        是否填充
      </el-checkbox>
    </el-form-item>
    <el-form-item
      v-if="
        supports.lineStyle.indexOf('**') !== -1 ||
        supports.lineStyle.indexOf(form.type) !== -1 ||
        supports.lineStyle.indexOf(form.geoType) !== -1
      "
      label="线性样式："
    >
      <el-radio-group
        size="mini"
        v-if="form.material.border"
        v-model="form.material.border.style"
        @input="changeLineType"
      >
        <el-radio label="solid">实线</el-radio>
        <el-radio label="dashed">虚线</el-radio>
      </el-radio-group>
      <el-radio-group
        size="mini"
        v-if="form.material.line"
        v-model="form.material.line.style"
        @input="changeLineType"
      >
        <el-radio label="solid">实线</el-radio>
        <el-radio label="dashed">虚线</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="
        supports.fade.indexOf('**') !== -1 ||
        supports.fade.indexOf(form.type) !== -1 ||
        supports.fade.indexOf(form.geoType) !== -1
      "
      label="尾部淡化："
    >
      <el-checkbox
        size="mini"
        @change="handleFade"
        style="width: 160px; padding: 0 20px 0 5px; text-align: left"
        v-model="form.material.fill.fade"
      >
        是否淡化
      </el-checkbox>
    </el-form-item>
  </el-form>
</template>

<script>
import store from "@/store";
import { hexToRgba } from "@/utils/color";

export default {
  name: "material",
  props: {
    entity: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      // 支持编辑字段
      supports: {
        // 文字颜色
        textColor: ["Flag"],
        // 填充颜色
        fillColor: [
          "river",
          "AttackArrow",
          "SwallowtailArrow",
          "PincerArrow",
          "AssemblePolygon",
          "Polygon",
          "CurvedPolygon",
          "RightAngleArrow",
          "RoundRectangle",
          "Flag",
        ],
        // 边框颜色
        borderColor: [
          "AttackArrow",
          "SwallowtailArrow",
          "PincerArrow",
          "AssemblePolygon",
          "Polygon",
          "CurvedPolygon",
          "RightAngleArrow",
          "RoundRectangle",
          "Flag",
        ],
        // 边框宽度
        borderWidth: [
          "AttackArrow",
          "SwallowtailArrow",
          "PincerArrow",
          "AssemblePolygon",
          "Polygon",
          "CurvedPolygon",
          "RightAngleArrow",
          "RoundRectangle",
        ],
        // 线段颜色
        lineColor: [
          "LineArrow",
          "CurveArrow",
          "DefenseLine",
          "Polyline",
          "Curve",
        ],
        // 线段宽度
        lineWidth: [
          "LineArrow",
          "river",
          "CurveArrow",
          "DefenseLine",
          "Polyline",
          "Curve",
        ],
        // 是否填充
        showFill: [
          "AttackArrow",
          "SwallowtailArrow",
          "PincerArrow",
          "AssemblePolygon",
          "Polygon",
          "CurvedPolygon",
          "RightAngleArrow",
          "RoundRectangle",
          "Flag",
        ],
        // 是否虚线
        lineStyle: [
          "LineArrow",
          "CurveArrow",
          "DefenseLine",
          "Polyline",
          "Curve",
          "AttackArrow",
          "SwallowtailArrow",
          "PincerArrow",
          "AssemblePolygon",
          "Polygon",
          "CurvedPolygon",
          "RightAngleArrow",
          "RoundRectangle",
        ],
        // 是否淡化
        fade: ["AttackArrow"],
      },

      // 颜色预设
      colorOptions: [
        "rgba(255, 0, 0, .3)",
        "rgba(0, 0, 255, .2)",
        "rgba(255, 255, 0, .8)",
        "rgba(255, 255, 255, .4)",
        "rgba(0, 0, 0, 0)",
      ],

      // 表单
      form: {
        type: null,
        geoType: null,
        material: {
          fill: {
            show: false,
          },
          border: {
            style: "solid",
          },
          line: {
            style: "solid",
          },
          text: {},
        },
      },
    };
  },
  computed: {
    info() {
      return {
        id: this.entity.id,
        type: this.entity.type,
        geoType: this.entity.geoType,
        material: this.entity.material,
      };
    },
  },
  watch: {
    info: {
      handler() {
        this.init();
      },
      immediate: true,
    },
  },
  methods: {
    /** 初始化 */
    init() {
      this.form.id = this.entity.id;
      this.form.type = this.entity.type;
      this.form.geoType = this.entity.geoType;
      this.form.material = this.entity.material;
    },
    /** 颜色修改 */
    colorChange() {
      const options = this.form.material?.fill
        ? { material: { fill: { color: this.form.material.fill.color } } }
        : { material: { line: { color: this.form.material.line.color } } };
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
    colorTextChange() {
      const options = {
        material: { text: { color: this.form.material.text.color } },
      };
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
    /** 边框颜色修改 */
    outlineColorChange() {
      const options = {
        material: { border: { color: this.form.material.border.color } },
      };
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
    /** 边框或线段宽度修改 */
    changeLineWidth() {
      const options = this.form.material.border
        ? { material: { border: { width: this.form.material.border.width } } }
        : { material: { line: { width: this.form.material.line.width } } };
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
    /** 是否填充 */
    isShowFillChange() {
      const options = {
        material: { fill: { show: this.form.material.fill.show } },
      };
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const entity = this.$cesiumHelper.getEntityById(this.form.id);
      const info = this.$cesiumHelper.getEntityInfo(entity);
      store.dispatch("updateEntitySource", info);
    },
    /** 更改线性样式 实线、虚线、发光线 */
    changeLineType(val) {
      const options = {};
      if (this.form.material.border) {
        options["material"] = { border: { style: val } };
      } else if (this.form.material.line) {
        options["material"] = { line: { style: val } };
      }
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
    /** 透明度修改 */
    opacityChange() {
      const color = hexToRgba(
        this.form.material.data,
        this.form.material.opacity / 100
      );
      this.$cesiumHelper.updateObjById(this.form.id, { color: color });
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
    /** 尾部淡化效果 */
    handleFade() {
      const options = {};
      if (this.form.material.fill.fade) {
        options["material"] = { fill: { fade: true } };
      } else {
        options["material"] = { fill: { fade: false } };
      }
      this.$cesiumHelper.updateObjById(this.form.id, options);
      const info = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", info);
    },
  },
};
</script>

<style lang="less" scoped>
.material-form {
  padding: 0 20px 0 10px;

  .el-checkbox {
    margin-right: 25px;
  }

  /deep/.el-checkbox__label {
    font-size: 12px;
  }

  /deep/.el-form-item {
    margin-bottom: 0;

    .el-form-item__label {
      font-size: 12px;
    }
  }

  .el-radio-group {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;

    margin-top: 12px;

    .el-radio {
      margin-right: 10px;

      /deep/.el-radio__label {
        padding-left: 5px;
        font-size: 12px;
      }
    }
  }

  .material-form-color {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;

    .el-input {
      width: 98px;
      padding-left: 15px;
    }

    .el-color-picker {
      margin-top: 6px;
      margin-left: 5px;
    }
  }
}
</style>
