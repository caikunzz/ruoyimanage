import * as plottingUtils from "../../common/plottingUtils";
import toolTips from "../../common/reminderTip";
import * as uuid from "../../common/uuid";
import * as dateUtils from "../../common/dateUtils";
import {
  lockingMap,
  updateEntityToStaticProperties,
} from "../tool/plottingTools";
import { setGlowLine, setLineMaterial } from "../material/officialMaterial";
import { colorFormat } from "../color/colorFormat";
import { mirrorMaterial } from "../material/canvasMaterial";

const Cesium = window.Cesium;

/**
 * 创建多边形标绘类
 */
class PolygonClass {
  viewer = null;

  constructor(viewer) {
    this.viewer = viewer;
  }

  /**
   * 创建多边形标绘
   * @param {Array} [options]  相关参数
   */
  createPolygon = (options) => {
    return new Promise((resolve, reject) => {
      const id = options.id || uuid.uuid();
      const exist = this.viewer.entities.getById(id);
      if (exist) reject(exist);

      const handler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
      );
      window.toolTip = "点击鼠标左键开始绘制, 按ESC取消标绘";

      let anchorpoints = [];
      let polygon = undefined;

      // 左键点击事件
      handler.setInputAction((event) => {
        let pixPos = event.position;
        let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, pixPos);
        if (!cartesian) return;
        if (anchorpoints.length === 0) {
          window.toolTip = "左键添加第二个顶点, 按ESC取消标绘";
          anchorpoints.push(cartesian);
          polygon = this.viewer.entities.add({
            id: id,
            name: "Polygon",
            type: "situation",
            groupId: this.viewer.root.id,
            data: options.data,
            sort: options.sort || 1,
            availability: dateUtils.iso8602TimesToJulianDate(
              options?.availability ||
                dateUtils.julianDateToIso8602Times(
                  this.viewer.clock.currentTime
                )
            ),
            polygon: {
              hierarchy: new Cesium.CallbackProperty(function () {
                return new Cesium.PolygonHierarchy(anchorpoints);
              }, false),
              material: Cesium.Color.fromCssColorString(
                options.material.fill.color
              ),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              show: true,
            },
            polyline: {
              positions: new Cesium.CallbackProperty(function () {
                return anchorpoints.concat(anchorpoints[0]);
              }, false),
              width: 2,
              material:
                options.material.line.style === "solid"
                  ? Cesium.Color.fromCssColorString(
                      options.material.border.color
                    )
                  : new Cesium.PolylineDashMaterialProperty({
                      color: Cesium.Color.fromCssColorString(
                        options.material.line.color
                      ),
                      dashLength: 20.0,
                      dashPattern: 255.0,
                    }),
              clampToGround: true,
            },
          });
          polygon.GeoType = "Polygon"; //记录对象的类型，用户后续编辑等操作
          polygon.Editable = true; //代表当前对象可编辑,false状态下不可编辑
        } else {
          window.toolTip =
            "左键添加点，右键撤销，双击鼠标左键或按回车键结束绘制, 按ESC取消标绘";
        }
        anchorpoints.push(cartesian);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // 鼠标移动事件
      handler.setInputAction((movement) => {
        let endPos = movement.endPosition;
        toolTips(window.toolTip, endPos, true);
        if (Cesium.defined(polygon)) {
          anchorpoints.pop();
          let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, endPos);
          if (!cartesian) {
            return;
          }
          anchorpoints.push(cartesian);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // 左键双击事件
      handler.setInputAction((event) => {
        anchorpoints.pop();
        anchorpoints.pop(); //因为是双击结束，所以要pop两次，一次是move的结果，一次是单击结果
        polygon.PottingPoint = Cesium.clone(anchorpoints, true); //记录对象的节点数据，用户后续编辑等操作
        handler.destroy();
        toolTips(window.toolTip, event.position, false);
        updateEntityToStaticProperties(polygon);
        if (options?.show instanceof Array) {
          polygon.polyline.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
          polygon.polygon.distanceDisplayCondition =
            new Cesium.DistanceDisplayCondition(...options.show);
        }
        document.removeEventListener("keydown", cancel);
        document.removeEventListener("keydown", enterEnd);
        resolve(polygon);
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      // 右键摁下事件
      handler.setInputAction(() => {
        anchorpoints.pop();
      }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      const cancel = (e) => {
        if (e.key === "Escape") {
          this.viewer.entities.remove(polygon);
          handler.destroy();
          toolTips(window.toolTip, null, false);
          document.removeEventListener("keydown", cancel);
          document.removeEventListener("keydown", enterEnd);
          reject("取消标绘");
        }
      };
      const enterEnd = (e) => {
        if (e.key === "Enter") {
          polygon.PottingPoint = Cesium.clone(anchorpoints, true); //记录对象的节点数据，用户后续编辑等操作
          handler.destroy();
          toolTips(window.toolTip, event.position, false);
          updateEntityToStaticProperties(polygon);
          if (options?.show instanceof Array) {
            polygon.polyline.distanceDisplayCondition =
              new Cesium.DistanceDisplayCondition(...options.show);
            polygon.polygon.distanceDisplayCondition =
              new Cesium.DistanceDisplayCondition(...options.show);
          }
          document.addEventListener("keydown", cancel);
          document.addEventListener("keydown", enterEnd);
          resolve(polygon);
        }
      };
      document.addEventListener("keydown", cancel);
      document.addEventListener("keydown", enterEnd);
    });
  };

  /**
   * 编辑多边形标绘
   * @param {Cesium.Viewer} viewer 该viewer带有实体编辑的信息
   * @param {Cesium.Entity} entity  编辑实体
   * @param {Cesium.ScreenSpaceEventHandler} handler 事件处理函数
   * @param {Array} collection 实体集和
   */
  editPolygon(viewer, entity, handler, collection) {
    let editItem = collection.find((ele) => {
      return ele.id === entity.id;
    });
    let editEntity;
    let sourcePositions = entity.PottingPoint;
    if (!sourcePositions) {
      return;
    }
    let updatePositions = Cesium.clone(sourcePositions);
    entity.show = false;
    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      return new Cesium.PolygonHierarchy(updatePositions);
    }, false);
    let lineCallback = new Cesium.CallbackProperty(() => {
      let points = updatePositions.concat(updatePositions[0]);
      return points;
    }, false);
    if (editItem) {
      editEntity = editItem.target;
      editEntity.show = true;
      editEntity.polygon.hierarchy = dynamicHierarchy;
      editEntity.polyline.positions = lineCallback;
      editItem.processEntities = initVertexEntities();
    } else {
      const newPolygon = Cesium.clone(entity.polygon);
      // newPolygon.material = Cesium.Color.RED.withAlpha(0.6);
      newPolygon.hierarchy = dynamicHierarchy;

      const newAssembleLine = Cesium.clone(entity.polyline);
      newAssembleLine.positions = lineCallback;
      editEntity = viewer.entities.add({
        GeoType: "EditPolygon",
        Editable: true,
        id: "edit_" + entity.id,
        polygon: newPolygon,
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
        geoType: "polygon",
        processEntities: vertexs,
      });
    }
    let boolDown = false; //鼠标左键是否处于摁下状态
    let currentPickVertex = undefined; //当前选择的要编辑的节点
    let currentPickPolygon = undefined; //当前选择的要移动的多边形
    // 左键摁下事件
    handler.setInputAction((event) => {
      boolDown = true;
      let pick = viewer.scene.pick(event.position);
      if (Cesium.defined(pick) && pick.id) {
        const pickEntity = pick.id;
        editEntity.polygon.hierarchy = dynamicHierarchy;
        editEntity.polyline.positions = lineCallback;
        if (!pickEntity.GeoType || !pickEntity.Editable) {
          return;
        }
        if (pickEntity.GeoType === "PolygonEditPoints") {
          lockingMap(viewer, false);
          currentPickVertex = pickEntity;
        } else if (pickEntity.GeoType === "EditPolygon") {
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
          updatePositions[currentPickVertex.description.getValue()] = pos;
        } else {
          console.log("=======================================点不存在");
        }
      }
      if (boolDown && currentPickPolygon) {
        let startPosition = plottingUtils.getCatesian3FromPX(
          viewer,
          event.startPosition
        );
        let endPosition = plottingUtils.getCatesian3FromPX(
          viewer,
          event.endPosition
        );
        if (startPosition && endPosition) {
          let changed_x = endPosition.x - startPosition.x;
          let changed_y = endPosition.y - startPosition.y;
          let changed_z = endPosition.z - startPosition.z;
          updatePositions.forEach((element) => {
            element.x = element.x + changed_x;
            element.y = element.y + changed_y;
            element.z = element.z + changed_z;
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // 左键抬起事件
    handler.setInputAction(() => {
      this._changHeight(entity, entity.height);
      boolDown = false;
      currentPickVertex = undefined;
      currentPickPolygon = undefined;
      lockingMap(viewer, true);
      entity.PottingPoint = updatePositions;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    // 左键点击事件
    handler.setInputAction((event) => {
      let pick = viewer.scene.pick(event.position);
      if (Cesium.defined(pick) && pick.id) {
        if (pick.id.GeoType === "PolygonEditCenterPoints") {
          let index = pick.id.description.getValue() + 1;
          const pos = pick.id.position.getValue();
          updateProcessObj(true, index, pos);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //右键点击事件
    handler.setInputAction((event) => {
      let pick = viewer.scene.pick(event.position);
      if (Cesium.defined(pick) && pick.id) {
        if (pick.id.GeoType === "PolygonEditPoints") {
          if (updatePositions.length < 4) {
            alert("多边形节点数不能少于3个");
            return;
          }
          let index = pick.id.description.getValue();
          updateProcessObj(false, index);
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    function updateProcessObj(add, index, pos) {
      const item = collection.find((ele) => {
        return ele.id === entity.id;
      });
      if (item && item.processEntities) {
        item.processEntities.forEach((entity) => {
          viewer.entities.remove(entity);
        });
        add
          ? updatePositions.splice(index, 0, pos)
          : updatePositions.splice(index, 1);
        item.processEntities = initVertexEntities();
      }
    }

    function initVertexEntities() {
      let vertexPointsEntity = []; //中途创建的Point对象
      let centerPointsEntity = []; //中途创建的虚拟Point对象
      for (let index = 0; index < updatePositions.length; index++) {
        let point = viewer.entities.add({
          id: "edit_" + uuid.uuid(),
          position: new Cesium.CallbackProperty(function () {
            return updatePositions[index];
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
        point.GeoType = "PolygonEditPoints";
        point.Editable = true;
        vertexPointsEntity.push(point);

        let centerPoint = viewer.entities.add({
          id: "edit_" + uuid.uuid(),
          position: new Cesium.CallbackProperty(() => {
            let endPos = updatePositions[index + 1]
              ? updatePositions[index + 1]
              : updatePositions[0];
            return Cesium.Cartesian3.midpoint(
              updatePositions[index],
              endPos,
              new Cesium.Cartesian3()
            );
          }, false),
          point: {
            pixelSize: 8,
            color: Cesium.Color.fromCssColorString("rgba(11,154,97,0.6)"),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            outlineColor: Cesium.Color.fromCssColorString(
              "rgba(175, 172, 170,0.8)"
            ),
          },
          show: true,
          description: index, //记录节点索引
        });
        centerPoint.GeoType = "PolygonEditCenterPoints";
        centerPoint.Editable = true;
        centerPointsEntity.push(centerPoint);
      }
      let processEntities = vertexPointsEntity.concat(centerPointsEntity);
      const hierarchy = editEntity.polygon.hierarchy.getValue();
      entity.polygon.hierarchy = hierarchy;
      entity.polyline.positions = hierarchy.positions.concat(
        hierarchy.positions[0]
      );
      return processEntities;
    }

    return collection;
  }

  /**
   * 根据数据生成实体
   * @param {Array} options 实体数据导入
   */
  showPolygon(options) {
    return new Promise((resolve, reject) => {
      let existingEntity = this.viewer.entities.getById(options.id);
      if (existingEntity) {
        reject(existingEntity);
        console.log("该实体已经存在，不能重复加载");
      } else {
        let availability = dateUtils.iso8602TimesToJulianDate(
          options.availability
        );
        let degreesPositions = options.position.map((position) =>
          plottingUtils.latitudeAndLongitudeToDegrees(position)
        );
        let degreesArrayHeight = options.position.map((position) => {
          const temp = position;
          temp[2] = options.material?.fill?.height || 0;
          return plottingUtils.latitudeAndLongitudeToDegrees(temp);
        });
        let entity = this.viewer.entities.add({
          id: options.id,
          name: options.name,
          data: options.data,
          sort: options.sort || 1,
          GeoType: options.geoType,
          availability: availability,
          groupId: this.viewer.root.id,
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
  editPolygonData(source, options) {
    //编辑状态实体
    const showEditEntity = this.viewer.entities.getById(
      source.showEditEntityId
    );
    // 修改 实体 名称
    "name" in options && (source.name = options.name);
    // 修改 实体 分组
    "groupId" in options && (source.groupId = options.groupId);
    //修改标绘距地面高度
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
        // 边框宽度
        if (border.width) {
          source.polyline.width = border.width;
          showEditEntity.polyline.width = border.width;
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
    this.viewer.resource.set(source.id, this.getPolygonJson(source));
  }

  /**
   * 导出态势箭头 Json 数据
   *
   * @param {*} entity 实体
   * */
  getPolygonJson(entity) {
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
      show: Boolean(entity.show),
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
  _changHeight(source, height) {
    const points = source.polygon.hierarchy.getValue().positions;
    const adjustPoints = points.map((point) => {
      const currentHeight = plottingUtils.degreesToLatitudeAndLongitude(point);
      currentHeight[2] = height;
      return plottingUtils.latitudeAndLongitudeToDegrees(currentHeight);
    });
    source.polygon.perPositionHeight = !!height;
    source.polyline.clampToGround = !height;
    source.polygon.hierarchy = adjustPoints;
    source.polyline.positions = adjustPoints.concat([adjustPoints[0]]);
    source.height = height;
  }
}

export default PolygonClass;
