<template>
  <!-- 实体树组件 -->
  <floating-bar
    ref="treeEntityFloatingRef"
    v-model="visible"
    title="作战编成"
    :width="200"
    :height="floatHeight"
    :top="100"
    :left="0"
    :draggable="true"
  >
    <template slot="default">
      <div class="tree-entity-body">
        <div class="top-search-bar">
          <el-input
            size="mini"
            placeholder="请输入内容"
            suffix-icon="el-icon-search"
            v-model="searchName"
          >
          </el-input>
        </div>
        <div class="body-tree-bar">
          <el-tree
            :data="directory"
            :props="{ children: 'children', label: 'name' }"
            :indent="8"
            node-key="id"
            ref="entityTreeRef"
            :draggable="isEdit == null"
            :allow-drop="allowNodeDrop"
            :default-expanded-keys="defaultShowNodes"
            :filter-node-method="filterNode"
            @node-expand="openNode"
            @node-collapse="closeNode"
            @node-drop="handleNodeDrop"
            @node-contextmenu="contextMenu"
          >
            <div class="custom-tree-node" slot-scope="{ node, data }">
              <el-input
                v-if="isEdit === data.id"
                v-model.trim="renameInput"
                size="mini"
                ref="renameInputRef"
                @blur="editSave(data)"
                @keyup.enter.native="$event.target.blur()"
              >
              </el-input>
              <span v-else @dblclick.stop="handleDbClick(data)">
                <i class="iconfont" :class="iconMap.get(data.type)"></i>
                {{ node.label }}
              </span>
            </div>
          </el-tree>
        </div>
      </div>
      <!-- 右键菜单 -->
      <contextMenu
        ref="directoryContextMenuRef"
        class="context-bar"
      ></contextMenu>
    </template>
  </floating-bar>
</template>

<script>
import floatingBar from "@/components/floatingBar/index.vue";
import contextMenu from "./contextMenu.vue";

export default {
  name: "treeEntity",
  components: { floatingBar, contextMenu },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      /* 搜索内容 */
      searchName: "",

      /* 实体树内容 */
      treeData: [],

      /* 右键菜单 */
      contextmenu: {
        visible: false,
        offsetLeft: 0,
        offsetTop: 0,
      },

      /* 当前选中实体 */
      currentNode: null,

      /* 默认展开节点 */
      defaultShowNodes: [],

      /* 是否展示窗格 */
      visible: false,

      /* 当前编辑节点 */
      isEdit: null,

      /* 重命名的输入框 */
      renameInput: "",
    };
  },
  computed: {
    directory() {
      const list = this.$store.getters.entities.map((item) => {
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          groupId: item.groupId,
        };
      });
      return this.buildTree(list);
    },

    iconMap() {
      return this.$store.state.cesium.iconMap;
    },

    floatHeight() {
      return (window.innerHeight - 100) / 2;
    },
  },
  watch: {
    visible(val) {
      this.$emit("input", val);
    },
    value(val) {
      this.visible = val;
    },
    searchName(val) {
      this.$refs.entityTreeRef.filter(val);
    },
  },
  methods: {
    /** 右键单击菜单 */
    contextMenu(event, data) {
      this.$refs.directoryContextMenuRef.show(event, data);
    },

    /** 扁平数据结构数据 转 树结构数据 */
    buildTree(items, id, parentId) {
      id = id || "id";
      parentId = parentId || "groupId";
      return this.handleTree(items, id, parentId);
    },

    // 双击重命名
    handleDbClick(data) {
      // 将当前节点名赋值给groupNameInput
      this.renameInput = data.name;
      // 将当前节点id赋值给isEdit
      this.isEdit = data.id;
      this.$nextTick(() =>
        // 设置输入框选中
        this.$refs.renameInputRef.select()
      );
    },

    // 失去焦点
    editSave(data) {
      // 置为初始值
      this.isEdit = null;
      if (!this.renameInput) {
        this.$message.warning("材料名称不可为空");
        return false;
      }
      this.$cesiumHelper.updateObjById(data.id, { name: this.renameInput });
      const info = this.$cesiumHelper.getEntityInfo(data.id);
      this.$store.dispatch("updateEntitySource", info);
    },

    /** 判断节点是否可以被拖拽 */
    allowNodeDrop(_, dropNode, type) {
      return (
        ((dropNode.data.groupId !== undefined || type === "inner") &&
          dropNode.data.type === "group") ||
        type !== "inner"
      );
      // 备用  如果地名允许树结构就使用下面的
      // && ((dropNode.data.type === "group" || type !== "inner") ||
      //     dropNode.data.type === "tag" && _.data.type === "tag")
    },

    /** 节点拖拽事件 */
    handleNodeDrop(before, after, inner) {
      const groupId = inner !== "inner" ? after.parent.data.id : after.data.id;
      const id = before.data.id;
      this.$cesiumHelper.updateObjById(id, { groupId: groupId });
      const info = this.$cesiumHelper.getEntityInfo(id);
      this.$store.dispatch("updateEntitySource", info);
    },

    /** 打开目录 */
    openNode(data) {
      // 保存当前展开的节点
      let flag = false;
      this.defaultShowNodes.some((item) => {
        if (item === data.id) {
          // 判断当前节点是否存在， 存在不做处理
          flag = true;
          return;
        }
      });
      if (!flag) {
        // 不存在则存到数组里
        this.defaultShowNodes.push(data.id);
      }
    },
    /** 关闭目录 */
    closeNode(data) {
      // 删除当前关闭的节点
      this.defaultShowNodes.some((item, i) => {
        if (item === data.id) {
          this.defaultShowNodes.splice(i, 1);
        }
      });
      // 这里主要针对多级树状结构，当关闭父节点时，递归删除父节点下的所有子节点
      this.removeDefaultShowNodeIds(data);
    },
    // 删除树子节点
    removeDefaultShowNodeIds(data) {
      const ts = this;
      //懒加载的时候想要删除子节点  得在加载下级数据时添加上data.children
      if (data.children) {
        data.children.forEach(function (item) {
          const index = ts.defaultShowNodes.indexOf(item.id);
          if (index !== -1) {
            ts.defaultShowNodes.splice(index, 1);
          }
          ts.removeDefaultShowNodeIds(item);
        });
      }
    },

    // 模糊查询
    filterNode(value, data) {
      if (!value) return true;
      return data.name.indexOf(value) !== -1;
    },
  },
};
</script>

<style lang="less" scoped>
.iconfont {
  font-size: 12px;
}

.tree-entity-body {
  padding: 5px;
  box-sizing: border-box;
}

.tree-entity-body {
  padding: 5px;
}

.body-tree-bar {
  margin-top: 5px;
  height: 240px;
  overflow-y: auto;
  text-align: left;
}

.body-tree-bar::-webkit-scrollbar {
  width: 8px;
}

.body-tree-bar::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: #d5d5d5;
}

.body-tree-bar .custom-tree-node {
  flex: 1;
  align-items: center;
  font-size: 12px;
  padding-right: 8px;
}

.custom-tree-node {
  /deep/.el-input .el-input__inner {
    height: 16px;
    width: 100px;
    line-height: 16px;
    border-radius: 0;
    border: 1px solid #409eff;
    padding-left: 5px;
  }
}

.context-bar {
  padding: 5px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
