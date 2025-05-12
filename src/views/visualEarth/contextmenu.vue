<template>
  <div
      v-if="isShow"
      class="contextmenuContainer"
      :style="{ left: left + 'px', top: top + 'px' }"
  >
    <template>
      <div class="item" @click="copy">
        <i class="el-icon-document-copy"></i>
        <span>复制</span>
      </div>
      <div class="item" @click="update">
        <i class="el-icon-edit-outline"></i>
        <span>编辑</span>
      </div>
      <div class="item" @click="remove">
        <i class="el-icon-delete"></i>
        <span>删除</span>
      </div>
      <div class="item" @click="hide">
        <i class="el-icon-circle-close"></i>
        <span>取消</span>
      </div>
    </template>
  </div>
</template>

<script>

export default {
  name: "ContextMenu",
  data() {
    return {
      isShow: false,
      left: 10,
      top: 0,
      currentEntityId: null
    };
  },
  mounted() {
    document.body.addEventListener("click", this.hide);
  },
  destroyed() {
    document.body.removeEventListener("click", this.hide);
  },
  methods: {
    /** 显示菜单 */
    show(click, entity) {
      this.left = click.position.x + 10;
      this.top = click.position.y + 10;
      this.isShow = true;
      this.currentEntityId = entity.id;
    },
    /** 关闭菜单 */
    hide() {
      this.isShow = false;
      this.left = 0;
      this.top = 0;
      this.currentEntityId = null;
    },
    /** 拷贝实体 */
    copy() {
      this.$cesiumHelper.copyById(this.currentEntityId).then(entity => {
        const info = this.$cesiumHelper.getEntityInfo(entity)
        this.$store.dispatch("addEntitySource", info)
      }).catch(err=>{
        this.$message.error(err)
      })
    },
    /** 编辑实体 */
    update() {
      const info = this.$cesiumHelper.getEntityInfo(this.currentEntityId)
      if(info == null)  this.$message.error("该实体不支持编辑")
      this.$store.dispatch("setActivateEntity", info)
    },
    /** 删除实体 */
    remove() {
      this.$cesiumHelper.deleteObjById(this.currentEntityId)
      this.$store.dispatch("removeEntitySource", this.currentEntityId)
    },
  }
};
</script>

<style lang="less" scoped>
.contextmenuContainer {
  position: fixed;
  width: 80px;
  background-color: rgba(235, 235, 235, .7);
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, .2);
  margin: -0.25rem 0 0 0.125rem;
  padding: 0;
  z-index: 20000;

  .item {
    padding: 0.3rem 0;
    background-color: transparent;
    cursor: pointer;
    color: #1a1a1a;
    font-family: inherit;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    position: relative;

    i{
      margin-right: 5px;
    }

    &>*{
      position: relative;
      left: -3px;
    }

    &:first-child {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }

    &:last-child {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    &.danger {
      color: #f56c6c;

      > .item-content-right {
        color: #1a1a1a;;
      }
    }

    &:hover {
      background: #2B579A;
      color: #FFFFFF;
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
