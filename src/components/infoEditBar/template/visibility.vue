<!--
  可见性编辑框
-->
<template>
  <el-form class="visibility-form" label-position="right" label-width="50px" :model="form">
    <el-form-item label="显示于：">
      <el-checkbox size="mini" @change="showChange" v-model="form.show">视图</el-checkbox>
    </el-form-item>
  </el-form>
</template>

<script>
import store from "@/store";

export default {
  name: "visibility",
  props: {
    entity: {
      type: Object,
      default: ()=>{}
    }
  },
  data(){

    return{
      form: {
        show:true
      }
    }
  },
  computed: {
    info(){
      return {
        id: this.entity.id,
        show: this.entity.show
      }
    }
  },
  watch:{
    info: {
      handler(){
        this.init()
      },
      immediate: true
    }
  },
  methods:{
    /** 初始化 */
    init(){
      this.form.id = this.entity.id
      this.form.show = this.entity.show
    },
    /** 显隐修改 */
    showChange(val) {
      this.$cesiumHelper.updateObjById(this.form.id, {show: val})
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
  }
}
</script>

<style lang="less" scoped>
.visibility-form {
  padding: 0 20px 0 10px;
  text-align: left;

  /deep/.el-checkbox {
    margin-left: 15px;
  }

  /deep/.el-checkbox__label {
    font-size: 12px;
  }

  /deep/.el-form-item{
    margin: 0;
  }

  /deep/.el-form-item__label{
    font-size: 12px;
    padding: 0;
  }
}
</style>
