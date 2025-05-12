<!--
  基础信息栏组件
-->
<template>
  <el-form class="info-form" label-position="left" label-width="40px" :model="form">
    <el-form-item label="类型："  v-if="supports.type.indexOf('**') !== -1 || supports.type.indexOf(form.type) !== -1 || supports.type.indexOf(form.geoType) !== -1 ">
      <el-select disabled v-model="form.type" size="mini" placeholder="请选择实体类型">
        <el-option v-for="item in typeOptions" :key="item.value" :label="item.label"
                   :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="名称："  v-if="supports.name.indexOf('**') !== -1 || supports.name.indexOf(form.type) !== -1 || supports.name.indexOf(form.geoType) !== -1 ">
      <el-input v-model="form.name" @blur="nameChange" size="mini" placeholder="请输入实体名称"></el-input>
    </el-form-item>
    <el-form-item  v-if="supports.came.indexOf('**') !== -1 || supports.came.indexOf(form.type) !== -1 || supports.came.indexOf(form.geoType) !== -1 " label="阵营：">
      <el-select v-model="form.camp" size="mini" @change="campChange" placeholder="请选择实体阵营">
        <el-option v-for="item in campOptions" :key="item.value" :label="item.name"
                   :value="item.value"></el-option>
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script>
import store from "@/store";

export default {
  name: "basic",
  props: {
    entity: {
      type: Object,
      default: ()=>{}
    }
  },
  data(){
    return{

      supports: {
        type: ["**"],
        name: ["**"],
        came: ["model", "place", "image", "situation"]
      },

      typeOptions: [
        {
          value: 'captions',
          label: '解说词',
          color: '#ee4863'
        },
        {
          value: 'model',
          label: '三维模型',
          color: '#73575c'
        },
        {
          value: 'place',
          label: '地标',
          color: '#428675'
        },
        {
          value: 'situation',
          label: '态势标绘',
          color: '#73575c'
        },
        {
          value: 'image',
          label: '图片/图标',
          color: '#525288'
        },
        {
          value: 'tag',
          label: '标签',
          color: '#2e317c'
        },{
          value: 'boundary',
          label: '边界',
          color: '#2e317c'
        },{
          value: 'river',
          label: '河流',
          color: '#2e317c'
        },{
          value: 'road',
          label: '道路',
          color: '#2e317c'
        },{
          value: 'camera',
          label: '摄像头',
          color: '#2e317c'
        },{
          value: 'audio',
          label: '音频',
          color: '#2e317c'
        },{
          value: 'video',
          label: '视频',
          color: '#2e317c'
        },{
          value: 'group',
          label: '集合',
          color: '#2e317c'
        },{
          value: 'root',
          label: '根目录',
          color: '#2e317c'
        }
      ],
      campOptions: [
        {name: "我方", value: 0},
        {name: "敌方", value: 1},
        {name: "中立方", value: 2},
      ],
      selectCamp:{
        0: {fill:"rgba(255,0,0,0.4)",border:"rgba(255,0,0,0.8)",text:"rgba(255,255,0,1)"},
        1: {fill:"rgba(0,0,255,0.4)",border:"rgba(0,0,255,0.8)",text:"rgba(255,255,255,1)"},
        2: {fill:"rgba(0,255,0,0.4)",border:"rgba(0,255,0,0.8)",text:"rgba(0,255,255,1)"}
      },
      form: {
        id: null,
        name: "",
        camp: 0
      }
    }
  },
  computed: {
    info(){
      return {
        id: this.entity.id,
        name: this.entity.name,
        camp: this.entity.camp
      }
    }
  },
  watch:{
    info: {
      handler(){
        this.init()
      },
      immediate: true
    }
  },
  methods:{
    /** 初始化 */
    init(){
      this.form.id = this.entity.id
      this.form.name = this.entity.name
      this.form.type = this.entity.type
      this.form.camp = this.entity.camp
    },
    /** 名称修改 */
    nameChange() {
      this.$cesiumHelper.updateObjById(this.form.id, {name: this.form.name})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 阵营修改 */
    campChange(val) {
      this.$cesiumHelper.updateObjById(this.form.id, {camp: val})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
  }
}
</script>

<style lang="less" scoped>
.info-form {
  padding: 0 20px;

  /deep/.el-form-item{
    margin: 0;
  }

  /deep/.el-form-item__label{
    font-size: 12px;
    padding: 0;
  }
}
</style>
