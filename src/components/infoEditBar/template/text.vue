<!--
  文本信息编辑框
-->
<template>
  <el-form class="text-form" label-position="left" label-width="60px">
    <el-form-item v-if="supports.prompt.indexOf('**') !== -1 || supports.prompt.indexOf(form.type) !== -1 || supports.prompt.indexOf(form.geoType) !== -1 "  label="提示文字：">
      <el-input placeholder="请输入提示文字" @blur="createInformationText" v-model="form.label"
                size="mini" style="width: 160px;margin-right: 20px"></el-input>
    </el-form-item>
    <el-form-item v-if="supports.family.indexOf('**') !== -1 || supports.family.indexOf(form.type) !== -1 || supports.family.indexOf(form.geoType) !== -1 "  label="文字字体：">
      <el-select v-model="form.material.text.family" size="mini" @change="changeTextFamily" placeholder="请选择字体" style="width: 160px;margin-right: 20px">
        <el-option v-for="(item, index) in Object.keys(fontStyle)" :key="index" :label="item" :value="fontStyle[item]"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item v-if="supports.size.indexOf('**') !== -1 || supports.size.indexOf(form.type) !== -1 || supports.size.indexOf(form.geoType) !== -1 "  label="文字大小：">
      <el-input-number size="mini" v-model="form.material.text.size" controls-position="right" @change="changeTextSize"
                       :min="1" :max="100" style="width: 160px;margin-right: 20px"></el-input-number>
    </el-form-item>
    <el-form-item v-if="supports.color.indexOf('**') !== -1 || supports.color.indexOf(form.type) !== -1 || supports.color.indexOf(form.geoType) !== -1 "  label="文字颜色：">
      <div class="material-form-textColor">
        <el-input v-model="form.material.text.color" @blur="textColorChange" size="mini"></el-input>
        <el-color-picker
            v-model="form.material.text.color"
            :predefine="['rgba(255,0,0,1)', 'rgba(0,255,0,1)','rgba(0,0,255,1)','rgba(255,255,0,1)']"
            @change="textColorChange"
            size="mini"
            show-alpha></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item v-if="supports.outline.indexOf('**') !== -1 || supports.outline.indexOf(form.type) !== -1 || supports.outline.indexOf(form.geoType) !== -1 "  label="轮廓颜色：">
      <div class="material-form-textColor">
        <el-input v-model="form.material.text.outline" @blur="textOutlineColorChange" size="mini"></el-input>
        <el-color-picker
            v-model="form.material.text.outline"
            :predefine="['rgba(0,0,0,1)', 'rgba(255,255,255,1)']"
            @change="textOutlineColorChange"
            size="mini"
            show-alpha></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item v-if="supports.fill.indexOf('**') !== -1 || supports.fill.indexOf(form.type) !== -1 || supports.fill.indexOf(form.geoType) !== -1 "  label="背景颜色：">
      <div class="material-form-textColor">
        <el-input v-model="form.material.fill.color" @blur="textBackgroundChange" size="mini"></el-input>
        <el-color-picker
            v-model="form.material.fill.color"
            :predefine="['rgba(255,0,0,0.6)', 'rgba(0,255,0,0.6)', 'rgba(0,0,255,0.6)']"
            @change="textBackgroundChange"
            size="mini"
            show-alpha></el-color-picker>
      </div>
    </el-form-item>
    <el-form-item v-if="supports.position.indexOf('**') !== -1 || supports.position.indexOf(form.type) !== -1 || supports.position.indexOf(form.geoType) !== -1 "  label="相对位置：">
      <div class="material-form-textColor">
        <el-select v-model="form.material.text.position" size="mini" @change="changeSelectPosition" placeholder="选择文字位置">
          <el-option label="上" value="top"></el-option>
          <el-option label="下" value="bottom"></el-option>
          <el-option label="左" value="left"></el-option>
          <el-option label="右" value="right"></el-option>
        </el-select>
      </div>
    </el-form-item>
    <el-form-item v-if="supports.italic.indexOf('**') !== -1 || supports.italic.indexOf(form.type) !== -1 || supports.italic.indexOf(form.geoType) !== -1 "  label="文字倾斜：">
      <el-checkbox size="mini" @change="textInclineChange" style="width: 160px" v-model="form.material.text.italic">
        是否倾斜
      </el-checkbox>
    </el-form-item>
    <el-form-item v-if="supports.show.indexOf('**') !== -1 || supports.show.indexOf(form.type) !== -1 || supports.show.indexOf(form.geoType) !== -1 "  label="背景透明：">
      <el-checkbox size="mini" @change="isShowBackgroundChange" style="width: 160px"
                   v-model="form.material.fill.show">是否透明
      </el-checkbox>
    </el-form-item>
  </el-form>
</template>

<script>
import store from "@/store";

