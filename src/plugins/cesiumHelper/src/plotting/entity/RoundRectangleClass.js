import * as plottingUtils from "../../common/plottingUtils";
import toolTips from "../../common/reminderTip";
import * as uuid from "../../common/uuid";
import * as dateUtils from "../../common/dateUtils";
import {
  computeRoundedRectanglePoints,
  lockingMap,
  updateEntityToStaticProperties,
} from "../tool/plottingTools";
import { setGlowLine, setLineMaterial } from "../material/officialMaterial";
import { colorFormat } from "../color/colorFormat";
import { mirrorMaterial } from "../material/canvasMaterial";

const Cesium = window.Cesium;

/**
 * 创建圆角矩形标绘类
 */
class RoundRectangleClass {
  viewer = null;
  constructor(viewer) {
    this.viewer = viewer;
  }
  /**
   * 创建圆角矩形标绘
   * @param {Array} [options]  相关参数
   */
  createRoundRectangle(options) {
    return new Promise((resolve, reject) => {
      const id = options.id || uuid.uuid();
      const exist = this.viewer.entities.getById(id);
      if (exist) reject(exist);
      const handler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
      );

      window.toolTip = "点击鼠标左键开始绘制, 按ESC取消标绘";
      let anchorpoints = []; //记录圆角矩形的左上和右下两个点
      let roundRectangle = undefined;

      // 左键点击事件
      handler.setInputAction((event) => {
        window.toolTip = "双击鼠标左键或按回车键结束绘制, 按ESC取消标绘";
        let pos = plottingUtils.getCatesian3FromPX(this.viewer, event.position);
        if (!pos || Cesium.defined(roundRectangle)) return;
        anchorpoints.push(pos);
        roundRectangle = this.viewer.entities.add({
          id: id,
          name: "RoundRectangle",
          type: "situation",
          data: options.data,
          sort: options.sort || 1,
          groupId: this.viewer.root.id,
          availability: dateUtils.iso8602TimesToJulianDate(
            options?.availability ||
              dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)
          ),
          polygon: new Cesium.PolygonGraphics({
            hierarchy: new Cesium.CallbackProperty(function () {
              const points = computeRoundedRectanglePoints(anchorpoints);
              return new Cesium.PolygonHierarchy(points);
            }, false),
            fill: true,
            material: Cesium.Color.fromCssColorString(
              options.material.fill.color
            ),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            show: true,
          }),
          polyline: {
            positions: new Cesium.CallbackProperty(function () {
              const positions = computeRoundedRectanglePoints(anchorpoints); // 根据多边形顶点计算多边形形状
              return positions.concat(positions[0]); // 将线段首尾相接形成闭合边框
            }, false),
            width: 2, // 设置边框线宽度
            material:
              options.material.line.style === "solid"
                ? Cesium.Color.fromCssColorString(options.material.border.color)
                : new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.fromCssColorString(
                      options.material.line.color
                    ),
                    // gapColor:Cesium.Color.YELLOW,
                    dashLength: 30.0,
                    dashPattern: 255.0,
                  }),
            clampToGround: true,
          },
        });
        roundRectangle.GeoType = "RoundRectangle"; //记录对象的类型，用户后续编辑等操作
        roundRectangle.Editable = true; //代表当前对象可编辑,false状态下不可编辑
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      // 鼠标移动事件
      handler.setInputAction((movement) => {
        let endPos = movement.endPosition;
        toolTips(window.toolTip, endPos, true);
        if (!Cesium.defined(roundRectangle)) return;
        const endCartesian = plottingUtils.getCatesian3FromPX(
          this.viewer,
          endPos
        );
        if (!endCartesian) return;
        anchorpoints = [anchorpoints[0], endCartesian];
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      // 左键双击事件
      handler.setInputAction(() => {
        roundRectangle.PottingPoint = Cesium.clone(anchorpoints, true);
        handler.destroy();
        toolTips(window.toolTip, null, false);
        updateEntityToStaticProperties(roundRectangle);
        if (options?.show instanceof Array) {
          roundRectangle.polyline.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
          roundRectangle.polygon.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
        }
        document.removeEventListener("keydown", cancel);
        document.removeEventListener("keydown", enterEnd);
        resolve(roundRectangle);
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      const cancel = (e) => {
        if (e.key === "Escape") {
          this.viewer.entities.remove(roundRectangle);
          handler.destroy();
          toolTips(window.toolTip, null, false);
          document.removeEventListener("keydown", cancel);
          document.removeEventListener("keydown", enterEnd);
          reject("取消标绘");
        }
      };
      const enterEnd = (e) => {
        if (e.key === "Enter") {
          roundRectangle.PottingPoint = Cesium.clone(anchorpoints, true);
          handler.destroy();
          toolTips(window.toolTip, null, false);
          updateEntityToStaticProperties(roundRectangle);
          if (options?.show instanceof Array) {
            roundRectangle.polyline.distanceDisplayCondition =
              new Cesium.DistanceDisplayCondition(...options.show);
            roundRectangle.polygon.distanceDisplayCondition =
              new Cesium.DistanceDisplayCondition(...options.show);
          }
          document.addEventListener("keydown", cancel);
          document.addEventListener("keydown", enterEnd);
          resolve(roundRectangle);
        }
      };
      document.addEventListener("keydown", cancel);
      document.addEventListener("keydown", enterEnd);
    });
  }
  /**
   * 编辑圆角矩形标绘
   * @param {Cesium.Viewer} viewer 该viewer带有实体编辑的信息
   * @param {Cesium.Entity} entity  编辑实体
   * @param {Cesium.ScreenSpaceEventHandler} handler 事件处理函数
   * @param {Array} collection 实体集和
   *
   */
  editRoundRectangle(viewer, entity, handler, collection) {
    let editItem = collection.find((ele) => {
      return ele.id === entity.id;
    });
    let editEntity;
    let sourcePos = entity.PottingPoint;
    if (!sourcePos) {
      return;
    }
    let updatePos = Cesium.clone(sourcePos, true);

    entity.show = false;
    let dynamicPositions = new Cesium.CallbackProperty(function () {
      return new Cesium.PolygonHierarchy(
        computeRoundedRectanglePoints(updatePos)
      );
    }, false);
    let lineCallback = new Cesium.CallbackProperty(() => {
      let points = computeRoundedRectanglePoints(updatePos);
      return points.concat(points[0]);
    }, false);
    if (editItem) {
      editEntity = editItem.target;
      editEntity.show = true;
      editEntity.polygon.hierarchy = dynamicPositions;
      editEntity.polyline.positions = lineCallback;
      editItem.processEntities = initVertexEntities();
    } else {
      const newRoundRectangle = Cesium.clone(entity.polygon);
      // newRoundRectangle.material = Cesium.Color.RED.withAlpha(0.4);
      newRoundRectangle.hierarchy = dynamicPositions;

      const newAssembleLine = Cesium.clone(entity.polyline);
      newAssembleLine.positions = lineCallback;
      editEntity = viewer.entities.add({
        GeoType: "EditRoundRectangle",
        Editable: true,
        id: "edit_" + entity.id,
        polygon: newRoundRectangle,
        polyline: newAssembleLine,
      });
      //编辑状态让实体贴地
      editEntity.polygon.perPositionHeight = false;
      editEntity.polyline.clampToGround = true;
      entity.showEditEntityId = editEntity.id;
      const vertexs = initVertexEntities();
      collection.push({
        id: entity.id,
        source: entity,
        target: editEntity,
        geoType: "remix_roundrectangle",
        processEntities: vertexs,
      });
    }
    let boolDown = false; //鼠标左键是否处于摁下状态
    let currentPickVertex = undefined; //当前选择的要编辑的节点
    let currentPickPolygon = undefined; //当前选择的要移动的圆角矩形
    // 左键摁下事件
    handler.setInputAction((event) => {
      boolDown = true;
      let pick = viewer.scene.pick(event.position);
      if (Cesium.defined(pick) && pick.id) {
        const pickEntity = pick.id;
        editEntity.polygon.hierarchys = dynamicPositions;
        editEntity.polyline.positions = lineCallback;
        if (!pickEntity.GeoType || !pickEntity.Editable) {
          return;
        }
        if (pickEntity.GeoType === "RoundRectangleEditPoint") {
          lockingMap(viewer, false);
          currentPickVertex = pickEntity;
        } else if (pickEntity.GeoType === "EditRoundRectangle") {
          lockingMap(viewer, false);
          currentPickPolygon = pickEntity;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    // 鼠标移动事件
    handler.setInputAction((event) => {
      if (boolDown && currentPickVertex) {
        let pos = plottingUtils.getCatesian3FromPX(viewer, event.endPosition);
        if (pos) {
          updatePos[currentPickVertex.description] = pos;
        } else {
          console.log("===========================点不存在");
        }
      }
      if (boolDown && currentPickPolygon) {
        const startPosition = plottingUtils.getCatesian3FromPX(
          viewer,
          event.startPosition
        );
        const endPosition = plottingUtils.getCatesian3FromPX(
          viewer,
          event.endPosition
        );

        if (startPosition && endPosition) {
          const changed_x = endPosition.x - startPosition.x;
          const changed_y = endPosition.y - startPosition.y;
          const changed_z = endPosition.z - startPosition.z;

          for (let i = 0; i < updatePos.length; i++) {
            updatePos[i] = new Cesium.Cartesian3(
              updatePos[i].x + changed_x,
              updatePos[i].y + changed_y,
              updatePos[i].z + changed_z
            );
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // 左键抬起事件
    handler.setInputAction(() => {
      if (entity.height) {
        let points = editEntity.polygon.hierarchy.getValue().positions;
        points = this._changHeight(points, entity.height, true);
        entity.polygon.hierarchy = points;
        entity.polyline.positions = points;
        entity.polygon.perPositionHeight = true;
        entity.polyline.clampToGround = false;
      } else {
        entity.polygon.hierarchy =
          editEntity.polygon.hierarchy.getValue().positions;
        entity.polyline.positions = editEntity.polyline.positions.getValue();
      }
      currentPickVertex = undefined;
      currentPickPolygon = undefined;
      lockingMap(viewer, true);
      entity.PottingPoint = updatePos;
      // updateEntityToStaticProperties(editEntity, false)
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    function initVertexEntities() {
      let processEntities = [];

      for (let index = 0; index < updatePos.length; index++) {
        let verEntity = viewer.entities.add({
          id: "edit_" + uuid.uuid(),
          position: new Cesium.CallbackProperty(() => {
            return updatePos[index];
          }, false),
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString("rgba(28, 25, 124,0.6)"),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            outlineColor: Cesium.Color.fromCssColorString(
              "rgba(175, 172, 170,0.8)"
            ),
          },
          show: true,
          description: index, //记录节点索引
        });
        verEntity.GeoType = "RoundRectangleEditPoint";
        verEntity.Editable = true;
        processEntities.push(verEntity);
      }

      return processEntities;
    }
    // })
  }
  /**
   * 根据数据生成实体
   * @param {Array} options 实体数据导入
   */
  showRoundRectangle(options) {
    return new Promise((resolve, reject) => {
      let existingEntity = this.viewer.entities.getById(options.id);
      if (existingEntity) {
        reject(existingEntity);
        console.log("该实体已经存在，不能重复加载");
      } else {
        let availability = dateUtils.iso8602TimesToJulianDate(
          options.availability
        );
        const degreesPositions = options.position.map((item) =>
          plottingUtils.latitudeAndLongitudeToDegrees(item)
        );
        const degreesArrayHeight = computeRoundedRectanglePoints(
          degreesPositions
        ).map((item) => {
          const temp = plottingUtils.degreesToLatitudeAndLongitude(item);
          temp[2] = options.material?.fill?.height || 0;
          return plottingUtils.latitudeAndLongitudeToDegrees(temp);
        });
        let entity = this.viewer.entities.add({
          id: options.id,
          name: options.name,
          data: options.data,
          sort: options.sort || 1,
          groupId: options.groupId,
          GeoType: options.geoType,
          availability: availability,
          type: "situation",
          label: "",
          Editable: true,
          height: options.material.fill.height,
          PottingPoint: degreesPositions,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(degreesArrayHeight),
            material:
              options.material.fill.color instanceof Array
                ? mirrorMaterial(options.material.fill.color)
                : Cesium.Color.fromCssColorString(options.material.fill.color),
            show: options.material.fill.show,
            perPositionHeight: options.material.fill.height ? true : false,
          },
          polyline: {
            positions: degreesArrayHeight.concat(degreesArrayHeight[0]),
            width: 2,
            material: this._createLineStyle(
              options.material.border.style,
              options.material.border.color
            ),
            clampToGround: options.material.border.height ? false : true,
          },
          show:
            options.show instanceof Array
              ? true
              : options.show === undefined
              ? true
              : options.show,
        });
        if (options.show instanceof Array) {
          entity.polyline.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
          entity.polygon.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
        }
        if (options.animation !== undefined && options.animation != null) {
          entity.animation = entity.animation || {};
          if (options.animation.flicker) {
            entity.animation.flicker = options.animation.flicker;
            this.viewer.animations.get("flicker").set(entity.id, entity);
          }
        }
        resolve(entity);
      }
    });
  }

  /**
   * 修改实体
   * @param {Cesium.Entity} source 修改数据的实体
   * @param {Array} options 修改实体数据
   */
  editRoundRectangleData(source, options) {
    //编辑状态实体
    const showEditEntity = this.viewer.entities.getById(
      source.showEditEntityId
    );
    // 修改 实体 名称
    "name" in options && (source.name = options.name);
    //修改实体分组
    "groupId" in options && (source.groupId = options.groupId);
    //是否贴地 修改标绘距地面高度
    "height" in options && this._changHeight(source, options.height, false);
    // 修改 实体 数据id
    "data" in options && (source.data = options.data);
    // 修改 实体 顺序
    "sort" in options && (source.sort = options.sort);
    // 控制实体显隐
    if ("show" in options) {
      if (options.show instanceof Array) {
        source.show = true;
        source.polyline.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
        source.polygon.distanceDisplayCondition =
          new Cesium.DistanceDisplayCondition(...options.show);
      } else {
        source.show = options.show;
      }
    }
    // 修改实体有效期
    if ("availability" in options) {
      source.availability.removeAll(); // 移除所有时间间隔
      source.availability = dateUtils.iso8602TimesToJulianDate(
        options.availability
      );
    }
    // 修改 实体 阵营
    if ("camp" in options) {
      source.camp = options.camp;
      const fc =
        options.camp === 0
          ? "rgba(255, 0, 0, .3)"
          : options.camp === 1
          ? "rgba(0, 0, 255, .2)"
          : "rgba(0, 255, 0, .4)";
      const bc =
        options.camp === 0
          ? "rgba(255, 0, 0, .8)"
          : options.camp === 1
          ? "rgba(0, 0, 255, .8)"
          : "rgba(0, 255, 0, .8)";
      source.polyline.material = Cesium.Color.fromCssColorString(bc);
      source.polygon.material = Cesium.Color.fromCssColorString(fc);
      showEditEntity.polyline.material = Cesium.Color.fromCssColorString(bc);
      showEditEntity.polygon.material = Cesium.Color.fromCssColorString(fc);
    }
    // 修改材质
    if ("material" in options) {
      const material = options.material;
      // 边框
      if (material.border) {
        const border = material.border;
        // 边框颜色
        if (border.color) {
          const color = border.color;
          if (
            source.polyline.material instanceof
            Cesium.PolylineDashMaterialProperty
          ) {
            source.polyline.material = setLineMaterial(
              Cesium.Color.fromCssColorString(color)
            );
            showEditEntity.polyline.material = setLineMaterial(
              Cesium.Color.fromCssColorString(border.color)
            );
          } else if (
            source.polyline.material instanceof
            Cesium.PolylineGlowMaterialProperty
          ) {
            source.polyline.material = setGlowLine(
              Cesium.Color.fromCssColorString(color)
            );
            showEditEntity.polyline.material = setGlowLine(
              Cesium.Color.fromCssColorString(color)
            );
          } else {
            source.polyline.material = Cesium.Color.fromCssColorString(
              border.color
            );
            showEditEntity.polyline.material = Cesium.Color.fromCssColorString(
              border.color
            );
          }
        }
        // 边框样式
        if (border.style) {
          const style = border.style;
          const outline = source.polyline.material.getValue();
          source.polyline.material = this._createLineStyle(
            style,
            outline.color
          );
          showEditEntity.polyline.material = this._createLineStyle(
            style,
            outline.color
          );
        }
        // 边框宽度
        if (border.width) {
          source.polyline.width = border.width;
          showEditEntity.polyline.width = border.width;
        }
      }
      // 填充
      if (material.fill) {
        const fill = material.fill;
        // 填充颜色
        if (fill.color) {
          source.polygon.material =
            source.polygon.material instanceof Cesium.ImageMaterialProperty
              ? this.tailFade(source, fill.color)
              : Cesium.Color.fromCssColorString(fill.color);
          showEditEntity.polygon.material =
            source.polygon.material instanceof Cesium.ImageMaterialProperty
              ? this.tailFade(source, fill.color)
              : Cesium.Color.fromCssColorString(fill.color);
        }
        // 是否填充
        if (fill.show !== undefined && fill.show !== null) {
          source.polygon.show = fill.show;
          showEditEntity.polygon.show = fill.show;
        }
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
    }
    this.viewer.resource.set(source.id, this.getRoundRectangleJson(source));
  }

  /**
   * 导出态势箭头 Json 数据
   *
   * @param {*} entity 实体
   * */
  getRoundRectangleJson(entity) {
    const { startTime, endTime } = dateUtils.availabilityToTimes(
      entity.availability
    );
    const temp = {
      id: entity.id,
      name: entity.name,
      data: entity.data || null,
      sort: entity.sort,
      type: entity.type,
      groupId: entity.groupId,
      geoType: entity.GeoType,
      camp: entity.camp || 0,
      startTime: startTime,
      endTime: endTime,
      show:
        entity.polygon.distanceDisplayCondition?.getValue() instanceof Object
          ? [
              ...Object.values(
                entity.polygon.distanceDisplayCondition.getValue()
              ),
            ]
          : entity.show,
      label: entity?.label?.text,
    };
    let lineType = "";
    if (
      entity?.polyline.material instanceof Cesium.PolylineDashMaterialProperty
    ) {
      lineType = "dashed";
    } else if (
      entity?.polyline.material instanceof Cesium.PolylineGlowMaterialProperty
    ) {
      lineType = "glow";
    } else {
      lineType = "solid";
    }
    if (entity.polygon.material instanceof Cesium.ImageMaterialProperty) {
      const outlineColor = entity.polyline.material?.color?.getValue();
      const outlineColorString = colorFormat(outlineColor);
      temp["material"] = {
        border: {
          style: lineType,
          color: outlineColorString,
          height: entity?.height,
          width: entity.polyline.width.getValue(),
          show: entity.polyline?.show?.getValue(),
        },
        fill: {
          color: entity.polygon.material.color,
          height: entity?.height,
          show: entity.polygon.show,
        },
      };
    } else {
      const color = entity.polygon.material?.color?.getValue();
      const outlineColor = entity.polyline.material?.color?.getValue();
      temp["material"] = {
        border: {
          style: lineType,
          color: colorFormat(outlineColor),
          height: entity?.height,
          width: entity.polyline.width.getValue(),
          show: entity.polyline?.show?.getValue(),
        },
        fill: {
          color: colorFormat(color),
          height: entity?.height,
          show: entity.polygon?.show?.getValue(),
        },
      };
    }
    if (entity.animation) {
      temp["animation"] = {};
      if (entity.animation.flicker)
        temp["animation"]["flicker"] = entity.animation.flicker;
    }
    temp["position"] = entity.PottingPoint.map((point) =>
      plottingUtils.degreesToLatitudeAndLongitude(point)
    );
    return temp;
  }

  /**
   * 创建边框或线样式 材质
   *
   * 实线、虚线、发光线
   * */
  _createLineStyle(type, color) {
    color = color instanceof Cesium.Color ? colorFormat(color) : color;
    if (type === "solid") {
      return Cesium.Color.fromCssColorString(color);
    } else if (type === "dashed") {
      return setLineMaterial(Cesium.Color.fromCssColorString(color));
    } else if (type === "glow") {
      return setGlowLine(Cesium.Color.fromCssColorString(color));
    } else {
      return null;
    }
  }
  /**
   * 改变实体的高度
   * @param  source 修改数据的实体，编辑时为实体点
   * @param  height 修改实体数据的高度
   * @param  isEdit 是否处于编辑状态
   * */
  _changHeight(source, height, isEdit) {
    if (isEdit) {
      let currentHeight = source.map((points) => {
        let currentHeight = plottingUtils.degreesToLatitudeAndLongitude(points);
        currentHeight[2] = height;
        return plottingUtils.latitudeAndLongitudeToDegrees(currentHeight);
      });
      return currentHeight.concat(currentHeight[0]);
    } else {
      // 获取当前的顶点坐标
      const currentPositions = source.polygon.hierarchy.getValue(
        this.viewer.clock.currentTime
      ).positions;
      if (!Cesium.defined(currentPositions)) return;
      // 修改每个polygon顶点的高度
      let newPositions = currentPositions.map((cartesian) => {
        let currentHeight =
          plottingUtils.degreesToLatitudeAndLongitude(cartesian);
        currentHeight[2] = height;
        return plottingUtils.latitudeAndLongitudeToDegrees(currentHeight);
      });
      source.polygon.perPositionHeight = height ? true : false;
      source.polyline.clampToGround = height ? false : true;
      source.polygon.hierarchy = newPositions;
      source.polyline.positions = newPositions.concat(newPositions[0]);
      source.height = height;
    }
  }
}
export default RoundRectangleClass;
