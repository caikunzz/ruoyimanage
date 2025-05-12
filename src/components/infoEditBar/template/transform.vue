<!--
  变换编辑框
-->
<template>
  <el-form class="transform-form" label-position="right" label-width="50px" :model="form">
    <div class="position-edit">
      <el-form-item v-if="supports.moveWay.indexOf('**') !== -1 || supports.moveWay.indexOf(form.type) !== -1 || supports.moveWay.indexOf(form.geoType) !== -1 " label="位置：">
        <el-radio :disabled="!info.position instanceof Array" v-model="entity_move_way" @input="setPositionState"
                  size="mini" label="drag">拖拽
        </el-radio>
        <el-radio :disabled="!info.position instanceof Array" v-model="entity_move_way" @input="setPositionState"
                  size="mini" label="input">位置
        </el-radio>
      </el-form-item>
      <div v-if="info.position instanceof Array && supports.moveWay.indexOf('**') !== -1 || supports.moveWay.indexOf(form.type) !== -1 || supports.moveWay.indexOf(form.geoType) !== -1 ">
        <el-form-item label="经度：">
          <el-input-number @change="positionChange" :disabled="entity_move_way!=='input'"
                           v-model="form.position.x" size="mini"></el-input-number>
        </el-form-item>
        <el-form-item label="纬度：">
          <el-input-number @change="positionChange" :disabled="entity_move_way!=='input'"
                           v-model="form.position.y" size="mini"></el-input-number>
        </el-form-item>
        <el-form-item label="高度：">
          <el-input-number @change="positionChange" :disabled="entity_move_way!=='input'"
                           v-model="form.position.z" size="mini"></el-input-number>
        </el-form-item>
      </div>
    </div>
    <div v-if="supports.rotate.indexOf('**') !== -1 || supports.rotate.indexOf(form.type) !== -1 || supports.rotate.indexOf(form.geoType) !== -1 "
         class="rotate-billboard-edit">
      <el-form-item label="旋转：">
        <el-input-number data-unit="°" v-model="form.angle" size="mini" @change="rotateChange" :min="-360" :max="360"></el-input-number>
      </el-form-item>
    </div>
    <div class="scale-edit" v-if="supports.scale.indexOf('**') !== -1 || supports.scale.indexOf(form.type) !== -1 || supports.scale.indexOf(form.geoType) !== -1 ">
      <el-form-item label="缩放：">
        <el-input-number v-model="form.scale"
                         :min="0.1"
                         :max="10"
                         :precision="1"
                         :step="0.1"
                         @change="scaleChange"
                         size="mini">
        </el-input-number>
      </el-form-item>
    </div>
    <div v-if="supports.height.indexOf('**') !== -1 || supports.height.indexOf(form.type) !== -1 || supports.height.indexOf(form.geoType) !== -1 " class="height-edit" >
      <el-form-item label="高度：">
        <div class="block">
          <el-slider @change="changeHeight" :max="8000" v-model="form.height"></el-slider>
        </div>
      </el-form-item>
    </div>
  </el-form>
</template>

<script>

