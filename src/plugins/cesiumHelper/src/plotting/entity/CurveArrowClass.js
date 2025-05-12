import * as plottingUtils from "../../common/plottingUtils";
import * as dateUtils from "../../common/dateUtils";
import * as uuid from "../../common/uuid"
import toolTips from "../../common/reminderTip";
import {computeCurveLinePoints, lockingMap, updateEntityToStaticProperties} from "../tool/plottingTools";
import {setGlowLine, setLineMaterial} from "../material/officialMaterial";
import "../../../lib/graphical/material/PolylineDashArrowMaterialProperty"
import {colorFormat} from "../color/colorFormat";

const Cesium = window.Cesium

/**
 * 创建曲线箭头标绘类
 */
class CurveArrowClass {
    viewer = null

    constructor(viewer) {
        this.viewer = viewer
    }

    /**
     * 创建曲线箭头标绘
     * @param {Array} [options]  相关参数
     */
    createCurveArrow(options) {
        return new Promise((resolve, reject) => {
            const id = options.id || uuid.uuid();
            const exist = this.viewer.entities.getById(id)
            if (exist) reject(exist)

            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
            window.toolTip = '点击鼠标左键开始绘制, 按ESC取消标绘';
            let anchorpoints = [];
            let polyline = undefined;
            let linePoints;

            // 左键点击事件
            handler.setInputAction((event) => {
                window.toolTip = '左键添加点，右键撤销，双击鼠标左键或按回车键结束绘制, 按ESC取消标绘';
                let pixPos = event.position;
                let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, pixPos);
                if (!cartesian) return;
                if (anchorpoints.length === 0) {
                    anchorpoints.push(cartesian);
                }
                anchorpoints.push(cartesian);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // 鼠标移动事件
            handler.setInputAction((movement) => {
                let endPos = movement.endPosition;
                toolTips(window.toolTip, endPos, true);
                if (anchorpoints.length > 0) {
                    if (!Cesium.defined(polyline)) {
                        linePoints = computeCurveLinePoints(anchorpoints)
                        polyline = this.viewer.entities.add({
                            name: 'CurveArrow',
                            id: id,
                            type: "situation",
                            groupId: this.viewer.root.id,
                            data: options.data,
                            sort: options.sort || 1,
                            availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                            polyline: {
                                positions: new Cesium.CallbackProperty(function () {
                                    return linePoints;
                                }, false),
                                width: 15,
                                material: options.material.line.style === "solid" ? new Cesium.PolylineArrowMaterialProperty(
                                    Cesium.Color.fromCssColorString(options.material.border.color)
                                ) : new Cesium.PolylineDashArrowMaterialProperty({
                                    color: Cesium.Color.fromCssColorString(options.material.line.color),
                                    gapColor: Cesium.Color.TRANSPARENT,
                                    dashLength: 30.0,
                                    dashPattern: 255.0
                                }),
                                clampToGround: options.material.line.style === "solid",
                            }
                        });
                        polyline.GeoType = 'CurveArrow'; //记录对象的类型，用户后续编辑等操作
                        polyline.Editable = true; //代表当前对象可编辑,false状态下不可编辑
                    } else {
                        anchorpoints.pop();
                        let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, endPos);
                        anchorpoints.push(cartesian);
                        linePoints = computeCurveLinePoints(anchorpoints)
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            // 左键双击事件
            handler.setInputAction((event) => {
                anchorpoints.pop();
                anchorpoints.pop(); //因为是双击结束，所以要pop两次，一次是move的结果，一次是单击结果
                polyline.PottingPoint = Cesium.clone(anchorpoints, true); //记录对象的节点数据，用户后续编辑等操作
                handler.destroy();
                toolTips(window.toolTip, event.position, false);
                updateEntityToStaticProperties(polyline, true)
                if (options?.show instanceof Array){
                    polyline.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                }
                document.removeEventListener('keydown', cancel)
                document.addEventListener('keydown', enterEnd)
                resolve(polyline)
            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            // 右键摁下事件
            handler.setInputAction(() => {
                anchorpoints.pop();
            }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
            const cancel = (e) => {
                if (e.key === 'Escape') {
                    this.viewer.entities.remove(polyline)
                    handler.destroy();
                    toolTips(window.toolTip, null, false);
                    document.removeEventListener('keydown', cancel)
                    document.addEventListener('keydown', enterEnd)
                    reject("取消标绘")
                }
            }
            const enterEnd = (e) => {
                if (e.key === 'Enter') {
                    polyline.PottingPoint = Cesium.clone(anchorpoints, true); //记录对象的节点数据，用户后续编辑等操作
                    handler.destroy();
                    toolTips(window.toolTip, event.position, false);
                    updateEntityToStaticProperties(polyline, true)
                    if (options?.show instanceof Array){
                        polyline.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                    }
                    document.addEventListener('keydown', cancel)
                    document.addEventListener('keydown', enterEnd)
                    resolve(polyline)
                }
            }
            document.addEventListener('keydown', cancel)
            document.addEventListener('keydown', enterEnd)
        })
    }

    /**
     * 编辑曲线箭头标绘
     * @param {Cesium.Viewer} viewer 该viewer带有实体编辑的信息
     * @param {Cesium.Entity} entity  编辑实体
     * @param {Cesium.ScreenSpaceEventHandler} handler 事件处理函数
     * @param {Array} collection 实体集和
     *
     */
    editCurveArrow(viewer, entity, handler, collection) {
        let editItem = collection.find((ele) => {
            return ele.id === entity.id;
        });
        let editEntity;
        let sourcePos = entity.PottingPoint;
        if (!sourcePos) {
            return
        }
        let updatePos = Cesium.clone(sourcePos, true);
        entity.show = false;
        let dynamicPos = new Cesium.CallbackProperty(() => {
            return computeCurveLinePoints(updatePos)
        }, false);
        if (editItem) {
            editEntity = editItem.target;
            editEntity.show = true;
            editEntity.polyline.position = dynamicPos;
            editItem.processEntities = initVertexEntities();
        } else {
            const newPolyline = Cesium.clone(entity.polyline);
            newPolyline.positions = dynamicPos;
            editEntity = viewer.entities.add({
                GeoType: 'EditCurveArrow',
                Editable: true,
                id: 'edit_' + entity.id,
                polyline: newPolyline,
            });
            //编辑状态让实体贴地
            editEntity.polyline.clampToGround = true
            entity.showEditEntityId = editEntity.id
            const vertexs = initVertexEntities();

            collection.push({
                id: entity.id,
                source: entity,
                target: editEntity,
                geoType: 'remix_curve',
                processEntities: vertexs,
            });
        }
        let boolDown = false; //鼠标左键是否处于摁下状态
        let currentPickVertex = undefined; //当前选择的要编辑的节点
        let currentPickPolyline = undefined; //当前选择的要移动的折线
        handler.setInputAction((event) => {
            boolDown = true;
            let pick = viewer.scene.pick(event.position);
            if (Cesium.defined(pick) && pick.id) {
                const pickEntity = pick.id;
                editEntity.polyline.positions = dynamicPos
                if (!pickEntity.GeoType || !pickEntity.Editable) {
                    return;
                }
                if (pickEntity.GeoType === 'CurveArrowEditPoints') {
                    lockingMap(viewer, false);
                    currentPickVertex = pickEntity;
                } else if (pickEntity.GeoType === 'EditCurveArrow') {
                    lockingMap(viewer, false);
                    currentPickPolyline = pickEntity;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        // 鼠标移动事件
        handler.setInputAction((event) => {
            if (boolDown && currentPickVertex) {
                let pos = plottingUtils.getCatesian3FromPX(viewer, event.endPosition);
                if (pos) {
                    updatePos[currentPickVertex.description.getValue()] = pos;
                } else {
                    console.log("=======================================点不存在")
                }
            }
            if (boolDown && currentPickPolyline) {
                let startPosition = plottingUtils.getCatesian3FromPX(viewer, event.startPosition);
                let endPosition = plottingUtils.getCatesian3FromPX(viewer, event.endPosition);
                if (startPosition && endPosition) {
                    let changed_x = endPosition.x - startPosition.x;
                    let changed_y = endPosition.y - startPosition.y;
                    let changed_z = endPosition.z - startPosition.z;
                    updatePos.forEach((element) => {
                        element.x = element.x + changed_x;
                        element.y = element.y + changed_y;
                        element.z = element.z + changed_z;
                    });
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // 左键抬起事件
        handler.setInputAction(() => {
            if(entity.height){
                let points =editEntity.polyline.positions.getValue();
                points = this._changHeight(points,entity.height,true)
                entity.polyline.positions =  points
                entity.polyline.clampToGround = false
            }else {
                entity.polyline.positions = editEntity.polyline.positions.getValue()
            }
            currentPickVertex = undefined;
            currentPickPolyline = undefined;
            lockingMap(viewer, true);
            entity.PottingPoint = Cesium.clone(updatePos, true);
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        // 左键点击事件
        handler.setInputAction((event) => {
            let pick = viewer.scene.pick(event.position);
            if (Cesium.defined(pick) && pick.id) {
                if (pick.id.GeoType === 'CurveArrowEditCenterPoints') {
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
                if (pick.id.GeoType === 'CurveArrowEditPoints') {
                    if (updatePos.length < 3) {
                        alert('折线节点数不能少于2个');
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
                add ? updatePos.splice(index, 0, pos) : updatePos.splice(index, 1);
                item.processEntities = initVertexEntities();
            }
        }

        function initVertexEntities() {
            let vertexPointsEntity = []; //中途创建的Point对象
            let centerPointsEntity = []; //中途创建的虚拟Point对象
            for (let index = 0; index < updatePos.length; index++) {
                let point = viewer.entities.add({
                    id: 'edit_' + uuid.uuid(),
                    position: new Cesium.CallbackProperty(function () {
                        return updatePos[index];
                    }, false),
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.fromCssColorString("rgba(28, 25, 124,0.6)"),
                        outlineWidth: 2,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        outlineColor: Cesium.Color.fromCssColorString("rgba(175, 172, 170,0.8)"),
                    },
                    show: true,
                    description: index, //记录节点索引
                });
                point.GeoType = 'CurveArrowEditPoints';
                point.Editable = true;
                vertexPointsEntity.push(point);
                if (updatePos[index + 1]) {
                    let centerPoint = viewer.entities.add({
                        id: 'edit_' + uuid.uuid(),
                        position: new Cesium.CallbackProperty(function () {
                            return Cesium.Cartesian3.midpoint(
                                updatePos[index],
                                updatePos[index + 1],
                                new Cesium.Cartesian3()
                            );
                        }, false),
                        point: {
                            pixelSize: 8,
                            color: Cesium.Color.fromCssColorString("rgba(11,154,97,0.6)"),
                            outlineWidth: 2,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            outlineColor: Cesium.Color.fromCssColorString("rgba(175, 172, 170,0.8)"),
                        },
                        show: true,
                        description: index, //记录节点索引
                    });
                    centerPoint.GeoType = 'CurveArrowEditCenterPoints';
                    centerPoint.Editable = true;
                    centerPointsEntity.push(centerPoint);
                }
            }
            let processEntities = vertexPointsEntity.concat(centerPointsEntity);
            return processEntities;
        }
    }

    /**
     * 根据数据生成实体
     * @param {Array} options 实体数据导入
     */
    showCurveArrow(options) {
        return new Promise((resolve, reject) => {
            let entity = this.viewer.entities.getById(options.id)
            if (entity) {
                reject(entity)
                console.log("该实体已经存在， 不能重复加载")
            } else {
                const plottingPoints = options.position.map(position => plottingUtils.latitudeAndLongitudeToDegrees(position));
                const degreesPositions = computeCurveLinePoints(plottingPoints).map(item=>{
                    const temp = plottingUtils.degreesToLatitudeAndLongitude(item)
                    temp[2] = options.material?.line?.height||0
                    return plottingUtils.latitudeAndLongitudeToDegrees(temp)
                })
                entity = this.viewer.entities.add({
                    id: options.id,
                    name: options.name,
                    GeoType: options.geoType,
                    Editable: true,
                    groupId: options.groupId,
                    availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                    type: "situation",
                    data: options.data,
                    sort: options.sort || 1,
                    height:options.material.line.height,
                    polyline: {
                        material: this._createLineStyle(options.material.line.style, options.material.line.color),
                        positions: degreesPositions,
                        width: options.material?.line?.width || 15,
                        clampToGround:options.material?.line?.height ? false : true,
                    },
                    PottingPoint: plottingPoints,
                    show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                });
            }
            if (options.show instanceof Array){
                entity.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            if (options.animation !== undefined && options.animation != null){
                entity.animation = entity.animation || {}
                if (options.animation.flicker){
                    entity.animation.flicker = options.animation.flicker
                    this.viewer.animations.get("flicker").set(entity.id, entity)
                }
            }
            resolve(entity)
        })
    }

    /**
     * 修改实体
     * @param {Cesium.Entity} source 修改数据的实体
     * @param {Array} options 修改实体数据
     */
    EditCurveArrowData(source, options) {
        // 编辑状态实体
        const showEditEntity = this.viewer.entities.getById(source.showEditEntityId)
        // 修改 实体 名称
        "name" in options && (source.name = options.name)
        //修改实体阵营
        "groupId" in options && (source.groupId = options.groupId)
        // 修改 实体 数据id
        "data" in options && (source.data = options.data)
        // 修改 实体 顺序
        "sort" in options && (source.sort = options.sort)
        //是否贴地 设置高度
        "height" in options && (this._changHeight(source,options.height,false))
        // 控制实体显隐
        if ('show' in options){
            if (options.show instanceof Array){
                source.show = true
                source.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            } else {
                source.show = options.show
            }
        }
        // 修改实体有效期
        if ("availability" in options) {
            source.availability.removeAll(); // 移除所有时间间隔
            source.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
        }
        // 修改 实体 阵营
        if ("camp" in options){
            source.camp = options.camp
            const bc = options.camp === 0 ? "rgba(255, 0, 0, .8)" : options.camp === 1 ? "rgba(0, 0, 255, .8)" : "rgba(0, 255, 0, .8)"
            source.polyline.material = new Cesium.PolylineArrowMaterialProperty(
                Cesium.Color.fromCssColorString(bc)
            )
            showEditEntity.polyline.material = new Cesium.PolylineArrowMaterialProperty(
                Cesium.Color.fromCssColorString(bc)
            )
        }
        // 修改材质
        if ("material" in options){
            const material = options.material
            // 线材质
            if (material.line){
                const line = material.line
                // 线颜色
                if (line.color){
                    const color = Cesium.Color.fromCssColorString(line.color)
                    if (source?.polyline.material instanceof Cesium.PolylineDashMaterialProperty) {
                        source.polyline.material = setLineMaterial(color)
                        showEditEntity.polyline.material = setLineMaterial(color)
                    } else if (source?.polyline.material instanceof Cesium.PolylineGlowMaterialProperty) {
                        source.polyline.material = setGlowLine(color)
                        showEditEntity.polyline.material = setGlowLine(color)
                    } else if (source?.polyline.material instanceof Cesium.PolylineArrowMaterialProperty) {
                        source.polyline.material = new Cesium.PolylineArrowMaterialProperty(color)
                        showEditEntity.polyline.material = new Cesium.PolylineArrowMaterialProperty(color)
                    } else {
                        source.polyline.material = color
                        showEditEntity.polyline.material = color
                    }
                }
                // 线样式
                if (line.style){
                    const style = line.style
                    const outline = source.polyline.material.getValue()
                    source.polyline.material = this._createLineStyle(style, outline.color)
                    showEditEntity.polyline.material = this._createLineStyle(style, outline.color)
                }
                // 线宽
                if (line.width){
                    source.polyline.width = line.width
                    showEditEntity.polyline.width = line.width
                }
            }
        }
        //修改动画时间
        if (options.animation !== undefined && options.animation != null){
            source.animation = source.animation || {}
            if (options.animation.flicker){
                source.animation.flicker = options.animation.flicker
                this.viewer.animations.get("flicker").set(source.id, source)
            } else {
                delete source.animation["flicker"]
                this.viewer.animations.get("flicker").delete(source.id)
            }
        }
        this.viewer.resource.set(source.id, this.getCurveArrowJson(source))
    }

    /**
     * 导出态势箭头 Json 数据
     *
     * @param {*} entity 实体
     * */
    getCurveArrowJson(entity) {
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        const temp = {
            id: entity.id,
            name: entity.name,
            camp:entity.camp || 0,
            data: entity.data || null,
            sort: entity.sort,
            type: entity.type,
            groupId: entity.groupId,
            geoType: entity.GeoType,
            startTime: startTime,
            endTime: endTime,
            show: entity.polyline.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.polyline.distanceDisplayCondition.getValue())] : entity.show,
            label: entity?.label?.text
        }
        let lineType = ""
        if (entity?.polyline.material instanceof Cesium.PolylineDashMaterialProperty) {
            lineType = "dashed"
        } else if (entity?.polyline.material instanceof Cesium.PolylineGlowMaterialProperty) {
            lineType = "glow"
        } else {
            lineType = "solid"
        }
        const colorObj = entity.polyline.material.color.getValue()
        temp['material'] = {
            line: {
                style: lineType,
                color: colorFormat(colorObj),
                height:entity?.height,
                width:entity.polyline.width.getValue(),
                show: entity.polyline?.show?.getValue()
            }
        }
        if (entity.animation){
            temp["animation"] = {}
            if (entity.animation.flicker) temp["animation"]["flicker"] = entity.animation.flicker
        }
        temp['position'] = entity.PottingPoint.map(point => plottingUtils.degreesToLatitudeAndLongitude(point))
        return temp
    }

    /**
     * 设置生长线
     * @param growthDuration 生长时间 秒
     * @param cartesianPositions 笛卡尔数组
     * @param startTime 当前实体的开始时间
     * */
    setGrowthLineDuration(growthDuration, cartesianPositions, startTime) {
        return new Cesium.CallbackProperty((time) => {
            const elapsedSeconds = Cesium.JulianDate.secondsDifference(time, startTime); //计算秒数差异
            const progress = elapsedSeconds / growthDuration;
            return cartesianPositions.slice(0, Math.ceil(progress * cartesianPositions.length));
        }, false)
    }

    /**
     * 创建边框或线样式 材质
     *
     * 实线、虚线、发光线
     * */
    _createLineStyle(type, color){
        color = color instanceof Cesium.Color ? colorFormat(color) : color
        if (type === "solid") {
            return new Cesium.PolylineArrowMaterialProperty(Cesium.Color.fromCssColorString(color))
        } else if (type === "dashed") {
            return setLineMaterial(Cesium.Color.fromCssColorString(color))
        } else if (type === "glow"){
            return setGlowLine(Cesium.Color.fromCssColorString(color))
        } else {
            return null
        }
    }
    /**
     * 改变实体的高度
     * @param  source 修改数据的实体，编辑时为实体点
     * @param  height 修改实体数据的高度
     * @param  isEdit 是否处于编辑状态
     * */
    _changHeight(source,height,isEdit){
        if(isEdit){
            let currentHeight = source.map(points=>{
                let currentHeight = plottingUtils.degreesToLatitudeAndLongitude(points)
                currentHeight[2] = height
                return plottingUtils.latitudeAndLongitudeToDegrees(currentHeight);
            })
            return currentHeight
        }else {
            // 获取当前的顶点坐标
            const currentPositions = source.polyline.positions.getValue(this.viewer.clock.currentTime);
            if (!Cesium.defined(currentPositions) ) return
            // 修改每个polygon顶点的高度
            let newPositions = currentPositions.map(cartesian=> {
                let currentHeight = plottingUtils.degreesToLatitudeAndLongitude(cartesian)
                currentHeight[2] = height
                return plottingUtils.latitudeAndLongitudeToDegrees(currentHeight);
            });
            source.polyline.clampToGround = height?false:true
            source.polyline.positions = newPositions
            source.height = height
        }
    }
}

export default CurveArrowClass
