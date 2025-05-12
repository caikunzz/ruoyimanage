<template>
  <div class="entityEditContainer" v-if="open">
    <div class="title-bar">
      <span></span>
      <span>{{ form.name }}</span>
      <span @click="close"><i class="el-icon-close"></i></span>
    </div>
    <el-collapse v-model="activeNames">
      <el-collapse-item title="基本信息" v-if="editSupport.info.indexOf(form.type) !== -1" name="info">
        <basic-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="文字" v-if="editSupport.text.indexOf(form.type) !== -1 || editSupport.text.indexOf(form.geoType) !== -1" name="text">
        <text-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="变换" v-if="editSupport.transform.indexOf(form.type) !== -1 || editSupport.transform.indexOf(form.geoType) !== -1" name="transform">
        <transform-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="过渡" v-if="editSupport.transition.indexOf(form.type) !== -1 " name="transition">
        <transition-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="材质" v-if="editSupport.material.indexOf(form.type) !== -1 && form.geoType !== 'TextBox'" name="material">
        <material-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="可见性" v-if="editSupport.visibility.indexOf(form.type) !== -1" name="visibility">
        <visibility-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="运动路线" v-if="editSupport.run.indexOf(form.type) !== -1 || editSupport.run.indexOf(form.geoType) !== -1  " name="run">
        <action-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="动画" v-if="editSupport.animation.indexOf(form.type) !== -1" name="animation">
        <animation-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="时间线" v-if="editSupport.times.indexOf(form.type) !== -1" name="times">
        <times-bar :entity="form"/>
      </el-collapse-item>
      <el-collapse-item title="数据交互" v-if="editSupport.dbInteractive.indexOf(form.type) !== -1" name="dbInteractive">
        <db-interactive-bar :entity="form" />
      </el-collapse-item>
      <el-collapse-item title="快速操作" v-if="editSupport.quick.indexOf(form.type) !== -1" name="quick">
        <quick-bar :entity="form"/>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import basicBar from "./template/basic";
import textBar from "./template/text";
import actionBar from "./template/action";
import animationBar from "./template/animation";
import materialBar from "./template/material";
import quickBar from "./template/quick";
import timesBar from "./template/times.vue";
import transformBar from "./template/transform";
import transitionBar from "./template/transition";
import visibilityBar from "./template/visibility";
import dbInteractiveBar from "./template/dbinteractive.vue";
import store from "@/store";
export default {
  name: "index",
  components: {
    basicBar,
    textBar,
    timesBar,
    actionBar,
    animationBar,
    materialBar,
    quickBar,
    transitionBar,
    transformBar,
    visibilityBar,
    dbInteractiveBar
  },
  data() {
    return {
      open: false,
      activeNames: "info",
      editSupport: {
        info: ["captions", "camera", "model", "place", "image", "audio", "video", "situation", "particle", "river", "road", "boundary", "group", "root", "text"],
        transform: ["image", "model", "place","particle","situation", "video", "text","Flag"],
        material: ["situation", 'river', "text","TextBox"],
        visibility: ["model", "place", "image", "text", "situation","particle", "river", "road", "boundary", "group", "root", "video"],
        run: ["model", "image","Flag","TextBox"],
        animation: ["image", "model", "situation", "place"],
        quick: ["captions"],
        text: ["image", "place", "text","TextBox"],
        transition: ["camera"],
        dbInteractive: ["place"],
        times: ["root", "group"]
      },

      form: {},
    }
  },
  computed:{
    /** 当前选中资源 */
    activateEntity() {
      return store.getters.activateEntity
    },
  },
  watch:{
    activateEntity: {
      handler(info){
        info ? this.initForm(info) : this.close()
      }
    }
  },
  methods: {
    /** 初始化表单 */
    initForm(info) {
      this.form = info
      this.open = true
      this.activeEntityEditState(info)
    },
    /** 关闭编辑框 */
    close() {
      this.open = false
      this.form = {}
      this.deactivateEntityEditState()
      store.dispatch("setActivateEntity", null)
    },

    /** 激活实体编辑状态 */
    activeEntityEditState(info){
      this.deactivateEntityEditState()

      if(info.type === "situation"){
        const entity = this.$cesiumHelper.getEntityById(info.id)
        this.$cesiumHelper.plotting.situationPlotting.storageEntity(entity)
        this.$cesiumHelper.plotting.situationPlotting.editEvent(info.id)
      }
    },

    /** 取消实体编辑状态 */
    deactivateEntityEditState(){
      this.$cesiumHelper.plotting.situationPlotting.destroy()
      this.$cesiumHelper.plotting.situationPlotting.deleteShowEntity()
    }
  },
}
</script>

<style lang="less" scoped>
.entityEditContainer {
  height: 100%;
  width: 100%;

  .title-bar {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    padding: 10px 7px;
    font-size: 12px;

    > span:nth-child(2) {
      font-weight: bold;
    }

    > span:last-child:hover {
      color: #409EFF;
    }
  }
}

/deep/ .el-collapse-item__header {
  padding-left: 10px;
  font-size: 12px;
  height: 35px;
  background-color: whitesmoke;
}

/deep/ .el-collapse-item__content {
  padding: 10px 30px;

  .el-date-editor .el-range__close-icon {
    width: 0;
  }
}
</style>
