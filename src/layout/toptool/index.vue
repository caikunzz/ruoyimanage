<template>
  <div class="top-tool-container">
    <div class="top-tool-menu-group">
      <TopMenus />
      <!--  标题栏  -->
      <div class="title-bar">
        <el-dropdown trigger="click" @command="handleCommand">
        <span class="el-dropdown-link">
          <span class="user-name">当前用户：{{ userInfo?.username }}</span>
        </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="logout">退出</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
      <div class="tool-control-btn" :class="topUtilGroupBarState ? 'is-active' : ''" @click="topUtilGroupBarState = !topUtilGroupBarState"><i class="iconfont icon-guding"></i></div>
    </div>
    <div class="top-tool-body-wrapper" :class="topUtilGroupBarState ? 'top-tool-body-show': 'top-tool-body-hide'">
      <div class="top-tool-item">
        <plot-group/>
        <span class="plot-item-foot">标绘插件</span>
      </div>
      <div class="divider-line"></div>
      <div class="top-tool-item">
        <window-group/>
        <span class="plot-item-foot">窗口</span>
      </div>
      <div class="divider-line"></div>
      <div class="top-tool-item">
        <tool-group/>
        <span class="plot-item-foot">辅助功能</span>
      </div>
    </div>
  </div>
</template>

<script>
import TopMenus from "@/layout/toptool/menus"

import WindowGroup from "@/layout/toptool/window/index.vue";
import ToolGroup from "@/layout/toptool/other/index.vue";
import PlotGroup from "@/layout/toptool/plot/tool/index.vue";
import {logout} from "@/api/login";

export default {
  components: {WindowGroup, ToolGroup, PlotGroup, TopMenus},
  computed: {
    userInfo() {
      return {
        username: localStorage.getItem("username")
      }
    }
  },
  data(){
    return{
      topUtilGroupBarState: true
    }
  },
  methods: {

    /* 标题点击事件 */
    handleCommand(val){
      switch (val){
        case "logout":
          this.userLogout()
          break
        default:
          this.$message.warning("未知方法")
      }
    },

    /* 用户登出 */
    userLogout(){
      logout().then(()=>{
        localStorage.removeItem("username")
        localStorage.removeItem("password")
        localStorage.removeItem("token")
        this.$router.push("/login")
      }).catch(()=>{})
    }
  }
}

</script>

<style scoped lang="less">
.top-tool-container {
  width: 100%;
  height: 100px;
  user-select: none;

  .top-tool-menu-group {
    width: 100%;
    height: 35px;
    line-height: 35px;
    background-color: #2B579A;

    .title-bar {
      height: 34px;
      line-height: 34px;
      padding: 0 20px;
      cursor: pointer;
      position: absolute;
      top: 0;
      right: 34px;

      &:hover{
        background-color: #124078;
      }
      .user-name {
        font-size: 12px;
        color: #ffffff;
      }
    }
    .tool-control-btn{
      width: 34px;
      height: 34px;
      position: absolute;
      top: 0;
      right: 0;
      color: white;
      &:hover{
        background-color: #124078;
      }
    }

    .is-active{
      color: #409eff;
    }
  }

  .top-tool-body-wrapper {
    width: 100%;
    height: calc(100% - 35px);

    background-color: #ffffff;
    padding: 5px;
    box-sizing: border-box;

    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;

    .top-tool-item {
      height: 65px;
      position: relative;

      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;

      .plot-item-foot {
        font-size: 12px;
        transform: scale(0.8);
        position: absolute;
        bottom: 3px;
      }
    }

    .divider-line {
      width: 1px;
      height: 100%;
      background-color: #C6C6C6;
      margin: 0 10px;
    }
  }

  .top-tool-body-show {
    width: 100%;
    height: 65px;
    overflow: hidden;
    position: relative;
    transition: all .3s;
  }

  .top-tool-body-hide {
    width: 100%;
    height: 0;
    overflow: hidden;
    position: relative;
    transition: all .3s;
    padding: 0;
  }
}
</style>
<style lang="less">
// 注释
.cesium-performanceDisplay {
  background: none;
  border: none;
  width: 100px;
  position: absolute;
  right: 164px;
  top: -47px;
  z-index: 3;

  & > .cesium-performanceDisplay-ms {
    display: none;
  }

  & > .cesium-performanceDisplay-fps {
    color: #FFFFFF;
    font-weight: normal;
    font-family: Avenir, Helvetica, Arial, sans-serif;

    &::before {
      content: "帧率：";
      color: #FFFFFF;
      font-size: 12px;
    }
  }
}
</style>
