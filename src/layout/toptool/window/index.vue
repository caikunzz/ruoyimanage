<template>
  <div class="plotting-window-container">
    <div class="plotting-window-item-body">
      <el-checkbox v-model="showTreeEntity">作战编成</el-checkbox>
      <el-checkbox v-model="showTimeLine">素材时间线</el-checkbox>
      <el-checkbox v-model="showResource">基础资源</el-checkbox>

      <directory
          ref="treeEntityRef"
          v-model="showTreeEntity">
      </directory>
      <timeline
          ref="timeLineRef"
          v-model="showTimeLine">
      </timeline>
      <resource
          ref="ResourceRef"
          v-model="showResource">
      </resource>
    </div>
  </div>
</template>

<script>

import Directory from "./directory";
import Timeline from "./timeline";
import Resource from "./resource";

export default {
  name: "index",
  components: {Resource, Timeline, Directory},
  data() {
    return {
      /* 复选框 */
      showTreeEntity: false,
      showTimeLine: false,
      showResource: false,
    }
  },
}
</script>

<style scoped>
.plotting-window-container {
  width: 190px;
  height: 100%;
  position: relative;
}

.plotting-window-item-body {
  display: flex;
  flex-flow: row wrap;
  align-content: flex-start;
  text-align: left;
  height: 40px;
  padding-top: 7px;

  .el-checkbox{
    margin-left: 5px;
  }
}

.plotting-window-item-body > /deep/ .is-checked > .el-checkbox__label {
  color: #606266;
}

.plotting-window-item-body > /deep/ .el-checkbox {
  margin-right: 0;
  width: 90px;
}

/deep/ .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #606266;
  border: #606266;
}

/deep/ .el-checkbox__input.is-checked .el-checkbox__inner:after {
  left: 5px;
  top: 2px;
}

/deep/ .el-checkbox__label {
  font-size: 12px;
}
</style>
