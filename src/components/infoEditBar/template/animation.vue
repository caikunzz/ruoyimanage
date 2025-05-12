<!-- 动画编辑框 -->
<template>
  <el-form class="animation-form" label-position="right" label-width="60px" :model="form">
    <el-form-item label="闪烁时间" v-if="supports.flicker.indexOf('**') !== -1 || supports.flicker.indexOf(form.type) !== -1 || supports.flicker.indexOf(form.geoType) !== -1 ">
      <el-input-number data-unit="s" size="mini" @change="changeAnimation"
                       v-model="form.animation.flicker" :precision="1" :step="0.1"
                       :max="10" :min="0"></el-input-number>
    </el-form-item>
    <el-form-item label="生长时间" v-if="supports.growthLine.indexOf('**') !== -1 || supports.growthLine.indexOf(form.type) !== -1 || supports.growthLine.indexOf(form.geoType) !== -1 ">
      <el-input-number data-unit="s" size="mini" @change="changeGrowthLineDuration"
                       v-model="form.animation.growthLine" :precision="1" :step="0.1"
                       :max="10" :min="0"></el-input-number>
    </el-form-item>
    <el-form-item label="旋转时间" v-if="supports.rotate.indexOf('**') !== -1 || supports.rotate.indexOf(form.type) !== -1 || supports.rotate.indexOf(form.geoType) !== -1 ">
      <el-input-number data-unit="s" size="mini" @change="changeAnimation"
                       v-model="form.animation.rotate" :precision="1" :step="0.1"
                       :max="10" :min="0"></el-input-number>
    </el-form-item>
    <el-form-item label="缩放时间" v-if="supports.scale.indexOf('**') !== -1 || supports.scale.indexOf(form.type) !== -1 || supports.scale.indexOf(form.geoType) !== -1 ">
      <el-input-number data-unit="s" size="mini" @change="changeAnimation"
                       v-model="form.animation.scale" :precision="1" :step="0.1"
                       :max="10" :min="0"></el-input-number>
    </el-form-item>
    <el-form-item v-if="supports.radar.indexOf('**') !== -1 || supports.radar.indexOf(form.type) !== -1  || supports.radar.indexOf(form.geoType) !== -1 " label="雷达效果">
      <el-checkbox size="mini" @change="(val)=>changeAnimation(val, 'radar')" v-model="form.animation.radar">开启</el-checkbox>
    </el-form-item>
    <el-form-item v-if="supports.ripple.indexOf('**') !== -1 || supports.ripple.indexOf(form.type) !== -1  || supports.ripple.indexOf(form.geoType) !== -1 " label="空间扩散">
      <el-checkbox size="mini" @change="(val)=>changeAnimation(val, 'ripple')" v-model="form.animation.ripple">开启</el-checkbox>
    </el-form-item>
    <el-form-item v-if="supports.trackLine.indexOf('**') !== -1 || supports.trackLine.indexOf(form.type) !== -1  || supports.trackLine.indexOf(form.geoType) !== -1 " label="航迹线">
      <el-checkbox size="mini" @change="changeAnimation" v-model="form.animation.trackLine">开启</el-checkbox>
    </el-form-item>
  </el-form>
</template>

<script>

import store from "@/store";

export default {
  name: "animation",
  props: {
    entity: {
      type: Object,
      default: ()=>{}
    }
  },
  data(){
    return{
      supports: {
        //闪烁
        flicker: ["**"],
        //生长线
        growthLine:["Curve","Polyline"],
        rotate: ["image"],
        // 缩放
        scale: ["image"],
        //雷达
        radar:['image',"model","TextBox","Flag"],
        //航迹线
        trackLine:['image',"model","TextBox","Flag"],
        //空间扩散（波纹）
        ripple:['image',"model","TextBox","Flag"]
      },
      form: {
        type:null,
        geoType:null,
        animation: {
          flicker: 0,
          growthLine:0,
          rotate: 0,
          scale: 0,
          radar:false,
          trackLine: false,
          ripple:false
        },
      }
    }
  },
  computed: {
    info(){
      return {
        id: this.entity.id,
        type: this.entity.type,
        geoType:this.entity.geoType,
        animation: this.entity.animation
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
      this.form.type = this.entity.type
      this.form.geoType = this.entity.geoType
      this.form.animation ={
        flicker: this.entity.animation?.flicker || 0,
        growthLine: this.entity.animation?.growthLine || 0,
        rotate: this.entity.animation?.rotate || 0,
        scale: this.entity.animation?.scale || 0,
        radar:!!this.entity.animation?.radar,
        ripple:!!this.entity.animation?.ripple,
        trackLine:!!this.entity.animation?.trackLine
      }
    },
    /** 修改闪烁时间 */
    changeAnimation(val, type) {
      const data = JSON.parse(JSON.stringify(this.form.animation))
      if (type==="ripple" && val) {
        this.form.animation.radar = false
        delete data.radar
      }
      if (type==="radar" && val){
        this.form.animation.ripple = false
        delete data.ripple
      }
      this.$cesiumHelper.updateObjById(this.form.id, {animation: data})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改闪烁时间 */
    changeFlickerDuration() {
      this.$cesiumHelper.updateObjById(this.form.id, {animation: {flicker: this.form.animation.flicker}})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 修改线生长时间时间 */
    changeGrowthLineDuration() {
      this.$cesiumHelper.updateObjById(this.form.id, {animation: {growthLine: this.form.animation.growthLine}})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 是否开启雷达效果 */
    showRadar(){
      if (this.form.animation?.ripple)this.form.animation.ripple = false
      this.$cesiumHelper.updateObjById(this.form.id, {animation: {radar: this.form.animation.radar}})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    /** 是否开启航迹线 */
    showTrackLine(){
      this.$cesiumHelper.updateObjById(this.form.id, {animation: {trackLine: this.form.animation.trackLine}})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    showRipple(){
      if (this.form.animation?.radar)this.form.animation.radar = false
      this.$cesiumHelper.updateObjById(this.form.id, {animation: {ripple: this.form.animation.ripple}})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    }
  }
}
</script>

<style lang="less" scoped>
.animation-form{
  //选择框位置
  /deep/.el-checkbox {
    margin-left: -78px;
  }


  /deep/.el-form-item{
    margin: 0;
  }

  /deep/.el-form-item__label{
    font-size: 12px;
    padding: 0;
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

  .el-date-editor {
    width: 0;
  }

  .el-divider--horizontal {
    margin: 14px 0;
  }
}
</style>
