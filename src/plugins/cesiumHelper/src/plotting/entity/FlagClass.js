import * as plottingUtils from "../../common/plottingUtils";
import toolTips from "../../common/reminderTip";
import * as uuid from "../../common/uuid";
import * as dateUtils from "../../common/dateUtils";
import * as entityRun from "../../common/entityRun";

const Cesium = window.Cesium;

/**
 * 创建图片旗帜标绘类
 */
class FlagClass {
  viewer = null;
  source = {};

  constructor(viewer) {
    this.viewer = viewer;
  }

  /**
   * 创建图片旗帜标绘
   * @param  [options]  相关参数
   */
  createFlag(options) {
    return new Promise((res, rej) => {
      const id = options?.id || uuid.uuid();
      const name = options?.name || "旗帜";
      const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      const toolTip = "选择旗帜位置, 按ESC取消标绘";
      handler.setInputAction((event) => {
        let pixPos = event.position;
        const cartesian = plottingUtils.getCatesian3FromPX(this.viewer, pixPos);
        const flagCanvas = this.createFlagMaterial(
          name,
          options.textColor,
          options.backgroundColor,
          options.borderColor
        );
        const entity = this.viewer.entities.add({
          id: id,
          GeoType: "Flag",
          type: "situation",
          groupId: this.viewer.root.id,
          data: options.data,
          sort: options.sort || 1,
          flag: {
            text: name,
            borderColor: options.borderColor,
            textColor: options.textColor,
            backgroundColor: options.backgroundColor,
          },
          material: {
            trackLine: {},
          },
          memory: {},
          availability: dateUtils.iso8602TimesToJulianDate(
            options?.availability ||
              dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)
          ),
          position: cartesian,
          billboard: {
            image: flagCanvas.src,
            pixelOffset: new Cesium.Cartesian2(35, 10),
            colorBlendMode: Cesium.ColorBlendMode.REPLACE, // 使用材质的颜色属性替换实体颜色属性
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 设置图片垂直方向的原点在底部
          },
        });
        toolTips(toolTip, event.endPosition, false);
        handler.destroy();
        if (options?.show instanceof Array) {
          entity.billboard.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
        }
        document.removeEventListener("keydown", cancel);
        res(entity);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.setInputAction((event) => {
        toolTips(toolTip, event.endPosition, true);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      const cancel = (e) => {
        if (e.key === "Escape") {
          this.viewer.entities.removeById(id);
          handler.destroy();
          toolTips(window.toolTip, null, false);
          document.removeEventListener("keydown", cancel);
          rej("取消标绘");
        }
      };
      document.addEventListener("keydown", cancel);
    });
  }

  /**
   * 编辑图片旗帜样式
   * @param {*} source  实体
   * @param [options]  相关参数
   */
  editFlagData(source, options) {
    // 修改 实体 名称
    "name" in options && this._changName(source, options);
    // 修改 实体 分组
    "groupId" in options && (source.groupId = options.groupId);
    // 修改 实体 数据id
    "data" in options && (source.data = options.data);
    // 修改 实体 顺序
    "sort" in options && (source.sort = options.sort);
    //控制实体显隐
    if ("show" in options) {
      if (options.show instanceof Array) {
        source.show = true;
        source.billboard.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
      } else {
        source.show = options.show;
      }
    }
    //根据阵营修改颜色
    if ("camp" in options) {
      source.camp = options.camp;
      const tc =
        options.camp === 0
          ? "rgba(255, 255, 0, 1)"
          : options.camp === 1
          ? "rgba(255, 255, 255, 1)"
          : "rgba(0, 255, 255, 1)";
      const bc =
        options.camp === 0
          ? "rgba(255, 0, 0, 1)"
          : options.camp === 1
          ? "rgba(0, 0, 255, 1)"
          : "rgba(0, 255, 0, 1)";
      const fc =
        options.camp === 0
          ? "rgba(255, 0, 0, .4)"
          : options.camp === 1
          ? "rgba(0, 0, 255, .4)"
          : "rgba(0, 255, 0, .4)";
      source.flag.borderColor = bc;
      source.flag.textColor = tc;
      source.flag.backgroundColor = fc;
      source.billboard.image = this.createFlagMaterial(
        source.flag.text,
        tc,
        fc,
        bc
      ).src;
    }
    // 修改实体有效期
    if (options.availability) {
      source.availability.removeAll(); // 移除所有时间间隔
      source.availability = dateUtils.iso8602TimesToJulianDate(
        options.availability
      );
    }
    // 修改材质
    if (options.material) {
      const material = options.material;
      // 边框
      if (material.border) {
        const border = material.border;
        // 边框颜色
        if (border.color) {
          source.flag.borderColor = border.color;
          source.billboard.image = this.createFlagMaterial(
            source.flag.text,
            source.flag.textColor,
            source.flag.backgroundColor,
            border.color
          ).src;
        }
      }
      // 填充
      if (material.fill) {
        const fill = material.fill;
        // 填充颜色
        if (fill.color) {
          source.flag.backgroundColor = fill.color;
          source.billboard.image = this.createFlagMaterial(
            source.flag.text,
            source.flag.textColor,
            fill.color,
            source.flag.borderColor
          ).src;
        }
      }
      // 文字
      if (material.text) {
        const text = material.text;
        source.flag.textColor = text.color;
        source.billboard.image = this.createFlagMaterial(
          source.flag.text,
          text.color,
          source.flag.backgroundColor,
          source.flag.borderColor
        ).src;
      }
      // 航迹线
      if (material.trackLine) {
        source.material.trackLine =
          options.material.trackLine || source.material.trackLine;
        source.material.polyline.width = options.material.trackLine.width || 2;
        source.polyline.color =
          Cesium.Color.fromCssColorString(options.material.trackLine.color) ||
          "rgba(255,0,0,1)";
      }
    }
    //修改动画时间
    if (options.animation !== undefined && options.animation != null) {
      source.animation = source.animation || {};
      if (options.animation.flicker) {
        source.animation.flicker = options.animation.flicker;
        this.viewer.animations.get("flicker").set(source.id, source);
      } else {
        delete source.animation["flicker"];
        this.viewer.animations.get("flicker").delete(source.id);
      }
      //雷达
      if (
        options.animation.radar !== undefined &&
        options.animation.radar !== null
      ) {
        source.animation.radar = options.animation.radar;
        const entity = this.createRadar(source);
        entity.ellipse.show = options.animation.radar;
        if (!options.animation.radar) {
          source.ellipse.semiMinorAxis =
            this.viewer.camera.positionCartographic.height / 12;
          source.ellipse.semiMajorAxis =
            this.viewer.camera.positionCartographic.height / 12;
        }
        // TODO 是否需要加入到 viewer[animation][radar]
      } else {
        delete source.animation["radar"];
        // TODO 如果加入到字典中这里要删除
      }
      //空间扩散（波纹）
      if (
        options.animation.ripple !== undefined &&
        options.animation.ripple !== null
      ) {
        source.animation.ripple = options.animation.ripple;
        const entity = this.createRipple(source);
        entity.ellipse.show = options.animation.ripple;
        if (!options.animation.ripple) {
          source.ellipse.semiMinorAxis =
            this.viewer.camera.positionCartographic.height / 12;
          source.ellipse.semiMajorAxis =
            this.viewer.camera.positionCartographic.height / 12;
        }
        // TODO 是否需要加入到 viewer[animation][radar]
      } else {
        delete source.animation["ripple"];
        // TODO 如果加入到字典中这里要删除
      }
      // 修改航迹线
      if (options.animation.trackLine) {
        source.material.trackLine = {};
        source.material.trackLine.style = "solid";
        source.material.trackLine.color = "rgba(255,0,0,1)";
        source.material.trackLine.width = 3;
        source.animation.trackLine = options.animation.trackLine;
        this.viewer.animations.get("trackLine").set(source.id, source);
      } else {
        delete source.animation["trackLine"];
        this.viewer.animations.get("trackLine").delete(source.id);
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
    this.viewer.resource.set(source.id, this.getFlagJson(source));
  }

  copyFlagToJson(entity) {
    const plottingJson = this.getFlagJson(entity);
    const camera = this.viewer.camera;
    const cameraHeight = camera.positionCartographic.height;
    // 进行位置偏移
    let offset = {};
    offset.x = cameraHeight * 0.0000001;
    offset.y = cameraHeight * 0.0000001;
    plottingJson.position[0] += offset.x;
    plottingJson.position[1] += offset.y;
    plottingJson.id = uuid.uuid();
    plottingJson.availability =
      dateUtils.parseDateToString(
        "yyyy-MM-ddTHH:mm:ssZ",
        new Date(plottingJson.startTime)
      ) +
      "/" +
      dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", plottingJson.endTime);
    return plottingJson;
  }

  showFlag(options) {
    return new Promise((resolve, reject) => {
      let entity = this.viewer.entities.getById(options.id);
      if (entity) {
        reject(entity);
        console.log("该实体已经存在， 不能重复加载");
      } else {
        // 判断 Position 属性 为运动或静态
        if (options.position.times) {
          options.position = entityRun.computedRunPoints(options);
        } else {
          options.position = plottingUtils.latitudeAndLongitudeToDegrees(
            options.position
          );
        }
        entity = this.viewer.entities.add({
          id: options.id,
          name: options.name,
          type: "situation",
          GeoType: options.geoType,
          data: options.data,
          sort: options.sort || 1,
          groupId: options.groupId,
          camp: options.camp,
          show:
            options.show instanceof Array
              ? true
              : options.show === undefined
              ? true
              : options.show,
          availability: dateUtils.iso8602TimesToJulianDate(
            options.availability
          ),
          position: options.position,
          flag: {
            text: options.label,
            borderColor: options.material.border.color,
            textColor: options.material.text.color,
            backgroundColor: options.material.fill.color,
          },
          memory: options.memory,
          material: options.material,
          billboard: {
            image: this.createFlagMaterial(
              options.label,
              options.material.text.color,
              options.material.fill.color,
              options.material.border.color
            ).src,
            pixelOffset: new Cesium.Cartesian2(35, 10),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 设置图片垂直方向的原点在底部
            colorBlendMode: Cesium.ColorBlendMode.REPLACE, // 使用材质的颜色属性替换实体颜色属性,
          },
        });
      }
      if (options.show instanceof Array) {
        entity.billboard.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
      }
      if (options.animation !== undefined && options.animation != null) {
        entity.animation = entity.animation || {};
        if (options.animation.flicker) {
          entity.animation.flicker = options.animation.flicker;
          this.viewer.animations.get("flicker").set(entity.id, entity);
        }
        // 航迹线
        if (options.animation.trackLine) {
          entity.animation.trackLine = options.animation.trackLine;
          this.viewer.animations.get("trackLine").set(entity.id, entity);
        }
        // 雷达
        if (options.animation.radar) {
          entity.animation.radar = options.animation.radar;
          const entity1 = this.createRadar(entity);
          entity1.ellipse.show = options.animation.radar;
          // TODO 此处要不要加入到字典中
        }
        // 空间扩散（波纹）
        if (options.animation.ripple) {
          entity.animation.ripple = options.animation.ripple;
          const entity1 = this.createRipple(entity);
          entity1.ellipse.show = options.animation.ripple;
          // TODO 此处要不要加入到字典中
        }
      }
      resolve(entity);
    });
  }

  getFlagJson(entity) {
    const { startTime, endTime } = dateUtils.availabilityToTimes(
      entity.availability
    );
    const temp = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      groupId: entity.groupId,
      geoType: entity.GeoType,
      camp: entity.camp || 0,
      data: entity.data || null,
      sort: entity.sort,
      startTime: startTime,
      endTime: endTime,
      show:
        entity.billboard.distanceDisplayCondition?.getValue() instanceof Object
          ? [
              ...Object.values(
                entity.billboard.distanceDisplayCondition.getValue()
              ),
            ]
          : entity.show,
      memory: entity.memory,
      label: entity.flag.text,
      material: {
        border: {
          color: entity.flag.borderColor,
        },
        fill: {
          color: entity.flag.backgroundColor,
        },
        text: {
          color: entity.flag.textColor,
        },
        trackLine: entity.material.trackLine,
      },
      scale: entity.billboard?.rotation?.getValue() || 1,
      angle: entity.billboard?.scale?.getValue() || 0,
    };
    if (entity.position instanceof Cesium.SampledPositionProperty) {
      //(item.position instanceof Cesium.Cartesian3)
      temp["position"] = this._getPathPoint(entity);
    } else {
      temp["position"] =
        plottingUtils.degreesToLatitudeAndLongitude(
          entity.position?.getValue(Cesium.JulianDate.now())
        ) || null;
    }
    if (entity.animation) {
      temp["animation"] = {};
      if (entity.animation.flicker)
        temp["animation"]["flicker"] = entity.animation.flicker;
      if (entity.animation.trackLine)
        temp["animation"]["trackLine"] = entity.animation.trackLine;
      if (entity.animation.radar)
        temp["animation"]["radar"] = entity.animation.radar;
      if (entity.animation.ripple)
        temp["animation"]["ripple"] = entity.animation.ripple;
    }
    return temp;
  }

  /**
   * 获取运动实体路径点
   *
   * @param {*} entity 实体
   */
  _getPathPoint(entity) {
    let positionProperty = entity.position;
    if (Cesium.defined(positionProperty)) {
      let times = positionProperty._property._times;
      let pathData = {
        points: [],
        times: [],
      };
      for (let i = 0; i < times.length; i++) {
        let time = times[i];
        let position = positionProperty.getValue(time);
        pathData.points.push(
          plottingUtils.degreesToLatitudeAndLongitude(position)
        );
        pathData.times.push(time.toString());
      }
      return pathData;
    }
    return null;
  }
  /**
   * 创建图片旗帜材质
   * @param {String} text  文字内容
   * @param {String} textColor  文字颜色
   * @param {Array} [bgColor]  背景颜色
   * @param {String} borderColor  边框颜色
   */
  createFlagMaterial(text, textColor, bgColor, borderColor) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 测量文字的宽度
    ctx.font = "15px 黑体";
    const textWidth = ctx.measureText(text).width;
    const width = textWidth <= 50 ? 65 : textWidth + 20;
    const flagWidth = width;
    const flagHeight = 30;
    // const triangleSize = 8; // 小三角形的大小
    canvas.width = flagWidth + 20;
    canvas.height = flagHeight + 60; // 加上棍子的高度
    if (canvas && canvas.getContext) {
      // 清除画布内容
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制棍子
      ctx.fillStyle = borderColor;
      ctx.fillRect(9, flagHeight, 3, 50); // 将 x 坐标设置为 0，使棍子位于矩形的最左边
      // 绘制矩形
      ctx.fillStyle = bgColor;
      ctx.fillRect(10, 0, flagWidth, flagHeight);

      // 绘制矩形边框
      ctx.strokeStyle = borderColor; // 设置边框颜色
      ctx.lineWidth = 2; // 设置边框宽度
      ctx.strokeRect(10, 0, flagWidth, flagHeight);

      // 计算等边三角形的三个顶点
      // const triangleHeight = Math.sqrt(3) / 2 * triangleSize; // 计算等边三角形的高度
      // 绘制等边三角形
      // ctx.beginPath();
      // ctx.moveTo(5.5, flagHeight + 50); // 三角形的底部中心
      // ctx.lineTo(13.5, flagHeight + 50); // 三角形的底部右边点
      // ctx.lineTo(9.5, flagHeight + 50 - triangleHeight); // 三角形的顶部中心
      // ctx.closePath();
      // ctx.fillStyle = borderColor; // 设置三角形的颜色
      // ctx.fill();

      // 绘制文本
      ctx.fillStyle = textColor;
      ctx.font = "15px 黑体";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, flagWidth / 2 + 10, flagHeight / 2);
      // 返回 Canvas 转换为 Data URL
      return {
        src: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height,
      };
    }
  }
  /**
   *生成雷达效果
   */
  createRadar(entity) {
    entity.ellipse = {
      semiMinorAxis: new Cesium.CallbackProperty(() => {
        return this.viewer.camera.positionCartographic.height / 12;
      }, false),
      semiMajorAxis: new Cesium.CallbackProperty(() => {
        return this.viewer.camera.positionCartographic.height / 12;
      }, false),
      material: new Cesium.RadarWaveMaterialProperty({
        color: new Cesium.Color(1.0, 1.0, 0.0, 0.7),
        speed: 25.0,
      }),
    };
    return entity;
  }
  /**
   *生成波纹效果
   */
  createRipple(entity) {
    entity.ellipse = {
      semiMinorAxis: new Cesium.CallbackProperty(() => {
        return this.viewer.camera.positionCartographic.height / 12;
      }, false),
      semiMajorAxis: new Cesium.CallbackProperty(() => {
        return this.viewer.camera.positionCartographic.height / 12;
      }, false),
      material: new Cesium.CircleWaveMaterialProperty({
        duration: 3000,
        gradient: 0,
        color: new Cesium.Color.fromCssColorString("#1FA8E3"),
        count: 3,
      }),
    };
    return entity;
  }
  /**
   * 当旗帜名称修改时
   */
  _changName(source, options) {
    const flagCanvas = this.createFlagMaterial(
      options.name,
      source.flag.textColor,
      source.flag.backgroundColor,
      source.flag.borderColor
    );
    // 以旗杆底部为原点的偏移
    const adjustedOffset = new Cesium.Cartesian2(
      Math.round(flagCanvas.width * (6.5 / 15)),
      10
    );
    source.name = options.name;
    source.billboard.image = flagCanvas.src;
    source.flag.text = options.name;
    source.billboard.pixelOffset = adjustedOffset;
  }
}

export default FlagClass;
