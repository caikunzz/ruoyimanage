<template>
  <div
    class="timeline-track-contextmenu"
    v-if="isShow"
    :style="{ left: left + 'px', top: top + 'px' }"
  >
    <template>
      <div class="item" @click="flyToEntity(node)">
        <span>查看</span>
      </div>
      <div class="item" @click="editElement(node)">
        <span>编辑</span>
      </div>
      <div class="item" @click="deleteElement(node)">
        <span>删除</span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "contextMenu",
  data() {
    return {
      isShow: false,
      left: 0,
      top: 0,
      node: null,
    };
  },
  methods: {
    /** 显示菜单 */
    show(e, node) {
      this.left = e.clientX + 10;
      this.top = e.clientY + 10;
      this.isShow = true;
      this.node = node;
    },
    /** 关闭菜单 */
    hide() {
      this.isShow = false;
      this.left = 0;
      this.top = 0;
      this.node = null;
    },
    /** 前往 */
    flyToEntity(node) {
      const info = this.$cesiumHelper.getEntityInfo(node.id);
      this.$cesiumHelper.jumpToEntity(info);
    },
    /** 编辑 */
    editElement(node) {
      const info = this.$cesiumHelper.getEntityInfo(node.id);
      this.$store.dispatch("setActivateEntity", info);
    },
    /** 删除 */
    deleteElement(node) {
      this.$cesiumHelper.deleteObjById(node.id);
      this.$store.dispatch("removeEntitySource", node.id);
    },
  },
  mounted() {
    // 挂载到body中
    document.getElementById("app").appendChild(this.$el);
    document.body.addEventListener("click", this.hide);
  },
  destroyed() {
    document.body.removeEventListener("click", this.hide);
  },
};
</script>

<style lang="less" scoped>
.timeline-track-contextmenu {
  position: fixed;
  width: 120px;
  background: #f1f3f5;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  margin: -0.25rem 0 0 0.125rem;
  padding: 5px;
  z-index: 9999;

  .item {
    padding: 0.25rem 1rem 0.25rem 1.25rem;
    background-color: transparent;
    text-align: start;
    cursor: pointer;
    color: #1a1a1a;
    font-family: inherit;
    font-size: 12px;
    font-weight: 400;
    display: grid;
    grid-template-columns: 1fr 0.2fr;
    line-height: 14px;

    &.danger {
      color: #f56c6c;

      > .item-content-right {
        color: #1a1a1a;
      }
    }

    &:hover {
      background: #339af0;
      color: #ffffff;
    }

    &.disabled {
      color: grey;
      cursor: not-allowed;

      &:hover {
        background: #fff;
      }
    }
  }
}
</style>
