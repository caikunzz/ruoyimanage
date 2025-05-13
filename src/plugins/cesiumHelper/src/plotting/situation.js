import * as dateUtils from "../common/dateUtils";
import * as plottingUtils from "../common/plottingUtils";
import AssembleClass from "./entity/AssembleClass";
import AttackArrowClass from "./entity/AttackArrowClass";
import CurveLineClass from "./entity/CurveLineClass";
import CurveArrowClass from "./entity/CurveArrowClass";
import CurvePolygonClass from "./entity/CurvePolygonClass";
import DefenseLineClass from "./entity/DefenseLineClass";
import FlagClass from "./entity/FlagClass";
import LineArrowClass from "./entity/LineArrowClass";
import PincerArrowClass from "./entity/PincerArrowClass";
import PolygonClass from "./entity/PolygonClass";
import PolylineClass from "./entity/PolylineClass";
import RightAngleArrowClass from "./entity/RightAngleArrowClass";
import RoundRectangleClass from "./entity/RoundRectangleClass";
import SwallowtailArrowClass from "./entity/SwallowtailArrowClass";
import TextBoxClass from "./entity/TextBoxClass";
import { removeToolTip, showToolTip } from "../../lib/Tooltip";
import * as uuid from "../common/uuid";
import { updateEntityToStaticProperties } from "./tool/plottingTools";

const Cesium = window.Cesium;

/**
 * 态势箭头标绘类
 *
 * 包含态势箭头标绘相关方法
 * */
class SituationPlotting {
  //当前编辑实体
  activeEditEntity = null;
  editEntityArr = [];
  //事件函数
  _editHandler = null;
  //返回编辑后的实体集和
  _editCollection = [];
  //提示框
  _toolTip = null;
  _preEntity = null;

  /** 集结地标绘类 */
  AssembleClass = null;
  /** 进攻箭头标绘类 */
  AttackArrowClass = null;
  /**曲线标绘类*/
  CurveLineClass = null;
  /**曲线箭头标绘类*/
  CurveArrowClass = null;
  /**闭合曲面标绘类*/
  CurvePolygonClass = null;
  /**防御标绘类*/
  DefenseLineClass = null;
  /**旗帜标绘类*/
  FlagClass = null;
  /**直线箭头标绘类*/
  LineArrowClass = null;
  /**钳击箭头标绘类*/
  PincerArrowClass = null;
  /**多边形标绘类*/
  PolygonClass = null;
  /**折线标绘类*/
  PolylineClass = null;
  /**直角箭头标绘类*/
  RightAngleArrowClass = null;
  /**圆角矩形标绘类*/
  RoundRectangleClass = null;
  /**燕尾箭头标绘类*/
  SwallowtailArrowClass = null;
  /**文本框类*/
  TextBoxClass = null;

  situationMap = null;

  constructor(viewer) {
    this.viewer = viewer;

    /* 初始化标绘类 */
    this.AssembleClass = new AssembleClass(viewer);
    this.AttackArrowClass = new AttackArrowClass(viewer);
    this.CurveLineClass = new CurveLineClass(viewer);
    this.CurveArrowClass = new CurveArrowClass(viewer);
    this.CurvePolygonClass = new CurvePolygonClass(viewer);
    this.DefenseLineClass = new DefenseLineClass(viewer);
    this.FlagClass = new FlagClass(viewer);
    this.TextBoxClass = new TextBoxClass(viewer);
    this.LineArrowClass = new LineArrowClass(viewer);
    this.PincerArrowClass = new PincerArrowClass(viewer);
    this.PolygonClass = new PolygonClass(viewer);
    this.PolylineClass = new PolylineClass(viewer);
    this.RightAngleArrowClass = new RightAngleArrowClass(viewer);
    this.RoundRectangleClass = new RoundRectangleClass(viewer);
    this.SwallowtailArrowClass = new SwallowtailArrowClass(viewer);

    this.situationMap = new Map([
      ["LineArrow", new Map()], //简单箭头Entity集合
      ["CurveArrow", new Map()], //简单曲线箭头Entity集合
      ["CurvedPolygon", new Map()], //闭合曲面Entity集合
      ["SwallowtailArrow", new Map()], //燕尾箭头Entity集合
      ["RightAngleArrow", new Map()], //直角箭头Entity集合
      ["RoundRectangle", new Map()], //圆角矩形Entity集合
      ["PincerArrow", new Map()], //钳击箭头Entity集合
      ["AttackArrow", new Map()], //进攻箭头Entity集合
      ["AssemblePolygon", new Map()], //集结地Entity集合
      ["Flag", new Map()], //旗标Entity集合
      ["TextBox", new Map()], //文本框Entity集合
      ["FreeLine", new Map()], //自由线Entity集合
      ["Polyline", new Map()], //折线Entity集合
      ["Curve", new Map()], //圆滑曲线Entity集合
      ["FreePolygon", new Map()], //自由面Entity集合
      ["Polygon", new Map()], //多边形Entity集合
      ["RegularPolygon", new Map()], //正多边形Entity集合
      ["DefenseLine", new Map()], //防御集合
      ["Surface", new Map()], // 临时面集合
      ["Line", new Map()], // 临时线集合
    ]);
    // 关闭Cesium默认双击实体会调用trackedEntity方法
    viewer.trackedEntity = undefined;
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  }

