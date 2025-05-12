<!--
  运动编辑框
-->
<template>
  <div>
    <el-button style="width: 100%" v-if="!form.path" type="info" size="mini" @click="openPathConfig" plain>
      设置运动路线
    </el-button>
    <el-button style="width: 100%;margin-bottom: 10px" v-else type="info" size="mini" @click="cleanPathConfig"
               plain>取消运动路线
    </el-button>
    <el-form v-if="form.path" class="run-form" label-position="right" label-width="50px" :model="form">
      <div class="run-form-item-draw">
        <el-form-item v-for="(item, index) in form.path.data.draw" :key="index"
                      :label="index===0 ? '起点：' : index===form.path.data.draw.length-1 ? '终点：' : '路径：'">
          <div style="display: flex; align-items: center;">
            <el-input class="draw-point-input"
                      v-model="form.path.data.draw[index].name" size="mini">
              <el-button slot="append" icon="el-icon-close"
                         @click="removePathPoint(index, item.id)" :disabled="index === 0"></el-button>
            </el-input>
            <i class="el-icon-time" @click="setRunTime(index)" ></i>
          </div>
        </el-form-item>
        <el-form-item :label="form.path.data.draw.length===0 ? '起点：' : '路径：'">
          <el-button @click="addRunPath"  class="add-point" type="success"
                     size="mini" icon="el-icon-plus" circle></el-button>
        </el-form-item>
      </div>
      <!--      <div class="show-track">-->
      <!--        <el-form-item label="可见性：">-->
      <!--          <el-checkbox size="mini" v-model="form.path.tracks">轨迹展示</el-checkbox>-->
      <!--        </el-form-item>-->
      <!--      </div>-->
    </el-form>
    <el-dialog
        width="585px"
        title="路径设置"
        :modal="false"
        :close-on-click-modal="false"
        :visible.sync="pathTimePop"
        append-to-body>
      <el-form class="run-form" label-position="right" label-width="100px">
        <el-table
            size="mini"
            :data="tableData"
            :border="true"
        >
          <el-table-column
              label="运动时间"
              width="180">
            <template slot-scope="scope">
              <el-time-picker
                  class="picker-path-time"
                  style="width: 155px;display: inline-flex;align-items: flex-end;flex-wrap: wrap;justify-content: space-evenly;flex-direction: column"
                  size="mini"
                  @change="changPathTime(scope.row.date)"
                  :clearable="false"
                  is-range
                  v-model="scope.row.date"
                  range-separator="—"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  placeholder="选择时间范围"
                  :picker-options="{selectableRange: `${scope.row.date[1]?scope.row.date[1]+':00':'00:00:00'}-23:59:00,`}"
              ></el-time-picker>
            </template>
          </el-table-column>
          <el-table-column
              label="起始点"
              width="100">
            <template slot-scope="scope">
              <el-select v-model="scope.row.start" size="mini" @change="selectStartPoint(scope.$index)">
                <el-option v-for="item in pointOptions" :key="item.id" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column
              label="结束点"
              width="100">
            <template slot-scope="scope">
              <el-select v-model="scope.row.end" size="mini" @change="selectEndPoint(scope.$index)">
                <el-option v-for="item in pointOptions" :key="item.id" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column
              label="运动状态"
              width="78">
            <template slot-scope="scope">
              <el-checkbox @change="changRunState(scope.$index)" size="mini" style="font-size: 15px"
                           v-model="scope.row.state">运动
              </el-checkbox>
            </template>
          </el-table-column>
          <el-table-column
              label="添加"
              width="55">
            <template slot-scope="scope">
              <el-button style="margin-left: 5px" :disabled="isDisabled" @click="addRunPathPoints(scope.row)"
                         class="add-point"
                         size="mini" icon="el-icon-plus" circle></el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-form-item>
          <div style="display: flex;flex-flow: row nowrap;justify-content: flex-end;margin-top: 20px">
            <el-button size="mini" @click="cancelSubmission">取消</el-button>
            <el-button size="mini" @click="submitToDatabase">提交</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import * as plottingUtils from "@/plugins/cesiumHelper/src/common/plottingUtils";
import * as uuid from "@/utils/uuid";
import store from "@/store";



