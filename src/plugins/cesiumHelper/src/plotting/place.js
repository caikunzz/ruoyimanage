import * as dateUtils from "../common/dateUtils";
import * as plottingUtils from "../common/plottingUtils";
import * as uuid from "../common/uuid";
import toolTips from "../common/reminderTip";
import * as entityRun from "@/plugins/cesiumHelper/src/common/entityRun";

const Cesium = window.Cesium;

/**
 * 地名标绘工具类
 *
 * 包含标绘任意地名等相关方法
 * @author: tzx
 * @date: 2023/8/18
 * */
class PlacePlotting {
  /** 视图 */
  viewer = null;

  /** 标会实体字典 */
  placeMap = null;

  /** 构造方法 */
  constructor(viewer) {
    this.viewer = viewer;
    this.placeMap = new Map();
  }

  /**
   * 创建地名标签
   *
   * @param options 相关参数
   * */
  createPlacePlotting(options) {
    return new Promise((res) => {
      const id = options?.id || uuid.uuid();
      const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      const toolTip = "左键单击拾取地理坐标";
      const name = options?.name || "未命名";
      const availability = dateUtils.iso8602TimesToJulianDate(
        options?.availability ||
          dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)
      );
      handler.setInputAction(async (event) => {
        let cartesian = plottingUtils.getCatesian3FromPX(
          this.viewer,
          event.position
        );
        const entity = this.viewer.entities.add({
          id: id,
          type: "place",
          data: options?.data,
          sort: options?.sort || 1,
          groupId: this.viewer.root.id,
          camp: options?.camp || 0,
          name: name,
          show:
            options?.show instanceof Array
              ? true
              : options?.show === undefined
              ? true
              : options.show,
          point: {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString("rgba(255,255,255,1)"),
            outlineColor: Cesium.Color.fromCssColorString("rgba(0,0,0,1)"),
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: name,
            font: "15px sans-serif",
            outline: true,
            outlineWidth: 5,
            scale: 1,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -25),
            show: true,
          },
          clampToGround: true,
          availability: availability,
          position: cartesian,
        });
        entity.label["data"] = { position: "top" };
        if (options?.show instanceof Array) {
          entity.point.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
          entity.label.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
        }
        this.placeMap.set(id, entity);
        this.viewer.resource.set(id, this.getPlaceToJson(entity));
        res(entity);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.setInputAction((event) => {
        toolTips(toolTip, event.endPosition, true);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      handler.setInputAction((event) => {
        toolTips(toolTip, event.endPosition, false);
        handler.destroy();
      }, Cesium.ScreenSpaceEventType.LEFT_UP);
    });
  }

  /**
   * 根据数据渲染标绘
   *
   * @param {*} options 相关参数
   * */
  showPlottingForData(options) {
    return new Promise((resolve, reject) => {
      const id = options.id || uuid.uuid();
      let entity = this.viewer.entities.getById(id);
      if (entity) {
        reject("该实体已经存在， 不能重复加载");
      } else {
        const font = options.material.text.italic
          ? "italic " +
            options.material.text.size +
            "px " +
            options.material.text.family
          : options.material.text.size + "px " + options.material.text.family;
        entity = this.viewer.entities.add({
          id: id,
          type: "place",
          data: options.data,
          sort: options.sort,
          groupId: options.groupId || this.viewer.root.id,
          camp: options.camp,
          name: options.name,
          show:
            options.show instanceof Array
              ? true
              : options.show === undefined
              ? true
              : options.show,
          point: {
            pixelSize: options.material.fill.size,
            color: Cesium.Color.fromCssColorString(options.material.fill.color),
            outlineColor: Cesium.Color.fromCssColorString(
              options.material.border.color
            ),
            outlineWidth: options.material.border.size,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: options.label,
            font: font,
            outline: true,
            outlineWidth: 5,
            fillColor: Cesium.Color.fromCssColorString(
              options.material.text.color
            ),
            outlineColor: Cesium.Color.fromCssColorString(
              options.material.text.outline
            ),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            backgroundPadding: new Cesium.Cartesian2(12, 8),
            scale: options.scale || 1,
            pixelOffset: this.getRelativePosition(
              options.material.text.position
            ),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            show: options.material.text.show,
          },
          availability: dateUtils.iso8602TimesToJulianDate(
            options.availability ||
              dateUtils.julianDateToIso8602Times(
                this.viewer.clock.currentTime,
                5
              )
          ),
          position: plottingUtils.latitudeAndLongitudeToDegrees(
            options.position
          ),
        });
      }
      if (options.show instanceof Array) {
        entity.point.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
        entity.label.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
      }
      if (options.animation !== undefined && options.animation != null) {
        entity.animation = entity.animation || {};
        // 闪烁
        if (options.animation.flicker) {
          entity.animation.flicker = options.animation.flicker;
          this.viewer.animations.get("flicker").set(entity.id, entity);
        }
      }
      entity.label["data"] = {
        position: options.material?.text?.position || "top",
      };
      this.placeMap.set(id, entity);
      this.viewer.resource.set(id, this.getPlaceToJson(entity));
      resolve(entity);
    });
  }

  editPlacePlotting(source, options) {
    // 修改 实体 名称
    "name" in options && (source.name = options.name);
    // 修改 实体 分组
    "groupId" in options && (source.groupId = options.groupId);
    // 修改字体内容
    "label" in options && (source.label.text = options.label);
    // 修改 实体文字 的比例
    "scale" in options && (source.label.scale = options.scale);
    // 修改 实体 阵营
    "camp" in options && (source.camp = options.camp);
    // 修改 实体 数据id
    "data" in options && (source.data = options.data);
    // 修改 实体 顺序
    "sort" in options && (source.sort = options.sort);
    // 修改可见性
    if ("show" in options) {
      if (options.show instanceof Array) {
        source.show = true;
        source.point.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
        source.label.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
      } else {
        source.show = options.show;
      }
    }
    // 修改样式
    if ("material" in options) {
      const material = options.material;
      const fontValue = source.label.font.getValue();
      const item = fontValue.split(" ");
      const size = parseFloat(item[item.length <= 2 ? 0 : 1]);
      const family = item[item.length - 1];
      // 文字
      if (material.text) {
        const text = material.text;
        // 颜色
        if (text.color)
          source.label.fillColor = Cesium.Color.fromCssColorString(text.color);
        // 尺寸
        if (text.size)
          source.label.font = fontValue.includes("italic")
            ? "italic" + " " + text.size + "px" + " " + family
            : text.size + "px" + " " + family;
        // 轮廓
        if (text.outline)
          source.label.outlineColor = Cesium.Color.fromCssColorString(
            text.outline
          );
        // 字体 family
        if (text.family)
          source.label.font = fontValue.includes("italic")
            ? "italic" + " " + size + "px" + " " + text.family
            : size + "px" + " " + text.family;
        // 加粗 weight
        /** 待补充 */
        if (text.position) {
          source.label.pixelOffset = this.getRelativePosition(text.position);
          source.label.data.position = text.position;
        }
        /** 待补充 */
        // 斜体 italic
        if (text.italic !== undefined && text.italic !== null)
          source.label.font = text.italic
            ? "italic " + source.label.font.getValue()
            : source.label.font.getValue().replace("italic", "").trim();
        // 显隐
        if (text.show !== undefined && text.show !== null)
          source.label.show = text.show;
      }
      // 背景
      if (material.fill) {
        const fill = material.fill;
        // 颜色
        if (fill.color)
          source.label.backgroundColor = Cesium.Color.fromCssColorString(
            fill.color
          );
        // 显示
        if (fill.show !== undefined && fill.show !== null)
          source.label.showBackground = fill.show;
      }
    }
    // 修改实体有效期
    if ("availability" in options) {
      source.availability.removeAll(); // 移除所有时间间隔
      source.availability = dateUtils.iso8602TimesToJulianDate(
        options.availability
      );
    }
    // 修改动画
    if (options.animation !== undefined && options.animation != null) {
      source.animation = source.animation || {};
      // 闪烁
      if (options.animation.flicker) {
        source.animation.flicker = options.animation.flicker;
        this.viewer.animations.get("flicker").set(source.id, source);
      } else {
        delete source.animation["flicker"];
        this.viewer.animations.get("flicker").delete(source.id);
      }
    }
    // 修改实体位置
    if ("position" in options) {
      if (options.position instanceof Array) {
        source.position = plottingUtils.latitudeAndLongitudeToDegrees(
          options.position
        );
      } else {
        source.position = entityRun.computedRunPoints(options);
      }
    }
    this.viewer.resource.set(source.id, this.getPlaceToJson(source));
  }

  /**
   * 获取 地标 Json数据
   * */
  getPlaceToJson(entity) {
    const { startTime, endTime } = dateUtils.availabilityToTimes(
      entity.availability
    );
    const temp = {
      id: entity.id,
      name: entity.name,
      type: "place",
      groupId: entity.groupId,
      camp: entity.camp || 0,
      data: entity.data || null,
      sort: entity.sort || null,
      startTime: startTime,
      endTime: endTime,
      show:
        entity.point.distanceDisplayCondition?.getValue() instanceof Object
          ? [...Object.values(entity.point.distanceDisplayCondition.getValue())]
          : entity.show,
      label: entity.label.text.getValue(),
      scale: entity.label.scale.getValue(),
      material: {
        fill: {
          size: entity.point.pixelSize.getValue(),
          color: this._colorFormat(entity.point.color.getValue()),
        },
        border: {
          size: entity.point.outlineWidth.getValue(),
          color: this._colorFormat(entity.point.outlineColor.getValue()),
        },
      },
    };
    const item = entity.label.font.getValue().split(" ");
    const sizeIndex = item.length <= 2 ? 0 : 1;
    const size = item[sizeIndex];
    const family = item[item.length - 1];
    temp.material.text = {
      color: this._colorFormat(entity.label.fillColor.getValue()),
      outline: this._colorFormat(entity.label.outlineColor.getValue()),
      size: parseFloat(size),
      family: family,
      weight: "normal",
      italic: entity.label.font.getValue().includes("italic"),
      position: entity.label.data.position,
      show: entity.label.show.getValue(),
    };
    if (entity.animation) {
      temp["animation"] = {};
      if (entity.animation.flicker)
        temp["animation"]["flicker"] = entity.animation.flicker;
    }
    temp["position"] =
      plottingUtils.degreesToLatitudeAndLongitude(
        entity.position?.getValue(Cesium.JulianDate.now())
      ) || null;
    return temp;
  }

  /**
   * 获取资源列表
   * */
  getPlaceToList() {
    const result = [];
    for (let [, value] of this.placeMap) {
      result.push(this.getPlaceToJson(value));
    }
    return result;
  }
  /**
   * 实体复制功能
   * */
  copyEntityAdd(entity) {
    return new Promise((resolve, reject) => {
      const pilaceJson = this.getPlaceToJson(entity);
      const camera = this.viewer.camera;
      const cameraHeight = camera.positionCartographic.height;
      pilaceJson.id = uuid.uuid();
      // 进行位置偏移
      let offset = {};
      offset.x = cameraHeight * 0.0000001;
      offset.y = cameraHeight * 0.0000001;
      pilaceJson.position[0] += offset.x;
      pilaceJson.position[1] += offset.y;
      pilaceJson.availability =
        dateUtils.parseDateToString(
          "yyyy-MM-ddTHH:mm:ssZ",
          new Date(pilaceJson.startTime)
        ) +
        "/" +
        dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", pilaceJson.endTime);
      this.showPlottingForData(pilaceJson).then(
        (entity) => {
          resolve(entity);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
  /**
   * 根据 id 删除元素
   *
   * @param {string} id 实体 id
   * */
  removeById(id) {
    this.viewer.entities.removeById(id);
    this.placeMap.delete(id);
    this.viewer.animations.values().forEach((item) => item.delete(id));
    this.viewer.resource.delete(id);
  }

  /**
   * 移除当前所有地标实体
   * */
  removeAll() {
    for (const [key] of this.placeMap) {
      this.removeById(key);
    }
  }

  /**
   * 计算偏移量
   * */
  getRelativePosition(position) {
    const positionText = {
      top: [0, -25],
      bottom: [0, 25],
      left: [-45, 0],
      right: [45, 0],
    };
    const po = positionText[position] || [0, -25];
    return new Cesium.Cartesian2(po[0], po[1]);
  }

  /**
   * 将从实体获取到的颜色进行格式化 "rgba(241,7,7,0.6)"
   * */
  _colorFormat(colorObj) {
    return `rgba(${colorObj.red * 255},${colorObj.green * 255},${
      colorObj.blue * 255
    },${colorObj.alpha})`;
  }
}

export default PlacePlotting;
