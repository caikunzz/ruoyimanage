<template>
  <el-form class="times-form" label-position="left" label-width="40px" :model="form">
    <el-form-item v-if="supports.times.indexOf('**') !== -1 || supports.times.indexOf(form.type) !== -1 || supports.times.indexOf(form.geoType) !== -1 "  label="开始：">
      <el-time-picker
          v-model="form.startTime"
          style="width: 100%"
          size="mini"
          placeholder="开始时间"
          @change="timeChange">
      </el-time-picker>
    </el-form-item>
    <el-form-item label="结束：" v-if="supports.times.indexOf('**') !== -1 || supports.times.indexOf(form.type) !== -1 || supports.times.indexOf(form.geoType) !== -1 " >
      <el-time-picker
          :disabled="form.type==='group'"
          arrow-control
          style="width: 100%"
          v-model="form.endTime"
          placeholder="结束时间"
          size="mini"
          @change="timeChange">
      </el-time-picker>
    </el-form-item>
  </el-form>
</template>

<script>

import dateUtils from "@/utils/dateUtils";
import store from "@/store";

export default {
  name: "",
  data() {
    return {
      supports: {
        times: ["group", "root"]
      },
      form: {
        id: null,
        type: null,
        startTime: null,
        endTime: null
      }
    }
  },
  props: {
    entity: {
      type: Object,
      default: () => {
      }
    }
  },
  computed: {
    info() {
      return {
        id: this.entity.id,
        type: this.entity.type,
        startTime: this.entity.startTime,
        endTime: this.entity.endTime
      }
    }
  },
  watch: {
    info: {
      handler() {
        this.init()
      }, immediate: true
    }
  },
  methods: {
    /** 初始化 */
    init() {
      this.form.id = this.entity.id
      this.form.type = this.entity.type
      this.form.startTime = new Date(this.entity.startTime)
      this.form.endTime = new Date(this.entity.endTime)
    },
    /** 时间修改 */
    timeChange() {
      if (this.form.type === "group"){
        const distance = dateUtils.dateDifference(new Date(this.entity.startTime), this.form.startTime)
        this.form.endTime = dateUtils.addSecond(this.form.endTime, distance)
      }
      const availability = dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", this.form.startTime) + "/" + dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", this.form.endTime)
      const options = {availability: availability}
      this.$cesiumHelper.updateObjById(this.form.id, options)
      if (this.form.type === "group"){
        const children = this.$cesiumHelper.group.export(this.form.id)
        store.dispatch("updateEntitySource", children)
      } else {
        const info = this.$cesiumHelper.getEntityInfo(this.form.id)
        store.dispatch("updateEntitySource", info)
      }
    }
  }
}

</script>

<style scoped lang="less">
.times-form {
  padding: 0 20px;

  /deep/ .el-form-item {
    margin: 0;
  }

  /deep/ .el-form-item__label {
    font-size: 12px;
    padding: 0;
  }
}
</style>
