<template>
  <!--  搜索栏  -->
  <div class="search-bar">
    <el-input prefix-icon="el-icon-search" size="medium" @keydown.enter.native="search(searchName)" v-model="searchName" placeholder="请输入地点"/>
  </div>
</template>

<script>
import * as gisInfoApi from "@/api/cesium/gisInfo";

export default {
  name: "index",
  data(){
    return{
      searchName: ""
    }
  },
  methods:{
    /* 查询位置 */
    async search(val) {
      if (val === "") return
      const regex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
      if (regex.test(val)){
        this.$cesiumHelper.cameraFlyTo(parseFloat(val.split(",")[0]), parseFloat(val.split(",")[1]), 4000)
        return
      }
      gisInfoApi.queryCityNliLike(val).then(res=>{
        if (res.data.length > 0) {
          gisInfoApi.queryCityById(res.data[0].id).then(resp=>{
            this.$message.success(res.data[0].value)
            this.$cesiumHelper.cameraFlyTo(parseFloat(resp.data["lng"]), parseFloat(resp.data["lat"]), 4000)
          })
        } else {
          this.$message.error("未找到对应位置")
        }
      })
    }
  }
}
</script>

<style scoped>
.search-bar{
  position: relative;
  top: -1px;
}
.search-bar /deep/.el-input__inner{
  border-radius: 0;
  height: 34px;
  line-height: 34px;
  font-size: 12px;
  border: none;
  color: #FFFFFF;
  background-color: #2B579A;
}
.search-bar /deep/.el-input__inner:hover{
  background-color: #124078;
}
</style>