  /**
   * 实体复制功能
   * */
  copyEntityAdd(entity) {
    return new Promise((resolve) => {
      let plottingJson = null;
      if (entity.GeoType === "Flag") {
        plottingJson = this.FlagClass.copyFlagToJson(entity);
      } else if (entity.GeoType === "TextBox") {
        plottingJson = this.TextBoxClass.copyTextBoxJson(entity);
      } else {
        plottingJson = this.getMilitaryToJson(entity);
        const camera = this.viewer.camera;
        const cameraHeight = camera.positionCartographic.height;
        // 进行位置偏移
        let offset = {};
        offset.x = cameraHeight * 0.0000001;
        offset.y = cameraHeight * 0.0000001;
        plottingJson.position.forEach((point) => {
          point[0] += offset.x;
          point[1] += offset.y;
        });
        plottingJson.id = uuid.uuid();
        plottingJson.availability =
          dateUtils.parseDateToString(
            "yyyy-MM-ddTHH:mm:ssZ",
            new Date(plottingJson.startTime)
          ) +
          "/" +
          dateUtils.parseDateToString(
            "yyyy-MM-ddTHH:mm:ssZ",
            plottingJson.endTime
          );
      }
      const showEntity = this.showPlottingForData(plottingJson);
      resolve(showEntity);
    });
  }