export default {
  name: "action",
  props: {
    entity: {
      type: Object,
      default: () => {
      }
    }
  },
  data() {
    return {
      pathTimePop: false,
      isDisabled: false,
      pathLine: null,
      editPoint: null,
      pointOptions: [],
      lineId: "",
      tableData: [{
        date: [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 0, 0, 5)],
        start: 0,
        end: 0,
        state: true,
      }],
      form: {
        id: "",
        path: null,
      },
      temp: {
        pathLine: []
      }
    }
  },
  computed: {
    info() {
      return {
        id: this.entity.id,
        path: this.entity.path,
        position: this.entity.position,
      }
    }
  },
  watch: {
    info: {
      handler() {
        this.init()
      },
      immediate: true
    }
  },
  methods: {
    /** 初始化 */
    init() {
      this.form.id = this.entity.id
      this.form.position = this.entity.position?.length ? {
        x: this.entity.position[0],
        y: this.entity.position[1],
        z: this.entity.position[2]
      } : {
        x: this.entity.position?.points[0][0],
        y: this.entity.position?.points[0][1],
        z: this.entity.position?.points[0][2]
      }
      // 如果有路径  则回显路径
      if (this.$cesiumHelper.plotting.routePlotting.showEntityPath(this.form.id)) this.showPathEdit();
      //切换编辑对象清除运动路线
      this.cleanPathEdit()
      this.form.path = null
    },
    /** 开启运动路线设置 */
    openPathConfig() {
      this.form.path && this.cleanPathConfig()
      const firstId = uuid.uuid()
      this.form.path = {
        type: null,
        data: {
          draw: [
            {id: firstId, name: "当前位置", point: [this.form.position.x, this.form.position.y, this.form.position.z]}
          ]
        },
        tracks: true
      }
      const entity = this.$cesiumHelper.getEntityById(this.form.id)
      entity.memory.path = this.form.path
    },
    /** 清空运动路线设置 */
    cleanPathConfig() {
      this.cleanPathEdit()
      this.form.path = null
      const entity = this.$cesiumHelper.getEntityById(this.form.id)
      entity.memory.path = null
      entity.position =  plottingUtils.latitudeAndLongitudeToDegrees(this.entity.position);
    },
    selectStartPoint() {
      this.controlAddButton()
    },
    selectEndPoint() {
      this.controlAddButton()
    },
    addRunPathPoints() {
      const pathLength = this.tableData.length;
      const lastTime = this.tableData[pathLength - 1].date;
      this.tableData.push({
        date: [lastTime[1], new Date(lastTime[1].getTime() + 5000)],
        start: this.tableData[pathLength - 1].end,
        end: this.editPoint.length - 1,
        state: true,
      })
      this.controlAddButton()
    },
    setRunTime(index) {
      if (index === 0 && this.form.path.data.draw.length < 2 ) return this.$message.info("1个路径点不支持设置时间！")
      this.pathTimePop = true
      this.pointOptions = this.form.path.data.draw.map((item, index) => {
        return {id: item.id, value: index, label: "点" + (index + 1)}
      })
      this.tableData[this.tableData.length - 1].end = this.editPoint.length - 1 //获取最后一个点的长度
    },
    changRunState(index) {
      if (this.tableData[index].state) {
        console.log(index)
      } else {
        this.tableData[index].end = this.tableData[index].start
        this.controlAddButton()
      }
    },
    //控制添加按钮是否可用
    controlAddButton() {
      if (this.tableData[this.tableData.length - 1].end === this.editPoint.length - 1) {
        this.isDisabled = true
      } else {
        this.isDisabled = false
      }
    },
    /** 添加绘制移动路线点 */
    addRunPath() {
      this.$cesiumHelper.plotting.tagPlotting.createTagPlot().then(async res => {
        const data = this.$cesiumHelper.getEntityInfo(res)
        this.temp.pathLine.forEach(item => this.$cesiumHelper.deleteObjById(item))
        this.temp.pathLine = []
        this.form.path.data.draw.push({id: data.id, name: data.name, point: data.position})
        const linePath = this.form.path.data.draw.map(item => item.point)
        const line = this.$cesiumHelper.plotting.routePlotting.createRoutePlotTest(linePath)
        this.temp.pathLine.push(line.id)
        this.pathLine = line.polyline.positions.getValue()  //路径点
        this.editPoint = linePath //路径生成点
        this.lineId = line.id
        this.controlAddButton()
        this.$message.info("请重新设置运动时间。")
      })
    },
    // /** 移除单个路径点 */
    removePathPoint(index, id) {
      this.$message.info("请重新设置运动时间。")
      let line = null
      this.form.path.data.draw.splice(index, 1)
      this.editPoint.splice(index, 1)
      this.$cesiumHelper.deleteObjById(id)
      this.temp.pathLine.forEach(item => this.$cesiumHelper.deleteObjById(item))
      if (index === 1) return //防止贝塞尔曲线报错
      line = this.$cesiumHelper.plotting.routePlotting.createRoutePlotTest(this.form.path.data.draw.map(item => item.point))
      line && this.temp.pathLine.push(line.id)
      this.pathLine = line.polyline.positions.getValue()  //路径点
    },
    /** 修改路线时间 */
    changPathTime(value) {
      console.log(value)
    },
    /** 加载回显运动路径 */
    showPathEdit() {
      const entity = this.$cesiumHelper.getEntityById(this.form.id)
      entity.memory.path.data.draw.forEach(tag=>{
        const options = {
          id:tag.id,
          name:tag.name,
          position:tag.point,
          // availability:
        }
        this.$cesiumHelper.plotting.tagPlotting.showPlottingForData(options).then(res=>{
          // this.form.path.data.draw.push({id: res.id, name: res.name, point: res.position})
          console.log(res)
        })
      })
      this.form.path = entity.memory.path
      const line = this.$cesiumHelper.plotting.routePlotting.createRoutePlotTest(entity.memory.path.data.draw.map(item => item.point))
      this.temp.pathLine.push(line.id)
    },
    /** 清除路径点编辑记录 */
    cleanPathEdit() {
      if (this.form.path) {
        this.form.path.data.draw.forEach(item => this.$cesiumHelper.deleteObjById(item.id))
        this.temp.pathLine.forEach(item => this.$cesiumHelper.deleteObjById(item))
        this.temp.pathLine = []
      }
    },
    generateIso8601StartTime(time) {
      // 将时间字符串解析为Date对象
      const inputDate = new Date(time);
      // 获取Date对象的时间戳
      const timestamp = inputDate.getTime();
      // 调整时区差异（这里假设要从 GMT+0800 调整到 GMT+0000，即加上8小时减去一个月）
      const adjustedTimestamp = timestamp + 8 * 60 * 60 * 1000;

      // 创建新的Date对象，使用调整后的时间戳
      const adjustedDate = new Date(adjustedTimestamp);
      // 获取Date对象的ISO 8601格式时间字符串
      return adjustedDate.toISOString()
    },
    submitToDatabase() {
      this.tableData.forEach((data) => {
        data.startTime = this.generateIso8601StartTime(data.date[0])
        data.endTime = this.generateIso8601StartTime(data.date[1])
      })
      const options = {
        path: this.pathLine,
        type: "draw",
        editPoint: this.editPoint.map(point => plottingUtils.latitudeAndLongitudeToDegrees(point)),
        tablePath: this.tableData,
      }
      console.log(options)
      // this.$cesiumHelper.plotting.routePlotting.changeAvailability({
      //   id: this.lineId,
      //   startTime: this.tableData[0].startTime,
      //   endTime: this.tableData[this.tableData.length - 1].endTime
      // })
      // this.$cesiumHelper.plotting.routePlotting.changeAvailability({
      //   id: this.form.id,
      //   startTime: this.tableData[0].startTime,
      //   endTime: this.tableData[this.tableData.length - 1].endTime
      // })
      // this.form.path.data.draw.forEach((tag, index) => {
      //   if (index == 0) return
      //   this.$cesiumHelper.plotting.routePlotting.changeAvailability({
      //     id: tag.id,
      //     startTime: this.tableData[0].startTime,
      //     endTime: this.tableData[this.tableData.length - 1].endTime
      //   })
      // })
      const path = this.$cesiumHelper.plotting.routePlotting.handlePathData(options)
      this.$cesiumHelper.plotting.routePlotting.bindRunPath(this.$cesiumHelper.getEntityById(this.form.id), path)
      this.pathTimePop = false
      //更新运动实体编辑栏长度
      const info = this.$cesiumHelper.getEntityInfo(this.form.id)
      store.dispatch("updateEntitySource", info)
    },
    cancelSubmission() {
      this.pathTimePop = false
    },
  },
  beforeDestroy() {
    this.cleanPathEdit()
  }
}
</script>

