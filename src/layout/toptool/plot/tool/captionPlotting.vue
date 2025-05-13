<template>
  <!--  字幕编辑弹出框  -->
  <el-dialog
    custom-class="caption-out-dialog"
    title="字 幕 管 理"
    width="800px"
    append-to-body
    :visible.sync="outDialogFormVisible"
    :modal="false"
  >
    <div class="caption-out-header">
      <div class="btn-group">
        <el-button size="mini" plain type="warning" @click="openInnerDialog"
          >添加</el-button
        >
        <el-button size="mini" plain type="danger">删除</el-button>
      </div>
      <el-input
        size="mini"
        style="width: 150px"
        placeholder="请输入内容"
        prefix-icon="el-icon-search"
        v-model="search"
      >
      </el-input>
    </div>
    <el-table size="mini" :data="tableData" height="400px" style="width: 100%">
      <el-table-column label="序号" type="index" width="55px" align="center">
      </el-table-column>
      <el-table-column
        label="名称"
        prop="name"
        show-overflow-tooltip
        width="70px"
      >
      </el-table-column>
      <el-table-column
        label="内容"
        prop="label"
        show-overflow-tooltip
        width="120px"
      >
      </el-table-column>
      <el-table-column label="时间" width="140px">
        <template slot-scope="scope">
          {{ scope.row.startTime.split(" ")[1] }}
          至
          {{ scope.row.endTime.split(" ")[1] }}
        </template>
      </el-table-column>
      <el-table-column label="朗读" width="250px" prop="reference">
        <template slot-scope="scope">
          <audio
            v-if="scope.row.references"
            class="audio-control"
            :src="scope.row.references"
            controls="controls"
          ></audio>
          <el-button v-else size="mini" type="text">无</el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120px">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="editInnerDialog(scope.row)"
            >编辑</el-button
          >
          <el-button size="mini" type="text" @click="delCaption(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--  字幕编辑弹出框  -->
    <el-dialog
      custom-class="caption-inner-dialog"
      title="字幕编辑"
      width="400px"
      append-to-body
      @close="openOutDialog"
      :modal="false"
      :visible.sync="innerDialogFormVisible"
    >
      <el-form size="mini" :model="form" label-position="right">
        <el-form-item label="字幕时间：" label-width="90px">
          <div class="times-set">
            <el-time-picker
              is-range
              v-model="form.times"
              range-separator="至"
              start-placeholder="出现时间"
              end-placeholder="消失时间"
              size="mini"
            >
            </el-time-picker>
            <el-button
              @click="computeAudioTime"
              type="primary"
              :loading="autoLoading"
              :disabled="form.label.length === 0"
              size="mini"
              >自动</el-button
            >
          </div>
        </el-form-item>
        <el-form-item label="字幕内容：" label-width="90px">
          <el-input
            size="mini"
            style="width: 100%"
            type="textarea"
            :rows="2"
            v-model="form.label"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeInnerDialog" size="mini">取 消</el-button>
        <el-button
          type="primary"
          :loading="confirmLoading"
          @click="submitCaption"
          size="mini"
          >添 加</el-button
        >
      </div>
    </el-dialog>
    <div slot="footer" class="dialog-footer">
      <el-button size="mini" @click="closeOutDialog">取 消</el-button>
      <el-button type="primary" @click="closeOutDialog" size="mini"
        >确 定</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import store from "@/store";
import dateUtils from "@/utils/dateUtils";
import * as speechApi from "@/api/cesium/speech";

