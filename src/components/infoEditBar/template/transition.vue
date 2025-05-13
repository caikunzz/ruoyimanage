<!--
  过渡编辑框
-->
<template>
  <el-form
    class="transition-form"
    label-position="right"
    label-width="50px"
    :model="form"
  >
    <div class="transition-form-item-default">
      <div class="transition-default-radio-bar">
        <el-radio
          v-model="entity_camera_transition"
          @input="switchCameraTransition('default')"
          size="mini"
          label="default"
        >
          默认过渡
        </el-radio>
        <el-dropdown
          v-if="entity_camera_transition === 'default'"
          size="mini"
          trigger="click"
          @command="angleChange"
        >
          <span class="el-dropdown-link default-camera-edit">
            修改<i class="el-icon-edit el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="current">选择</el-dropdown-item>
            <el-dropdown-item command="previous">静止</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
      <div
        class="transition-form-item-content"
        v-if="entity_camera_transition === 'default'"
      >
        <el-form-item label="偏航角：">
          <el-input v-model="form.angle.head" size="mini"></el-input>
        </el-form-item>
        <el-form-item label="俯仰角：">
          <el-input v-model="form.angle.pitch" size="mini"></el-input>
        </el-form-item>
        <el-form-item label="翻滚角：">
          <el-input v-model="form.angle.roll" size="mini"></el-input>
        </el-form-item>
      </div>
    </div>
    <div class="transition-form-item-rotate">
      <el-radio
        v-model="entity_camera_transition"
        @input="switchCameraTransition('rotate')"
        size="mini"
        label="rotate"
      >
        绕点旋转
      </el-radio>
      <div
        class="transition-form-item-content"
        v-if="entity_camera_transition === 'rotate'"
      >
        <el-form-item label="中心点：">
          <el-input disabled size="mini" v-model="value"></el-input>
          <el-button
            type="warning"
            icon="el-icon-edit"
            circle
            size="mini"
            @click="setCenter"
          ></el-button>
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<script>
import store from "@/store";
import * as uuid from "@/utils/uuid";
export default {
  name: "transition",
  props: {
    entity: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      form: {
        id: null,
        angle: {
          head: null,
          pitch: null,
          roll: null,
        },
      },

      /** 摄像头过渡方式  default|rotate 默认过渡|绕点旋转 */
      entity_camera_transition: "default",

      /** 输入框值 */
      value: "点坐标",

      /** 绕点实体 */
      center: null,
    };
  },
  computed: {
    info() {
      return {
        id: this.entity.id,
        head: this.entity.angle.head,
        pitch: this.entity.angle.pitch,
        roll: this.entity.angle.roll,
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
      if (this.center) {
        this.$cesiumHelper.deleteObjById(this.center.id);
        this.center = null;
      }
      this.form.id = this.entity.id;
      this.form.type = this.entity.type;
      this.form.angle = {
        head: this.entity.angle.head,
        pitch: this.entity.angle.pitch,
        roll: this.entity.angle.roll,
      };
      if (this.entity.angle.look) {
        this.form.look = [...this.entity.angle.look];
        this.entity_camera_transition = "rotate";
        this.center = this.form.angle.look;
        this.$cesiumHelper.plotting.tagPlotting
          .showPlottingForData({
            id: uuid.uuid(),
            name: "中心点",
            show: true,
            position: this.form.angle.look,
            availability: store.state.cesium.availability,
          })
          .then(
            (entity) => (this.center = this.$cesiumHelper.getEntityInfo(entity))
          );
      } else {
        this.entity_camera_transition = "default";
      }
    },
    /** 更改相机过渡模式 */
    switchCameraTransition(type) {
      if (type === "default") {
        this.cleanCenter();
        const options = {
          head: this.form.angle.head,
          pitch: this.form.angle.pitch,
          roll: this.form.angle.roll,
        };
        this.$cesiumHelper.updateObjById(this.form.id, { angle: options });
        const cameraJson = this.$cesiumHelper.getEntityInfo(this.form.id);
        store.dispatch("updateEntitySource", cameraJson);
      } else if (type === "rotate") {
        // TODO
      }
    },
    /** 修改摄像机视角 */
    angleChange(val) {
      if (val === "current") {
        // 选用当前位置
        const attr = this.$cesiumHelper.camera.getCurrentCameraAttitude();
        const options = { position: attr.position, angle: attr.angle };
        this.$cesiumHelper.updateObjById(this.form.id, options);
      } else if (val === "previous") {
        // 复制上一位置
        const camera = this.$cesiumHelper.getEntityById(this.form.id);
        const previous = this.$cesiumHelper.camera.getPreviousCamera(camera);
        if (!previous) {
          this.$message.warning("未找到上一节点");
          return;
        }
        const cameraInfo = this.$cesiumHelper.getEntityInfo(previous);
        const position = [...cameraInfo.position];
        const angle = {
          head: cameraInfo.angle.head,
          pitch: cameraInfo.angle.pitch,
          roll: cameraInfo.angle.roll,
        };
        cameraInfo.look && (angle["look"] = [...camera.look]);
        const options = { position: position, angle: angle };
        this.$cesiumHelper.updateObjById(this.form.id, options);
      }
      const cameraJson = this.$cesiumHelper.getEntityInfo(this.form.id);
      store.dispatch("updateEntitySource", cameraJson);
      store.dispatch("setActivateEntity", cameraJson);
    },
    /** 设置中心点 */
    setCenter() {
      this.$cesiumHelper.plotting.tagPlotting.createTagPlot().then((entity) => {
        this.center = this.$cesiumHelper.getEntityInfo(entity);
        this.form.angle.look = [...this.center.position];
        const options = {
          head: this.form.angle.head,
          pitch: this.form.angle.pitch,
          roll: this.form.angle.roll,
          look: [...this.center.position],
        };
        this.$cesiumHelper.updateObjById(this.form.id, { angle: options });
        const cameraJson = this.$cesiumHelper.getEntityInfo(this.form.id);
        store.dispatch("updateEntitySource", cameraJson);
      });
    },
    /** 清理中心点 */
    cleanCenter() {
      if (this.center) {
        this.$cesiumHelper.deleteObjById(this.center.id);
        this.center = null;
      }
      delete this.form.angle.look;
    },
  },
  destroyed() {
    this.cleanCenter();
  },
};
</script>

<style lang="less" scoped>
.transition-form {
  padding: 0 20px 0 10px;
  text-align: left;

  /deep/.el-radio {
    color: red;

    .el-radio__inner {
      width: 12px;
      height: 12px;
    }

    .el-radio__label {
      font-size: 12px;
    }
  }

  .transition-default-radio-bar {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    line-height: 23px;
    height: 23px;
    /deep/.el-radio {
      line-height: 23px;
    }

    .default-camera-edit {
      font-size: 12px;
      cursor: pointer;
    }
  }

  .transition-form-item-content {
    margin: 10px 0;

    /deep/.el-form-item > .el-form-item__content {
      display: flex;
      flex-flow: row nowrap;
      flex-shrink: 0;

      > .el-button {
        margin-left: 15px;
        width: 30px;
        height: 30px;
        margin-top: 5px;
      }
    }
  }

  /deep/.el-form-item {
    margin: 0;
  }

  /deep/.el-form-item__label {
    font-size: 12px;
    padding: 0;
  }
}
</style>
