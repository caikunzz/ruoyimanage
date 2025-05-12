<template>
  <el-dropdown trigger="click" @command="handleCommand" placement="top-start">
    <div class="el-dropdown-link tool-menu-item">
      工具
    </div>
    <el-dropdown-menu slot="dropdown" >
      <el-dropdown-item command="placeAdd"><i class="iconfont icon-dianweishiqu"></i>坐标拾取</el-dropdown-item>
      <el-dropdown-item command="distanceMeasure"><i class="iconfont icon-mti-juliceliang"></i>距离测量</el-dropdown-item>
      <el-dropdown-item command="areaMeasure"><i class="iconfont icon-mti-mianjiceliang"></i>面积测量</el-dropdown-item>
      <el-dropdown-item command="modelMeasure"><i class="iconfont icon-sanjiaoceliang1"></i>三角测量</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

export default {
  name: "index",
  methods: {
    handleCommand(val) {
      switch (val) {
        case "placeAdd":
          this.addPlace();
          break;
        case "distanceMeasure":
          this.$cesiumHelper.measure.distanceMeasure();
          break;
        case "areaMeasure":
          this.$cesiumHelper.measure.areaMeasure();
          break;
        case "modelMeasure":
          this.$cesiumHelper.measure.modelMeasure();
          break;
      }
    },
    addPlace(){
      this.$cesiumHelper.plotting.placePlotting.createPlacePlotting().then(entity=>{
        const info = this.$cesiumHelper.getEntityInfo(entity)
        this.$store.dispatch("addEntitySource", info)
        this.$nextTick(()=>this.$store.dispatch("setActivateEntity", info))
      }, err=>{
        this.$message.error(err)
      })
    },
    measure(){
      console.log("测量工具")
    }
  }
}
</script>

<style scoped>
.tool-menu-item {
  padding: 0 20px;
  height: 100%;
  color: white;
  font-size: 12px;
  cursor: pointer;

  .tool-menu-item-title {
    width: 100%;
    height: 100%;
  }

  &:hover {
    background-color: #124078;
    color: #409eff;
  }
}

.el-dropdown-menu {
  border-radius: 0;
  margin-top: 5px;
  background-color: #f8f8f8;
}
</style>