  /**
   * 存储编辑对象，并开始编辑
   * @param entity
   */
  storageEntity(entity) {
    if (entity.GeoType === "Flag" || entity.GeoType === "TextBox") return;
    this.activeEditEntity = entity;
    this.destroyEditHandler();
    this._preEntity = entity;
    this._editHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    switch (entity.GeoType) {
      case "AttackArrow":
        this.AttackArrowClass.editAttackArrow(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "LineArrow":
        this.LineArrowClass.editLineArrow(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "CurveArrow":
        this.CurveArrowClass.editCurveArrow(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "SwallowtailArrow":
        this.SwallowtailArrowClass.editSwallowtailArrow(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "PincerArrow":
        this.PincerArrowClass.editPincerArrow(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "AssemblePolygon":
        this.AssembleClass.editAssemble(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "DefenseLine":
        this.DefenseLineClass.editDefenseLine(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "Polygon":
        this.PolygonClass.editPolygon(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "CurvedPolygon":
        this.CurvePolygonClass.editCurvedPolygon(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "Polyline":
        this.PolylineClass.editPolyline(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "Curve":
        this.CurveLineClass.editCurveLine(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "RightAngleArrow":
        this.RightAngleArrowClass.editRightAngleArrow(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      case "RoundRectangle":
        this.RoundRectangleClass.editRoundRectangle(
          this.viewer,
          entity,
          this._editHandler,
          this._editCollection
        );
        break;
      default:
        break;
    }
    if (this._editCollection[0]) {
      this.editEntityArr.push(this._editCollection[0]);
    }
  }

  /**
   * 创建编辑事件
   * @param {String} currentId 当前编辑实体Id
   */
  editEvent(currentId) {
    const entity = this.viewer.entities.getById(currentId);
    if (entity.GeoType === "Flag" || entity.GeoType === "TextBox") return;
    this._moveHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this._moveHandler.setInputAction(
      function (movement) {
        const endPos = movement.endPosition;
        let pick = this.viewer.scene.pick(endPos);
        if (Cesium.defined(pick) && pick.id) {
          const pickEntity = pick.id;
          if (
            pickEntity.GeoType &&
            pickEntity.Editable &&
            pickEntity.id === currentId
          ) {
            this.viewer.container.style.cursor = "pointer";
            showToolTip(pickEntity.GeoType, this._toolTip, endPos, true);
          } else {
            this.viewer.container.style.cursor = "default";
            removeToolTip(this._toolTip);
          }
          if (
            pickEntity.GeoType &&
            (pickEntity?.GeoType.includes("Edit") ||
              pickEntity?.GeoType.includes("EditPoint"))
          ) {
            this.viewer.container.style.cursor = "pointer";
            showToolTip(pickEntity.GeoType, this._toolTip, endPos, true);
          }
        } else {
          this.viewer.container.style.cursor = "default";
          removeToolTip(this._toolTip);
        }
      }.bind(this),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this._moveHandler.setInputAction(
      function (event) {
        const pos = event.position;
        let pick = this.viewer.scene.pick(pos);
        if (Cesium.defined(pick) && pick.id) {
          const pickEntity = pick.id;
          if (
            pickEntity.GeoType &&
            pickEntity.Editable &&
            pickEntity.id === currentId &&
            pickEntity.id.indexOf("edit_") < 0
          ) {
            this.resetPick();
            this.storageEntity(pickEntity);
          }
        } else {
          const showEntity = this._editCollection[0].target;
          if (showEntity.polygon) {
            //判断标绘类型
            updateEntityToStaticProperties(showEntity, false);
          } else if (showEntity.polyline) {
            updateEntityToStaticProperties(showEntity, true);
          }
          this.resetPick();
          this._preEntity = undefined;
        }
      }.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  }

  /**
   * 循环去重
   */
  loopDeduplication() {
    const uniqueArray = Array.from(
      new Map(this.editEntityArr.map((item) => [item.id, item])).values()
    );
    this.editEntityArr = [];
    uniqueArray.forEach((item) => {
      if (item) {
        this.editEntityArr.push(item);
      }
    });
  }

  /**
   * 编辑过程对象数组。将当前编辑外的所有编辑实体删除
   */
  deleteShowEntity() {
    this.loopDeduplication(); //数组去重
    this.editEntityArr.forEach((item) => {
      if (this.activeEditEntity.id === item.target.id) {
        console.log(item.target.name);
      } else {
        item.target.show = false;
        item.source.show = true;
        this.editEntityArr.push(item);
        this.removeProcessObj(item.processEntities);
        this.viewer.entities.removeById(item.target.id);
      }
    });
  }

  /**
   * 重置点选状态
   */
  resetPick() {
    const item = this._editCollection.find((ele) => {
      return ele.id === this._preEntity?.id;
    });
    if (item) {
      this.loopDeduplication(item);
      item.source.show = true;
      item.target.show = false;
      this.removeProcessObj(item.processEntities);
    }
  }

  /**
   * 移除过程对象
   * @param items
   */
  removeProcessObj(items) {
    items?.forEach((ele) => {
      this.viewer.entities.remove(ele);
    });
    items = [];
  }

  destroyEditHandler() {
    if (this._editHandler) {
      this._editHandler.destroy();
    }
  }

  /**
   * 注销
   */
  destroy() {
    this._moveHandler?.destroy();
    this.destroyEditHandler();
    this._preEntity = undefined;
    this._editCollection = [];
    removeToolTip(this._toolTip);
  }

  /**
   * 根据数据渲染标绘
   *
   * @param {*} options 相关参数
   * */
  showPlottingForData(options) {
    switch (options.geoType) {
      case "AttackArrow":
        return new Promise((resolve, reject) => {
          this.AttackArrowClass.showAttackArrow(options).then(
            (entity) => {
              this.situationMap.get("AttackArrow").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "LineArrow":
        return new Promise((resolve, reject) => {
          this.LineArrowClass.showLineArrow(options).then(
            (entity) => {
              this.situationMap.get("LineArrow").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "CurveArrow":
        return new Promise((resolve, reject) => {
          this.CurveArrowClass.showCurveArrow(options).then(
            (entity) => {
              this.situationMap.get("CurveArrow").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "SwallowtailArrow":
        return new Promise((resolve, reject) => {
          this.SwallowtailArrowClass.showSwallowtailArrow(options).then(
            (entity) => {
              this.situationMap.get("SwallowtailArrow").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "PincerArrow":
        return new Promise((resolve, reject) => {
          this.PincerArrowClass.showPincerArrow(options).then(
            (entity) => {
              this.situationMap.get("PincerArrow").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "AssemblePolygon":
        return new Promise((resolve, reject) => {
          this.AssembleClass.showAssemble(options).then(
            (entity) => {
              this.situationMap.get("AssemblePolygon").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "DefenseLine":
        return new Promise((resolve, reject) => {
          this.DefenseLineClass.showDefenseLine(options).then(
            (entity) => {
              this.situationMap.get("DefenseLine").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "Polygon":
        return new Promise((resolve, reject) => {
          this.PolygonClass.showPolygon(options).then(
            (entity) => {
              this.situationMap.get("Polygon").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "CurvedPolygon":
        return new Promise((resolve, reject) => {
          this.CurvePolygonClass.showCurvePolygon(options).then(
            (entity) => {
              this.situationMap.get("CurvedPolygon").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "Polyline":
        return new Promise((resolve, reject) => {
          this.PolylineClass.showPolyline(options).then(
            (entity) => {
              this.situationMap.get("Polyline").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "Curve":
        return new Promise((resolve, reject) => {
          this.CurveLineClass.showCurveLine(options).then(
            (entity) => {
              this.situationMap.get("Curve").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "RightAngleArrow":
        return new Promise((resolve, reject) => {
          this.RightAngleArrowClass.showRightAngleArrow(options).then(
            (entity) => {
              this.situationMap.get("RightAngleArrow").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "RoundRectangle":
        return new Promise((resolve, reject) => {
          this.RoundRectangleClass.showRoundRectangle(options).then(
            (entity) => {
              this.situationMap.get("RoundRectangle").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "Flag":
        return new Promise((resolve, reject) => {
          this.FlagClass.showFlag(options).then(
            (entity) => {
              this.situationMap.get("Flag").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      case "TextBox":
        return new Promise((resolve, reject) => {
          this.TextBoxClass.showTextBox(options).then(
            (entity) => {
              this.situationMap.get("TextBox").set(entity.id, entity);
              this.viewer.resource.set(
                entity.id,
                this.getMilitaryToJson(entity)
              );
              resolve(entity);
            },
            (error) => reject(error)
          );
        });
      default:
        return new Promise((resolve, reject) => {
          reject("没有该类型标绘：" + options.name);
        });
    }
  }

  /**
   * 创建集结地
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateAssemble(options) {
    return new Promise((resolve, reject) => {
      this.AssembleClass.createAssemble(options).then(
        (entity) => {
          this.situationMap.get("AssemblePolygon").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 创建进攻箭头
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateAttackArrow(options) {
    return new Promise((resolve, reject) => {
      this.AttackArrowClass.createAttackArrow(options).then(
        (entity) => {
          this.situationMap.get("AttackArrow").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建多边形
   * @param {*} options 参数{id，color}
   * @return Promise
   * */
  CreatePolygon(options) {
    return new Promise((resolve, reject) => {
      this.PolygonClass.createPolygon(options).then(
        (entity) => {
          this.situationMap.get("Polygon").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建闭合曲面
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateCurvedPolygon(options) {
    return new Promise((resolve, reject) => {
      this.CurvePolygonClass.createCurvedPolygon(options).then(
        (entity) => {
          this.situationMap.get("CurvedPolygon").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建圆滑曲线
   * @param {*} options 参数{id，color，width}
   * @return Promise
   */
  CreateCurve(options) {
    return new Promise((resolve, reject) => {
      this.CurveLineClass.createCurveLine(options).then(
        (entity) => {
          this.situationMap.get("Curve").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建笔直折线
   * @param {*} options 参数{id，color，width}
   * @return Promise
   */
  CreatePolyline(options) {
    return new Promise((resolve, reject) => {
      this.PolylineClass.createPolyline(options).then(
        (entity) => {
          this.situationMap.get("Polyline").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建钳击箭头
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreatePincerArrow(options) {
    return new Promise((resolve, reject) => {
      this.PincerArrowClass.createPincerArrow(options).then(
        (entity) => {
          this.situationMap.get("PincerArrow").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建圆角矩形
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateRoundRectangle(options) {
    return new Promise((resolve, reject) => {
      this.RoundRectangleClass.createRoundRectangle(options).then(
        (entity) => {
          this.situationMap.get("RoundRectangle").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建旗帜
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateFlag(options) {
    return new Promise((resolve, reject) => {
      this.FlagClass.createFlag(options).then(
        (entity) => {
          this.situationMap.get("Flag").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建文本框
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateTextBox(options) {
    return new Promise((resolve, reject) => {
      options.name = options.name || this._getDefaultName("TextBox");
      this.TextBoxClass.createTextBox(options).then(
        (entity) => {
          this.situationMap.get("TextBox").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建直角箭头
   * @param {*} options 参数{id，color}
   * @return Promise
   */
  CreateRightAngleArrow(options) {
    return new Promise((resolve, reject) => {
      this.RightAngleArrowClass.createRightAngleArrow(options).then(
        (entity) => {
          this.situationMap.get("RightAngleArrow").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建简单箭头-直线
   * @param {*} options {color，id，width，straight}
   * @return Promise
   */
  CreateLineArrow(options) {
    return new Promise((resolve, reject) => {
      this.LineArrowClass.createLineArrow(options).then(
        (entity) => {
          this.situationMap.get("LineArrow").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建简单箭头-曲线
   * @param {*} options {color，id，width，straight}
   * @return Promise
   */
  CreateCurveArrow(options) {
    return new Promise((resolve, reject) => {
      this.CurveArrowClass.createCurveArrow(options).then(
        (entity) => {
          this.situationMap.get("CurveArrow").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建燕尾箭头
   * @param {*} options {id，color}
   * @return Promise
   */
  CreateSwallowtailArrow(options) {
    return new Promise((resolve, reject) => {
      this.SwallowtailArrowClass.createSwallowtailArrow(options).then(
        (entity) => {
          this.situationMap.get("SwallowtailArrow").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 创建防御
   * @param {*} options {id，color}
   * @return Promise
   */
  CreateDefenseLine(options) {
    return new Promise((resolve, reject) => {
      this.DefenseLineClass.createDefenseLine(options).then(
        (entity) => {
          this.situationMap.get("DefenseLine").set(entity.id, entity);
          this.viewer.resource.set(entity.id, this.getMilitaryToJson(entity));
          entity.name = this._getDefaultName(entity.GeoType);
          resolve(entity);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 根据 id 删除实体
   *
   * @param {string} id 实体 id
   * */
  removeById(id) {
    const entity = this.viewer.entities.getById(id);
    this.viewer.entities.removeById(id);
    this.viewer.animations.values().forEach((item) => item.delete(id));
    this.situationMap.get(entity.GeoType).delete(id);
    this.viewer.resource.delete(id);
  }

  /**
   * 清除所有创建的对象
   */
  removeAll() {
    for (const [type, map] of this.situationMap) {
      for (const [key] of map) {
        this.viewer.entities.removeById(key);
        this.viewer.animations.values().forEach((item) => item.delete(key));
        this.viewer.resource.delete(key);
      }
      this.situationMap.set(type, new Map());
    }
  }

  /**
   * 获取态势箭头 Json 数据
   *
   * @param {*} entity 实体
   * */
  getMilitaryToJson(entity) {
    switch (entity.GeoType) {
      case "AttackArrow":
        return this.AttackArrowClass.getAttackArrowJson(entity);
      case "LineArrow":
        return this.LineArrowClass.getLineArrowJson(entity);
      case "CurveArrow":
        return this.CurveArrowClass.getCurveArrowJson(entity);
      case "SwallowtailArrow":
        return this.SwallowtailArrowClass.getSwallowtailArrowJson(entity);
      case "PincerArrow":
        return this.PincerArrowClass.getPincerArrowJson(entity);
      case "AssemblePolygon":
        return this.AssembleClass.getAssembleJson(entity);
      case "DefenseLine":
        return this.DefenseLineClass.getDefenseLineJson(entity);
      case "Polygon":
        return this.PolygonClass.getPolygonJson(entity);
      case "CurvedPolygon":
        return this.CurvePolygonClass.getCurvePolygonJson(entity);
      case "Polyline":
        return this.PolylineClass.getPolylineJson(entity);
      case "Curve":
        return this.CurveLineClass.getCurveLineJson(entity);
      case "RightAngleArrow":
        return this.RightAngleArrowClass.getRightAngleArrowJson(entity);
      case "RoundRectangle":
        return this.RoundRectangleClass.getRoundRectangleJson(entity);
      case "Flag":
        return this.FlagClass.getFlagJson(entity);
      case "TextBox":
        return this.TextBoxClass.getTextBoxJson(entity);
      default:
        return null;
    }
  }

  /**
   * 编辑态势标绘
   *
   * @param {*} source    资源实体
   * @param {*} options   相关参数 {name: 海军, ...}
   *
   * option: {
   *     id: "1"  实体 id
   *     name: "海军"  图标名称
   *     camp: 0 阵营  0：我方  1：敌方
   *     color: rgba(255, 255, 255, 1)  图标颜色
   *     ...
   * }
   * */
  editMilitaryPlotting(source, options) {
    switch (source.GeoType) {
      case "AttackArrow":
        this.AttackArrowClass.editAttackArrowData(source, options);
        break;
      case "LineArrow":
        this.LineArrowClass.editLineArrowData(source, options);
        break;
      case "CurveArrow":
        this.CurveArrowClass.EditCurveArrowData(source, options);
        break;
      case "SwallowtailArrow":
        this.SwallowtailArrowClass.editSwallowtailArrowData(source, options);
        break;
      case "PincerArrow":
        this.PincerArrowClass.editPincerArrowData(source, options);
        break;
      case "AssemblePolygon":
        this.AssembleClass.editAssembleData(source, options);
        break;
      case "DefenseLine":
        this.DefenseLineClass.editDefenseLineData(source, options);
        break;
      case "Polygon":
        this.PolygonClass.editPolygonData(source, options);
        break;
      case "CurvedPolygon":
        this.CurvePolygonClass.editCurvePolygonData(source, options);
        break;
      case "Polyline":
        this.PolylineClass.editPolylineData(source, options);
        break;
      case "Curve":
        this.CurveLineClass.editCurveLineData(source, options);
        break;
      case "RightAngleArrow":
        this.RightAngleArrowClass.editRightAngleArrowData(source, options);
        break;
      case "RoundRectangle":
        this.RoundRectangleClass.editRoundRectangleData(source, options);
        break;
      case "Flag":
        this.FlagClass.editFlagData(source, options);
        break;
      case "TextBox":
        this.TextBoxClass.editTextBoxData(source, options);
        break;
      default:
        break;
    }
  }

  /**
   * 设置生长线
   * @param growthDuration 生长时间 秒
   * @param cartesianPositions 笛卡尔数组
   * @param startTime 当前实体的开始时间
   * */
  setGrowthLineDuration(growthDuration, cartesianPositions, startTime) {
    return new Cesium.CallbackProperty((time) => {
      const elapsedSeconds = Cesium.JulianDate.secondsDifference(
        time,
        startTime
      ); //计算秒数差异
      const progress = elapsedSeconds / growthDuration;
      return cartesianPositions.slice(
        0,
        Math.ceil(progress * cartesianPositions.length)
      );
    }, false);
  }

  growArrowTest(id) {
    const entity = this.viewer.entities?.getById(id);
    const arrowPoints = entity.PottingPoint;

    // // 初始插值参数
    let t = 0;
    // 创建CallbackProperty来生成动态的多边形坐标
    const dynamicPositions = new Cesium.CallbackProperty(() => {
      // 在回调函数中逐渐增加插值参数
      t += 0.005; // 调整步长以控制生长速度

      // 当插值参数大于等于1时，停止生长
      if (t >= 1) {
        t = 1; // 确保插值参数为1，以避免生长过程继续
      }

      // 计算插值点
      const currentPoints = arrowPoints.map((point, index) => {
        const startPoint =
          index > 0 ? arrowPoints[index - 1] : arrowPoints[index];
        return Cesium.Cartesian3.lerp(
          startPoint,
          point,
          t,
          new Cesium.Cartesian3()
        );
      });
      // let points = this.getAttackArrowPoints(currentPoints);

      let points = this.computeSwallowtailArrow(currentPoints, true);
      return new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArrayHeights(points)
      );

      // return new Cesium.PolygonHierarchy(points);
    }, false);
    // 创建CallbackProperty来生成动态的线坐标
    entity.polyline.positions = new Cesium.CallbackProperty(() => {
      // 在回调函数中逐渐增加插值参数
      t += 0.005; // 调整步长以控制生长速度

      // 当插值参数大于等于1时，停止生长
      if (t >= 1) {
        t = 1; // 确保插值参数为1，以避免生长过程继续
      }

      // 计算插值点
      const currentPoints = arrowPoints.map((point, index) => {
        const startPoint =
          index > 0 ? arrowPoints[index - 1] : arrowPoints[index];
        return Cesium.Cartesian3.lerp(
          startPoint,
          point,
          t,
          new Cesium.Cartesian3()
        );
      });

      let linePositions = this.computeSwallowtailArrow(currentPoints, true);
      const points = Cesium.Cartesian3.fromDegreesArrayHeights(linePositions);

      // let points = this.getAttackArrowPoints(currentPoints);
      return points.concat(points[0]);
    }, false);
    entity.polygon.hierarchy = dynamicPositions;
  }

  computeSwallowtailArrow(anchorpoints, swallow) {
    let p0 = plottingUtils.transformCartesianToWGS84(anchorpoints[0]);
    let p1 = anchorpoints[1]
      ? plottingUtils.transformCartesianToWGS84(anchorpoints[1])
      : { x: p0.x + 0.00001, y: p0.y + 0.00001, z: p0.z };
    let x0 = p0.x;
    let y0 = p0.y;
    let x1 = p1.x;
    let y1 = p1.y;
    let xt = (15.8 * x1 + 3.2 * x0) / 19;
    let yt = (15.8 * y1 + 3.2 * y0) / 19;
    let ap = new Array(7);
    ap[0] = { x: x1, y: y1 };
    ap[1] = {
      x: xt + (0.85 / 3.2) * (y1 - yt),
      y: yt - (0.85 / 3.2) * (x1 - xt),
    };
    ap[2] = {
      x: xt + (0.25 / 3.2) * (y1 - yt),
      y: yt - (0.25 / 3.2) * (x1 - xt),
    };
    ap[3] = { x: x0 + (1.6 / 19) * (y1 - y0), y: y0 - (1.6 / 19) * (x1 - x0) };
    ap[4] = swallow
      ? { x: (3.2 * x1 + 15.8 * x0) / 19, y: (3.2 * y1 + 15.8 * y0) / 19 }
      : undefined;
    ap[5] = { x: x0 - (1.6 / 19) * (y1 - y0), y: y0 + (1.6 / 19) * (x1 - x0) };
    ap[6] = {
      x: xt - (0.25 / 3.2) * (y1 - yt),
      y: yt + (0.25 / 3.2) * (x1 - xt),
    };
    ap[7] = {
      x: xt - (0.85 / 3.2) * (y1 - yt),
      y: yt + (0.85 / 3.2) * (x1 - xt),
    };
    let degress = [];
    for (let index = 0; index < ap.length; index++) {
      const ele = ap[index];
      ele && degress.push(ele.x, ele.y, 0);
    }
    return degress;
  }

  /** 获取 态势标绘 列表 */
  getMilitaryToList() {
    const result = [];
    const linearAndSurfaceEntities = this.viewer.entities.values.filter(
      (entity) => {
        return entity.type === "situation";
      }
    );
    linearAndSurfaceEntities.forEach(
      function (entity) {
        result.push(this.getMilitaryToJson(entity));
      }.bind(this)
    );
    return result;
  }

  /** 设置虚线材质*/
  setLineMaterial(color) {
    return new Cesium.PolylineDashMaterialProperty({
      color: color, // 设置虚线的颜色
      // gapColor:Cesium.Color.YELLOW,   //间隙颜色
      dashLength: 30.0, // 设置虚线段的长度
      dashPattern: 255.0, // 设置虚线的模式，这里使用一个8位二进制数来表示虚线和间隙
    });
  }

  /** 设置发光线材质*/
  setGlowLine(color) {
    return new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.1,
      color: color,
    });
  }

  /**
   * 获取默认名称
   * */
  _getDefaultName(geoType) {
    let entityName = null;
    switch (geoType) {
      case "AttackArrow":
        entityName =
          "AttackArrow" +
          (
            "000" +
            (Array.from(this.situationMap.get("AttackArrow")).length + 1)
          ).substr(-3);
        break;
      case "LineArrow":
        entityName =
          "LineArrow" +
          (
            "000" +
            (Array.from(this.situationMap.get("LineArrow")).length + 1)
          ).substr(-3);
        break;
      case "CurveArrow":
        entityName =
          "CurveArrow" +
          (
            "000" +
            (Array.from(this.situationMap.get("CurveArrow")).length + 1)
          ).substr(-3);
        break;
      case "SwallowtailArrow":
        entityName =
          "SwallowtailArrow" +
          (
            "000" +
            (Array.from(this.situationMap.get("SwallowtailArrow")).length + 1)
          ).substr(-3);
        break;
      case "PincerArrow":
        entityName =
          "PincerArrow" +
          (
            "000" +
            (Array.from(this.situationMap.get("PincerArrow")).length + 1)
          ).substr(-3);
        break;
      case "AssemblePolygon":
        entityName =
          "AssemblePolygon" +
          (
            "000" +
            (Array.from(this.situationMap.get("AssemblePolygon")).length + 1)
          ).substr(-3);
        break;
      case "DefenseLine":
        entityName =
          "DefenseLine" +
          (
            "000" +
            (Array.from(this.situationMap.get("DefenseLine")).length + 1)
          ).substr(-3);
        break;
      case "Polygon":
        entityName =
          "Polygon" +
          (
            "000" +
            (Array.from(this.situationMap.get("Polygon")).length + 1)
          ).substr(-3);
        break;
      case "CurvedPolygon":
        entityName =
          "CurvedPolygon" +
          (
            "000" +
            (Array.from(this.situationMap.get("CurvedPolygon")).length + 1)
          ).substr(-3);
        break;
      case "FreePolygon":
        entityName =
          "FreePolygon" +
          (
            "000" +
            (Array.from(this.situationMap.get("FreePolygon")).length + 1)
          ).substr(-3);
        break;
      case "Polyline":
        entityName =
          "Polyline" +
          (
            "000" +
            (Array.from(this.situationMap.get("Polyline")).length + 1)
          ).substr(-3);
        break;
      case "Curve":
        entityName =
          "Curve" +
          (
            "000" +
            (Array.from(this.situationMap.get("Curve")).length + 1)
          ).substr(-3);
        break;
      case "RightAngleArrow":
        entityName =
          "RightAngleArrow" +
          (
            "000" +
            (Array.from(this.situationMap.get("RightAngleArrow")).length + 1)
          ).substr(-3);
        break;
      case "RoundRectangle":
        entityName =
          "RoundRectangle" +
          (
            "000" +
            (Array.from(this.situationMap.get("RoundRectangle")).length + 1)
          ).substr(-3);
        break;
      case "RegularPolygon":
        entityName =
          "RegularPolygon" +
          (
            "000" +
            (Array.from(this.situationMap.get("RegularPolygon")).length + 1)
          ).substr(-3);
        break;
      case "FreeLine":
        entityName =
          "FreeLine" +
          (
            "000" +
            (Array.from(this.situationMap.get("FreeLine")).length + 1)
          ).substr(-3);
        break;
      case "Flag":
        entityName =
          "Flag" +
          (
            "000" +
            (Array.from(this.situationMap.get("Flag")).length + 1)
          ).substr(-3);
        break;
      case "TextBox":
        entityName =
          "TextBox" +
          (
            "000" +
            (Array.from(this.situationMap.get("TextBox")).length + 1)
          ).substr(-3);
        break;
      default:
        break;
    }
    return entityName;
  }
}

export default SituationPlotting;