export default {
  name: "transform",
  props: {
    entity: {
      type: Object,
      default: ()=>{}
    }
  },
  data(){
    return{

      supports: {
        moveWay: ["image", "TextBox", "model", "place", "particle", "Flag", "video", "text", "video"],
        X: ["image", "TextBox", "model", "place", "particle", "Flag", "video", "text", "video"],
        Y: ["image", "TextBox", "model", "place", "particle", "Flag", "video", "text", "video"],
        Z: ["image", "TextBox", "model", "place", "particle", "Flag", "text", "video"],
        rotate: ["image", "model", "place", "particle"],
        scale: ["image", "TextBox", "model", "place", "particle", "video"],
        height: ["AttackArrow", "SwallowtailArrow", "PincerArrow", "AssemblePolygon", "Polygon", "CurvedPolygon", "RightAngleArrow", "RoundRectangle","CurveArrow","Curve","DefenseLine","LineArrow","Polyline"]
      },

      form: {
        id:"",
        type: "",
        geoType: "",
        angle:0,
        scale:0,
        height:0,
        position:{
          x:0,
          y:0,
          z:0
        }
      },

      /** 实体移动方式
       * input|drag 输入|拖拽
       * */
      entity_move_way: "drag"
    }
  },
  computed: {
    info(){
      return {
        id: this.entity.id,
        type: this.entity.type,
        geoType: this.entity.geoType,
        position: this.entity.position,
        angle: this.entity.angle,
        scale: this.entity.scale
      }
    }
  },
  watch:{
    info: {
      handler(val, old){
        this.destroyed(old?.id)
        this.$nextTick(()=>this.init())
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
      this.form.angle = this.entity.angle
      this.form.scale = this.entity.scale
      this.form.position =  this.entity.position instanceof Array ? {
        x:  this.entity.position[0],
        y:  this.entity.position[1],
        z:  this.entity.position[2]
      } : {
        x:  this.entity.position?.points[0][0],
        y:  this.entity.position?.points[0][1],
        z:  this.entity.position?.points[0][2]
      }
      this.entity_move_way = "drag"
      this.setPositionState()
    },
    /** 位置编辑状态修改 */
    setPositionState() {
      const entity = this.$cesiumHelper.getEntityById(this.form.id)
      const data = this.$cesiumHelper.getEntityInfo(entity)
      if (entity.type === "video" || entity.type === "text"){
        entity.html.onmousedown = this.bindDragDom.bind(this)
        this.form.position = {
          x: data.position[0],
          y: data.position[1],
          z: data.position[2],
        }
      } else {
        entity.move = this.entity_move_way === 'drag'
        this.form.position = data.position instanceof Array ? {
          x: data.position[0],
          y: data.position[1],
          z: data.position[2]
        } : {x: data.position.points[0][0], y: data.position.points[0][1], z: data.position.points[0][2]}
      }
    },
    /** 位置修改 */
    positionChange() {
      const entity = this.$cesiumHelper.getEntityById(this.form.id)
      const coord = [this.form.position.x, this.form.position.y, this.form.position.z || 0]
      this.$cesiumHelper.updateObjById(this.form.id, {position: coord})
      const info = this.$cesiumHelper.getEntityInfo(entity)
      this.$store.dispatch("updateEntitySource", info)
    },

    /** 角度修改 */
    rotateChange() {
      this.$cesiumHelper.updateObjById(this.form.id, {angle: this.form.angle})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      this.$store.dispatch("updateEntitySource", info)
    },
    /** 缩放修改 */
    scaleChange() {
      this.$cesiumHelper.updateObjById(this.form.id, {scale: this.form.scale})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      this.$store.dispatch("updateEntitySource", info)
    },
    /** 高度修改 */
    changeHeight(){
      this.$cesiumHelper.updateObjById(this.form.id, {height: this.form.height})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      this.$store.dispatch("updateEntitySource", info)
    },
    /** 重置实体移动状态 */
    destroyed(id){
      if (id){
        const entity = this.$cesiumHelper.getEntityById(id)
        if (entity) {
          entity.move = false
        }
        if (entity && (entity.type === "video" || entity.type === "text")){
          entity.html.onmousedown = null
        }
      }
    },
    /** 为 Dom 元素添加拖拽功能 */
    bindDragDom(event){
      const that = this
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = event.target.offsetLeft;
      const startTop = event.target.offsetTop;
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);

      function drag(event) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const newLeft = startLeft + dx;
        const newTop = startTop + dy;
        event.target.style.left = newLeft + "px";
        event.target.style.top = newTop + "px";
      }
      function stopDrag(event) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const newLeft = startLeft + dx;
        const newTop = startTop + dy;

        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDrag);

        that.form.position = {x: newLeft, y: newTop, z:0}
        const coord = [that.form.position.x, that.form.position.y, that.form.position.z]
        that.$cesiumHelper.updateObjById(that.form.id, {position: coord})
      }
    }
  },
  beforeDestroy() {
    this.destroyed(this.form.id)
  }
}
</script>

<style lang="less" scoped>
.transform-form {
  padding: 0 20px 0 10px;

  /deep/ .el-radio {
    .el-radio__inner {
      width: 12px;
      height: 12px;
    }

    .el-radio__label {
      font-size: 12px;
    }
  }

  .rotate-billboard-edit {
    margin-top: 10px;
  }

  .scale-edit {
    margin-top: 10px;
  }

  /deep/.el-form-item{
    margin: 0;
  }

  /deep/.el-form-item__label{
    font-size: 12px;
    padding: 0;
  }
}
</style>