<style lang="less" scoped>
.run-form {
  padding: 0 20px 0 10px;
  text-align: left;
  .el-icon-time {
    font-size: 16px;
    margin-right: -20px;
    cursor: pointer;
  }
  .el-radio {

    color: red;

    .el-radio__inner {
      width: 120px;
      height: 12px;
    }

    .el-radio__label {
      font-size: 12px !important;
    }
  }
  .multiple-point-input,
  .draw-point-input {
    width: 130px;
    padding: 0 15px;
    margin-top: 6px;

    .el-input-group__append {
      padding: 0 10px;
    }
  }

  .plan-point-input {
    padding: 0 15px;
  }
  .add-point {
    font-size: 12px;
    margin-left: 15px;
  }

  .show-track {
    .el-checkbox {
      margin-left: 15px;

      .el-checkbox__label {
        font-size: 12px;
      }
    }
  }

  /deep/ .el-form-item {
    margin: 0;

    .el-form-item__label {
      font-size: 12px;
      padding: 0;
    }
  }

  /deep/ .el-checkbox__label {
    font-size: 12px;
  }

  .el-input-group__append .el-button,
  .el-input-group__append .el-select,
  .el-input-group__prepend .el-button,
  .el-input-group__prepend .el-select {
    margin: -10px -27px;
  }
}
</style>
