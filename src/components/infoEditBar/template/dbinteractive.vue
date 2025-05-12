<!--数据交互组件-->
<template>
  <el-form class="db-interactive-form" ref="ruleForm" label-position="left" label-width="45px" :model="form" :rules="rules">
    <el-form-item label="隶属：" prop="parentCode">
      <el-autocomplete
          v-model="parentName"
          popper-class="city-autocomplete-popper"
          :fetch-suggestions="querySearchAsync"
          placeholder="请输入内容"
          :trigger-on-focus="false"
          size="mini"
          @select="handleSelect"
      ></el-autocomplete>
    </el-form-item>
    <el-form-item label="简写：" prop="shortName">
      <el-input v-model="form.shortName" size="mini" placeholder="请输入实体名称"></el-input>
    </el-form-item>
    <el-form-item label="排序：" prop="sort">
      <el-input-number style="width: 100%" v-model="form.sort" :min="1" :max="30" size="mini" placeholder="请输入城市顺序"></el-input-number>
    </el-form-item>
    <el-form-item style="text-align: right">
      <el-button style="width: 100%" v-if="state==='create'" size="mini" type="success" @click="insertPlace" plain>新建</el-button>
      <el-button style="width: 100%" v-else size="mini" type="success" @click="updatePlace" plain>更新</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import * as gisInfoApi from "@/api/cesium/gisInfo"
import * as baseSourceApi from "@/api/cesium/gisInfo";
import * as uuid from "@/utils/uuid"
export default {
  name: "dbInteractive",
  props: {
    entity: {
      type: Object,
      default: ()=>{}
    }
  },
  data(){
    return{

      /** 城市详细信息 */
      form: {},

      /** 交互状态 编辑 or 新建 */
      state: "create",

      /** 上级城市名称 */
      parentName: "",

      /** 地名编辑规则 */
      rules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' },
        ],
        lng: [
          { required: true, message: '请输入经度', trigger: 'blur' },
        ],
        lat: [
          { required: true, message: '请输入纬度', trigger: 'blur' },
        ],
        parentCode: [
          { required: true, message: '请输入父级节点', trigger: 'blur' },
        ],
        shortName: [
          { required: true, message: '请输入简写名称', trigger: 'blur' },
        ],
        sort: [
          { required: true, message: '请输入城市排序', trigger: 'blur' },
        ]
      }
    }
  },
  computed: {
    info(){
      return {
        id: this.entity.id,
        dataId: this.entity.dataId,
        name: this.entity.name,
        camp: this.entity.camp
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
    /** 搜索上级城市资源 */
    querySearchAsync(queryString, cb) {
      baseSourceApi.queryCityLike(queryString).then(searchValue => {
        cb(searchValue.data)
      })
    },
    /** 选中上级城市 */
    handleSelect(val){
      this.form.parentCode = val.code
      this.parentName = val.name
    },
    /** 初始化 */
    init(){
      this.form.id = this.entity.id
      this.form.dataId = this.entity.dataId
      this.form.name = this.entity.name
      this.form.type = this.entity.type
      this.getCityInfo()
    },
    /** 获取城市信息 */
    async getCityInfo() {
      // 如果其id是数字 那么则校验是否来自数据库
      gisInfoApi.queryCityById(this.form.id).then(place => {
        if (place.data){
          this.form.code = place.data.code
          this.form.shortName = place.data.shortName
          this.form.parentCode = place.data.parentCode
          this.form.sort = place.data.sort
          // 补全上级地名信息
          gisInfoApi.queryCityByCode(place.data.parentCode).then(parentCity => {
            this.parentName = parentCity.data?.name || "无"
          })
          this.state = "edit"
        } else {
          this.state = "create"
          this.form.code = uuid.uuid()
          this.form.parentCode = "0"
          this.form.sort = 1
          this.parentName = "无"
        }
      })
    },

    /** 创建地名信息 */
    insertPlace(){
      // 查询 VueX 更新数据
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      this.form.name = info.name
      this.form.lng = this.entity.position[0].toFixed(6)
      this.form.lat = this.entity.position[1].toFixed(6)
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          gisInfoApi.insertCity(this.form).then(res=>{
            if (res.code === 200){
              this.$message.success("创建成功")
              this.getCityInfo()
            }
          }, ()=>{})
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },

    /** 更新地名信息 */
    updatePlace(){

    }
  }
}
</script>

<style scoped lang="less">
.db-interactive-form {
  padding: 0 20px;

  .place-db-btn{
    text-align: right;
    width: 100%;
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
<style>
.city-autocomplete-popper {
  width: unset !important;
  min-width: 190px;
}
</style>
