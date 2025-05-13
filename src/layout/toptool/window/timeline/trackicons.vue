<template>
  <div
    ref="iconList"
    class="track-list-icon-container"
    @touchmove.prevent
    @mousewheel.prevent
  >
    <span class="track-list-icon-top" />
    <div class="track-list-icon-item">
      <div
        v-for="(item, index) in entities"
        :key="index"
        class="icon-bar"
        :class="focusTrack && focusTrack.id === item.id ? 'is-active' : ''"
        :style="{ height: eleTypeStyle[item.type].h + 'px' }"
      >
        <i class="iconfont" :class="iconMap.get(item.type)"></i>
      </div>
    </div>
  </div>
</template>

<script>
import store from "@/store";

export default {
  name: "trackicons",
  props: {
    eleTypeStyle: {
      type: Object,
      default: () => {},
    },
    offsetTop: {
      type: Number,
      default: 0,
    },
    focusTrack: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    /** 实体资源 */
    entities() {
      const list = store.getters.entities.filter(
        (p) => p.type !== "group" && p.type !== "root"
      );
      const filter = list.filter((p) => p.type !== "camera");
      const cameraIndex = list.findIndex((item) => item.type === "camera");
      return cameraIndex !== -1 ? [...filter, list[cameraIndex]] : list;
    },

    /** 图标字典 */
    iconMap() {
      return store.state.cesium.iconMap;
    },
  },
  watch: {
    offsetTop(val) {
      this.$refs.iconList.scrollTop = val;
    },
  },
};
</script>

<style lang="less" scoped>
.track-list-icon-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-content: normal;
  justify-content: flex-start;
  align-items: center;
  border-right: 1px solid #ffffff;
  position: relative;
  overflow-y: hidden;
  overflow-x: scroll;

  .track-list-icon-top {
    width: 100%;
    height: 1.25rem;
    position: sticky;
    right: 0;
    left: 0;
    top: 0;
    background-color: #d5d5d5;
    z-index: 2;
  }

  .track-list-icon-item {
    padding-top: 2.5rem;
    padding-bottom: 1.25rem;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    flex-direction: column;
    min-width: 100%;
    min-height: 100%;
    position: absolute;
    left: 0;
    right: 0;
    box-sizing: border-box;

    .icon-bar {
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      padding: 1px 0;
      margin: 1px 0;
      color: #000000;
      box-sizing: border-box;

      i {
        color: black;
        font-size: 14px;
      }
    }

    .is-active {
      background-color: #eeeeee;
    }

    .is-main {
      background-color: rgb(59 130 246/ 0.2);
    }
  }

  /* 隐藏垂直滚动条 */
  &::-webkit-scrollbar {
    height: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d5d5d5;
  }
  &::-webkit-scrollbar-track {
    background-color: #d5d5d5;
  }
}
</style>
