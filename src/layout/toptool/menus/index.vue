<template>
  <div class="top-menus">
    <file-menu />
    <tool-menu />
<!--    <setting-menu />-->
    <help-menu />
    <search class="position-search"/>
  </div>
</template>

<script>
import FileMenu from "@/layout/toptool/menus/file"
import ToolMenu from "@/layout/toptool/menus/tool"
// import SettingMenu from "@/layout/toptool/menus/setting"
import HelpMenu from "@/layout/toptool/menus/help"
import Search from "@/layout/toptool/search/index.vue";

export default {
  components: {Search, FileMenu, ToolMenu, HelpMenu},


}
</script>

<style scoped lang="less">
.top-menus {
  width: 100%;
  height: 35px;
  line-height: 35px;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}
</style>
