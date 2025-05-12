<template>
  <el-dropdown trigger="click" @command="handleCommand" placement="top-start">
    <div class="el-dropdown-link tool-menu-item">
      设置
    </div>
    <el-dropdown-menu slot="dropdown">
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

export default {
  name: "index",
  methods: {
    handleCommand(val) {
      switch (val) {
        default:
          break;
      }
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
