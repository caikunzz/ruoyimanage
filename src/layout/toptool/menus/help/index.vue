<template>
  <div class="tool-menu-item" @click="handleHelp">帮助</div>
</template>

<script>
export default {
  name: "index",
  methods: {
    handleHelp() {
      window.open(
        `http://${window.location.hostname}:8181/docs/szhzlk_bzsc/szhzlk_bzsc-1g42as6fnocso`
      );
    },
  },
};
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