export default {
  name: "captionPlotting",
  data() {
    return {
      search: "",
      outDialogFormVisible: false,
      innerDialogFormVisible: false,
      autoLoading: false,
      confirmLoading: false,
      form: {
        id: null,
        times: [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 0, 0, 5)],
        label: "",
      },
    };
  },
  computed: {
    tableData() {
      return store.getters.entities
        .filter(
          (p) =>
            p.name &&
            p.name.indexOf(this.search) !== -1 &&
            p.type === "captions"
        )
        .map((item) => {
          return {
            id: item.id,
            name: item.name,
            label: item.label,
            references: item.references,
            startTime: item.startTime,
            endTime: item.endTime,
          };
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    },
  },
  methods: {
    openOutDialog() {
      this.outDialogFormVisible = true;
    },
    closeOutDialog() {
      this.outDialogFormVisible = false;
    },
    openInnerDialog() {
      const startTime = new Date(
        store.state.cesium.currentTime.replace("T", " ").replace("Z", "")
      );
      this.form.id = null;
      this.form.times = [startTime, dateUtils.addSecond(startTime, 5)];
      this.outDialogFormVisible = false;
      this.innerDialogFormVisible = true;
    },
    editInnerDialog(row) {
      const startTime = new Date(row.startTime);
      const endTime = new Date(row.endTime);
      this.form.id = row.id;
      this.form.label = row.label;
      this.form.times = [startTime, endTime];
      this.outDialogFormVisible = false;
      this.innerDialogFormVisible = true;
    },
    closeInnerDialog() {
      this.form.label = "";
      this.form.times = [
        new Date(2000, 0, 1, 0, 0, 0),
        new Date(2000, 0, 1, 0, 0, 5),
      ];
      this.innerDialogFormVisible = false;
    },
    /** 添加字幕 */
    submitCaption() {
      const times =
        dateUtils.parseDateToString(
          "yyyy-MM-ddTHH:mm:ssZ",
          this.form.times[0]
        ) +
        "/" +
        dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", this.form.times[1]);
      const options = {
        label: this.form.label,
        availability: times,
        show: true,
      };
      this.confirmLoading = true;
      this.textToAudio(options.label).then((url) => {
        options["references"] = url;
        if (this.form.id) {
          this.$cesiumHelper.updateObjById(this.form.id, options);
          const info = this.$cesiumHelper.getEntityInfo(this.form.id);
          store.dispatch("updateEntitySource", info);
          this.confirmLoading = false;
          this.closeInnerDialog();
        } else {
          this.$cesiumHelper.captions.addCaptions(options).then((entity) => {
            const info = this.$cesiumHelper.getEntityInfo(entity);
            store.dispatch("addEntitySource", info);
            this.confirmLoading = false;
            this.closeInnerDialog();
          });
        }
      });
    },
    /** 删除标签 */
    delCaption(row) {
      this.$confirm("确定删除该字幕？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$cesiumHelper.deleteObjById(row.id);
          store.dispatch("removeEntitySource", row.id);
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },

    /** 文本转语音 */
    textToAudio(text) {
      return speechApi.tts(text);
    },

    /** 根据字幕内容计算时间 */
    computeAudioTime() {
      this.autoLoading = true;
      const text = this.form.label;
      const startTime = this.form.times[0];
      this.textToAudio(text).then((url) => {
        const dom = document.createElement("audio");
        dom.src = url;
        this.autoLoading = false;
        dom.oncanplay = () => {
          const distance = Math.round(dom.duration);
          const endTime = dateUtils.addSecond(startTime, distance);
          this.form.times = [startTime, endTime];
          dom.remove();
        };
      });
    },
  },
};
</script>

<style scoped lang="less">
.el-dialog__wrapper {
  /deep/.el-dialog {
    .el-dialog__header {
      text-align: center;
      .el-dialog__title {
        font-size: 14px;
      }
    }
    .el-dialog__body {
      padding: 20px 20px 0 20px;

      .el-table {
        margin-top: 10px;

        .el-table__row {
          height: 42px;
          line-height: 42px;
        }
      }

      .el-form {
        .times-set {
          display: flex;
          flex-flow: row nowrap;
          justify-content: flex-start;

          .el-date-editor {
            width: 200px;
          }
          .el-button {
            margin-left: 10px;
          }
        }
        .el-form-item {
          .el-form-item__label {
            font-size: 12px;
          }
        }
      }

      .caption-out-header {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
      }
      .audio-control {
        height: 25px;
        width: 230px;
        margin-top: 5px;
      }
      .btn-group {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;

        .el-button {
          font-size: 12px;
          border-radius: 0;
        }
      }
    }
  }
}
</style>
