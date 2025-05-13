<!--
  快捷操作栏
-->
<template>
  <div class="quick-btn-group">
    <el-button
      v-if="
        supports.delete.indexOf('**') !== -1 ||
        supports.delete.indexOf(form.type) !== -1 ||
        supports.delete.indexOf(form.geoType) !== -1
      "
      type="info"
      size="mini"
      @click="removeEntity"
      plain
      >删除实体</el-button
    >
    <el-button
      v-if="
        supports.export.indexOf('**') !== -1 ||
        supports.export.indexOf(form.type) !== -1 ||
        supports.export.indexOf(form.geoType) !== -1
      "
      type="info"
      size="mini"
      plain
      >导出JSON</el-button
    >
  </div>
</template>

<script>
import store from "@/store";
import * as speechApi from "@/api/cesium/speech";
import * as gisInfoApi from "@/api/cesium/gisInfo";

export default {
  name: "quick",
  props: {
    entity: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      supports: {
        delete: ["**"],
        export: ["**"],
      },

      form: {},
    };
  },
  computed: {
    info() {
      return {
        id: this.entity.id,
        type: this.entity.type,
        label: this.entity.label,
        startTime: this.entity.startTime,
        endTime: this.entity.endTime,
      };
    },
  },
  watch: {
    info: {
      handler() {
        this.init();
      },
      immediate: true,
    },
  },
  methods: {
    /** 初始化 */
    init() {
      this.form.id = this.entity.id;
      this.form.type = this.entity.type;
      this.form.label = this.entity.label;
      this.form.startTime = this.entity.startTime;
      this.form.endTime = this.entity.endTime;
    },
    /** 删除实体 */
    removeEntity() {
      this.$cesiumHelper.deleteObjById(this.form.id);
      store.dispatch("removeEntitySource", this.form.id);
      this.close();
    },
    /** 文本转语音 */
    textToAudio() {
      this.$confirm("确定根据该字幕文字生成对应音频?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          const text = this.form.label;
          const url = await speechApi.tts(text);
          const options = {
            name: text,
            references: url,
            availability:
              this.form.startTime.replace(" ", "T") +
              "Z/" +
              this.form.endTime.replace(" ", "T") +
              "Z",
          };
          const entity = await this.$cesiumHelper.audio.addAudio(options);
          const info = this.$cesiumHelper.audio.getAudioToJson(entity);
          await store.dispatch("addEntitySource", info);
          this.$message({
            type: "success",
            message: "操作成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "取消生成",
          });
        });
    },
    /** 插入地名到数据库 */
    insertCityDB() {
      const data = {
        name: this.entity.name,
        shortName: this.entity.shortName,
        lng: this.entity.position[0],
        lat: this.entity.position[1],
        sort: 1,
      };
      gisInfoApi.insertCity(data).then((place) => {
        // 删除原有的地名实体 更改其 id 重新生成
        const copy = JSON.parse(JSON.stringify(this.entity));
        this.$cesiumHelper.deleteObjById(this.entity.id);
        store.dispatch("removeEntitySource", this.entity.id);

        copy.id = place.id;
        this.$cesiumHelper.loadSourceFromJson([copy]).then((entity) => {
          const info = this.$cesiumHelper.getEntityInfo(entity);
          store.dispatch("addEntitySource", info);
          store.dispatch("setActivateEntity", info);
        });
      });
    },
  },
};
</script>

<style lang="less" scoped>
.quick-btn-group {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  padding: 0 20px;

  .el-button {
    width: 90px;
    margin-bottom: 10px;
  }

  .el-button:nth-child(2n + 1) {
    margin-left: 0;
  }
}

.el-form-item {
  margin: 0;

  .el-form-item__label {
    font-size: 12px;
    padding: 0;
  }
}
</style>
