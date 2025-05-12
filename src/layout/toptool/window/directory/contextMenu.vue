<template>
  <div
      class="directory-contextmenu"
      v-if="isShow"
      :style="{ left: left + 'px', top: top + 'px' }"
  >
    <template>
      <div class="item" v-if="node.type ==='group' || node.type === 'root'" @click="createElement(node)">
        <span>新建集合</span>
      </div>
      <div class="item" @click="flyToEntity(node)">
        <span>前往</span>
      </div>
      <div class="item" @click="editElement(node)">
        <span>编辑</span>
      </div>
      <div class="item" @click="deleteElement(node)">
        <span>删除</span>
      </div>
      <div class="item" @click="exportJson(node)">
        <span>导出</span>
      </div>
    </template>
  </div>
</template>

<script>

export default {
  name: "contextMenu",
  data(){
    return{
      isShow: false,
      left: 0,
      top: 0,
      node: null
    }
  },
  methods: {
    /** 显示菜单 */
    show(e, node) {
      this.left = e.clientX + 10
      this.top = e.clientY + 10
      this.isShow = true
      this.node = node
    },
    /** 关闭菜单 */
    hide() {
      this.isShow = false
      this.left = 0
      this.top = 0
      this.node = null
    },
    /** 创建集合 */
    createElement(parent){
      const item = {
        name: "新建集合",
        groupId: parent.id,
        type: "group",
        show: true
      }
      const entity = this.$cesiumHelper.group.createGroup(item)
      const info = this.$cesiumHelper.getEntityInfo(entity)
      this.$store.dispatch("addEntitySource", info)
    },
    /** 前往 */
    flyToEntity(node){
      const info = this.$cesiumHelper.getEntityInfo(node.id)
      this.$cesiumHelper.jumpToEntity(info)
    },
    /** 编辑 */
    editElement(node){
      const info = this.$cesiumHelper.getEntityInfo(node.id)
      this.$store.dispatch("setActivateEntity", info)
    },
    /** 删除 */
    deleteElement(node){
      if (node.type === "root"){
        this.$message.warning("不允许删除根目录")
      } else if (node.type === "group"){
        let entityArr = this.$cesiumHelper.group.export(node.id)
        entityArr.forEach(item=>{
          this.$cesiumHelper.deleteObjById(item.id)
          this.$store.dispatch("removeEntitySource", item.id)
        })
      } else {
        this.$cesiumHelper.deleteObjById(node.id)
        this.$store.dispatch("removeEntitySource", node.id)
      }
    },
    /** 导出 */
    exportJson(node){
      const fileName = `分组导出-${node.name}`
      const animation = this.$cesiumHelper.export(node.id)
      animation.name = fileName
      // 将 JSON 数据转换为字符串
      const jsonString = JSON.stringify(animation, null, 2);
      // 创建一个 Blob 对象
      const blob = new Blob([jsonString], { type: 'application/json' });
      // 创建一个 <a> 标签，设置其 href 属性为 Blob 对象的 URL
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      // 设置下载文件的名称
      a.download = `分组导出-${node.name}.json`;
      // 模拟点击 <a> 标签，开始下载
      a.click();
      // 下载完成后，释放 Blob 对象的 URL
      URL.revokeObjectURL(a.href);
    }
  },
  mounted() {
    // 挂载到body中
    document.getElementById("app").appendChild(this.$el);
    document.body.addEventListener('click', this.hide)
  },
  destroyed() {
    document.body.removeEventListener('click', this.hide)
  }
}
</script>

<style lang="less" scoped>
.directory-contextmenu {
  position: fixed;
  width: 120px;
  z-index: 9999;
  background: #F1F3F5;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0,0,0,.2);
  margin: -0.25rem 0 0 0.125rem;
  padding: 0;

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
    grid-template-columns: 1fr .2fr;
    line-height: 14px;

    &.danger {
      color: #f56c6c;

      >.item-content-right{
        color: #1a1a1a;;
      }
    }

    &:hover {
      background: #339AF0;
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