export default {
  name: "textEdit",
  props: {
    entity: {
      type: Object,
      default: () => {
      }
    }
  },
  data() {
    return {
      supports: {
        prompt: ["image", "model", "TextBox", "place", "text"],
        family: ["image", "model", "TextBox", "place", "text"],
        size: ["image", "model", "TextBox", "place", "text"],
        color: ["image", "model", "TextBox", "place", "text"],
        outline: ["image", "model", "TextBox", "place", "text"],
        fill: ["TextBox", "text"],
        position: ["place"],
        italic: ["image", "model", "TextBox", "place", "text"],
        show: ["TextBox"]
      },
      form: {
        id: null,
        label: null,
        type:"",
        geoType: "",
        material: {
          fill: {},
          text:{}
        }
      },
      fontStyle: {
        "Arial": "arial",
        "Arial Black": "arial black",
        "微软雅黑": "Microsoft YaHei",
        "苹果苹方": "PingFang SC",
        "宋体": "simsun",
        "楷体": "楷体",
        "隶书": "隶书",
        "仿宋体": "FangSong",
        "黑体": "SimHei",
        "优设标题黑": "优设标题黑",
        "毛泽东字体": "毛泽东字体",
        "锐字锐线怒放": "锐字锐线怒放",
        "方正白舟武骨简": "方正白舟武骨简",
        "方正正大黑简体": "方正正大黑简体",
        "华康俪金黑": "华康俪金黑W8",
        "汇文正楷": "汇文正楷",
        "临海隶书": "临海隶书",
        "行书": "行书",
        "飞云体": "飞云体",
        "阿里方圆体": "阿里方圆体",
        "魏碑体": "魏碑体",
        "手写体": "手写体",
        "行楷": "行楷",
        "毛笔粗体": "毛笔粗体",
        "思源细黑体": "思源细黑体",
        "明朝体": "明朝体",
        "汉仪南宫体": "汉仪南宫体",
        "汉仪瘦金体": "汉仪瘦金体",

      }
    }
  },
  computed: {
    info() {
      return {
        id: this.entity.id,
        label: this.entity.label,
        type:this.entity.type,
        geoType: this.entity.geoType,
        material: this.entity.material
      }
    }
  },
  watch: {
    info: {
      handler() {
        this.init()
      },
      immediate: true
    }
  },
  methods: {
    /** 初始化 */
    init() {
      this.form.id = this.entity.id
      this.form.label = this.entity.label
      this.form.type = this.entity.type
      this.form.geoType = this.entity.geoType
      this.form.material = this.entity.material
      // this.form.material.fill.show = !this.entity.material?.fill?.show
    },
    /** 创建提示文字 */
    createInformationText() {
      this.$cesiumHelper.updateObjById(this.form.id, {label: this.form.label})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改文字字体 */
    changeTextFamily() {
      const options = {material: {text: {family: this.form.material.text.family}}}
      this.$cesiumHelper.updateObjById(this.form.id, options)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字大小 */
    changeTextSize() {
      const options = {material: {text: {size: this.form.material.text.size}}}
      this.$cesiumHelper.updateObjById(this.form.id, options)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字颜色 */
    textColorChange() {
      const option = {material: {text: {color: this.form.material.text.color}}}
      this.$cesiumHelper.updateObjById(this.form.id, option)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字轮廓颜色 */
    textOutlineColorChange() {
      const option = {material: {text: {outline: this.form.material.text.outline}}}
      this.$cesiumHelper.updateObjById(this.form.id, option)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字背景颜色 */
    textBackgroundChange() {
      const option = {material: {fill: {color: this.form.material.fill.color}}}
      this.$cesiumHelper.updateObjById(this.form.id, option)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字的相对位置 */
    changeSelectPosition(){
      const option = {material: {text: {position: this.form.material.text.position}}}
      this.$cesiumHelper.updateObjById(this.form.id, option)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字背景颜色是否显示 */
    isShowBackgroundChange() {
      const option = {material: {fill: {show: this.form.material.fill.show}}}
      this.$cesiumHelper.updateObjById(this.form.id, option)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改提示文字是否倾斜 */
    textInclineChange() {
      const option = {material: {text: {italic: this.form.material.text.italic}}}
      this.$cesiumHelper.updateObjById(this.form.id, option)
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
  }
}
</script>

<style lang="less" scoped>
.text-form {
  /deep/ .el-checkbox__label {
    font-size: 12px;
  }

  /deep/ .el-checkbox {
    margin-left: -100px;
  }

  /deep/ .el-form-item__label {
    font-size: 12px;
    padding: 0;
  }

  /deep/ .el-form-item {
    margin: 0;
  }

  .material-form-textColor {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;

    .el-input {
      width: 128px;
      //padding-left: 15px;
    }
    .el-select {
      width: 128px;
    }
    .el-color-picker {
      margin-top: 6px;
      margin-left: 3px;
    }
  }

  /deep/ .el-form-item {
    margin: 0;
  }

  /deep/ .el-form-item__label {
    font-size: 12px;
    padding: 0;
  }
}
</style>
