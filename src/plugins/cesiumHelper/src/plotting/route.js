import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as routeTools from "../common/routeTools"
import * as plottingUtils from "../common/plottingUtils";
import toolTips from "../common/reminderTip";
import {
    computeCurveLinePoints,
    computeCurvePathPoints,
    updateEntityToStaticProperties
} from "./tool/plottingTools";

const Cesium = window.Cesium

/**
 * 路线标绘类
 *
 * 包含路线标绘相关方法
 * @author: tzx
 * @date: 2023/8/6
 * */
class RoutePlotting {

    viewer = null

    routeMap = null
    //路径配置
    routePath = []
    //路径名称
    pathName = ""
    //路径点
    originalPoint = []
    //路径编辑点
    originalEditPoint = []
    //标绘图标
    routeIco = []

    constructor(viewer) {

        this.viewer = viewer

        this.routeMap = new Map()
    }

    /**
     * 创建路径标绘线
     *
     * @param  options 路径线配置 颜色等
     * */
    createRoutePlotTest(options) {
        const id = options?.id || uuid.uuid();
        const curveLine = computeCurvePathPoints(options.map(point => plottingUtils.latitudeAndLongitudeToDegrees(point)))
        const entity = this.viewer.entities.add({
            id: id,
            name: 'Curve',
            type: "route",
            PottingPoint: options,
            sort: options?.sort || 1,
            data: options?.data || null,
            show: options?.show instanceof Array ? true : options?.show === undefined ? true : options.show,
            availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
            polyline: {
                material: Cesium.Color.RED,
                positions: curveLine,
                width: 2,
                clampToGround: true,
            }
        });
        if (options?.show instanceof Array) entity.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
        this.routeMap.set(entity.id, entity)
        this.viewer.resource.set(id, this.getRouteToJson(entity))
        return entity
    }

    createRoutePlot(options) {
        return new Promise((resolve, reject) => {
            const id = options?.id || uuid.uuid();
            const exist = this.viewer.entities.getById(id)
            if (exist) reject(exist)

            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
            window.toolTip = '左键点击开始绘制';

            let anchorpoints = [];
            let polyline = undefined;
            handler.setInputAction((event) => {
                window.toolTip = '左键添加点，右键撤销，左键双击结束绘制';
                let pixPos = event.position;
                let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, pixPos);
                if (!cartesian) return;
                if (anchorpoints.length === 0) {
                    anchorpoints.push(cartesian)
                    const ico = this.viewer.entities.add({
                        id: uuid.uuid(),
                        name: '起点',
                        type: "image",
                        availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                        position: cartesian,
                        data: options?.data,
                        sort: options?.sort || 1,
                        billboard: {
                            image: require("../../static/route/route-start.png"),
                            colorBlendMode: Cesium.ColorBlendMode.REPLACE,
                        },
                        label: {
                            text: "点1",
                            font: "15px sans-serif",
                            // 字体边框
                            outline: true,
                            outlineWidth: 5,
                            fillColor: Cesium.Color.YELLOW,
                            outlineColor: Cesium.Color.BLACK,
                            pixelOffset: new Cesium.Cartesian2(0, -30),
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            show: true
                        }
                    });
                    this.routeIco.push(ico)
                } else {
                    const ico = this.viewer.entities.add({
                        id: uuid.uuid(),
                        name: '途径点',
                        type: "image",
                        availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                        position: cartesian,
                        data: options?.data,
                        sort: options?.sort || 1,
                        billboard: {
                            image: require("../../static/route/router-via.png"),
                            colorBlendMode: Cesium.ColorBlendMode.REPLACE,
                        },
                        label: {
                            text: "点" + (this.routeIco.length + 1),
                            font: "15px sans-serif",
                            // 字体边框
                            outline: true,
                            outlineWidth: 5,
                            fillColor: Cesium.Color.YELLOW,
                            outlineColor: Cesium.Color.BLACK,
                            pixelOffset: new Cesium.Cartesian2(0, -30),
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            show: true
                        }
                    });
                    this.routeIco.push(ico)
                }
                anchorpoints.push(cartesian);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // 鼠标移动事件
            handler.setInputAction((movement) => {
                let endPos = movement.endPosition;
                toolTips(window.toolTip, endPos, true);
                if (anchorpoints.length > 0) {
                    if (!Cesium.defined(polyline)) {
                        polyline = this.viewer.entities.add({
                            id: id,
                            name: 'Curve',
                            type: "situation",
                            data: options?.data,
                            sort: options?.sort || 1,
                            show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                            availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                            polyline: {
                                positions: new Cesium.CallbackProperty(function () {
                                    return computeCurveLinePoints(anchorpoints)
                                }, false),
                                width: 2,
                                material: Cesium.Color.fromCssColorString(options.polylineColor),
                                clampToGround: true,
                            }
                        });
                        polyline.GeoType = 'Curve'; //记录对象的类型，用户后续编辑等操作
                        polyline.Editable = true; //代表当前对象可编辑,false状态下不可编辑
                    } else {
                        anchorpoints.pop();
                        let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, endPos);
                        anchorpoints.push(cartesian);
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            // 左键双击事件
            handler.setInputAction(async (event) => {
                anchorpoints.pop();
                anchorpoints.pop(); //因为是双击结束，所以要pop两次，一次是move的结果，一次是单击结果
                polyline.PottingPoint = Cesium.clone(anchorpoints, true); //记录对象的节点数据，用户后续编辑等操作
                polyline.EditingPoint = Cesium.clone(anchorpoints, true); //记录复杂对象的编辑的节点数据，用户后续编辑等操作
                const icoLenghth = this.routeIco.length
                const lastIco = this.routeIco[icoLenghth - 1]
                const nextIco = this.routeIco[icoLenghth - 2]
                if (lastIco) {
                    this.viewer.entities.removeById(nextIco.id);
                    this.routeIco.splice(icoLenghth - 2, 1)
                    lastIco.billboard.image = require("../../static/route/route-end.png")
                    lastIco.label.text = "点" + (this.routeIco.length)
                }
                handler.destroy();
                toolTips(window.toolTip, event.position, false);
                updateEntityToStaticProperties(polyline, true)
                this.routeMap.set(polyline.id, polyline)
                this.viewer.resource.set(polyline.id, this.getRouteToJson(polyline))
                const points = polyline.polyline.positions.getValue()
                const heightPoint = await this.getTerrainHeight(points)
                polyline.polyline.positions = heightPoint.map(point => plottingUtils.latitudeAndLongitudeToDegrees(point))
                if (options?.show instanceof Array) polyline.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                resolve(polyline)
            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            // 右键摁下事件
            handler.setInputAction(() => {
                anchorpoints.pop();
            }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
        })
    }
    /**
     * 获取经纬度所在地高度
     *
     * @param  point 经纬度数组
     * */
    getTerrainHeight(point) {
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        const heights = [];
        const PointsLan = point.map(point => plottingUtils.degreesToLatitudeAndLongitude(point))
        for (const point of PointsLan) {
            const cartographic = Cesium.Cartographic.fromDegrees(point[0], point[1]);
            const surface = ellipsoid.scaleToGeodeticSurface(cartographic);
            const pointCartesian = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, surface.height);
            const direction = Cesium.Cartesian3.subtract(pointCartesian, this.viewer.camera.positionWC, new Cesium.Cartesian3());
            Cesium.Cartesian3.normalize(direction, direction);
            // 射线
            const ray = new Cesium.Ray(this.viewer.camera.positionWC, direction);
            // 检测射线与地形的交点
            const intersection = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            if (intersection) {
                // 交点位置
                const intersectionCartographic = ellipsoid.cartesianToCartographic(intersection);
                // 高度
                const height = intersectionCartographic.height;
                //为原数组添加高度
                point[2] = height
                heights.push(height);
            } else {
                console.warn('未能找到地形高度');
                heights.push(null);
            }
        }
        return PointsLan;
    }


    /**
     * 处理路径数据
     *
     * @param options options 路径名、类型、点、时间等
     * */
    handlePathData(options) {
        this.routePath = []
        this.originalPoint = options.path
        this.originalEditPoint = options.editPoint
        options.tablePath.forEach((data) => {
            this.routePath.push({
                times: {
                    start: data.startTime,
                    end: data.endTime
                },
                start: data.start,
                end: data.end,
                state: data.state
            })
        })
        this.splitPathByCompositionPoints();
        return this._getPathPoint()
    }

    /**
     * 为实体绑定运动路径
     *
     * @param  entity 绑定实体
     * @param options 传入所有点和所有时间
     * */
    bindRunPath(entity, options) {
        options.polyline = options.polyline.flat()
        options.times = options.times.flat()
        // console.log(options)
        const positionProperty = new Cesium.SampledPositionProperty();
        for (let i = 0; i < options.polyline.length - 1; i++) {
            const time = Cesium.JulianDate.fromIso8601(options.times[i]);
            const position = Cesium.Cartesian3.fromDegrees(options.polyline[i][0], options.polyline[i][1], options.polyline[i][2]);
            positionProperty.addSample(time, position);
        }
        entity.position = positionProperty

    }

    /** 按比例分割所有路径点 */
    splitPathByCompositionPoints() {
        this.routePath.forEach((path) => {
            // 如果起始索引和结束索引相同则表示暂停 取两次结束点即可
            if (path.start === path.end) {
                let endIndex = Math.floor((path.end / (this.originalEditPoint.length - 1)) * this.originalPoint.length)
                endIndex = endIndex > 0 ? endIndex + 1 : 0
                path.line = [this.originalPoint[endIndex], this.originalPoint[endIndex]]
                let times = routeTools.generateTime(path, path.line)
                path.times = times
                return
            }
            let startIndex = Math.floor((path.start / (this.originalEditPoint.length - 1)) * this.originalPoint.length)
            let endIndex = Math.floor((path.end / (this.originalEditPoint.length - 1)) * this.originalPoint.length)
            endIndex = endIndex > 0 ? endIndex + 1 : 0
            // 当前段所有点坐标
            const currentArr = this.originalPoint.slice(startIndex, endIndex)
            path.line = currentArr
            let times = routeTools.generateTime(path, path.line)
            path.times = times
        })
    }

    /**
     * 根据数据展示路径
     *
     * @param options {*} 相关参数
     * */
    showPlottingForData(options) {
        return new Promise((resolve, reject) => {
            let entity = this.routeMap.get(options.id)
            if (entity) {
                reject("该实体已经存在， 不能重复加载")
            } else {
                const positions = options.polyline.map(position => plottingUtils.latitudeAndLongitudeToDegrees(position));
                entity = this.viewer.entities.add({
                    id: uuid.uuid(),
                    name: options.name,
                    GeoType: options.geoType,
                    Editable: true,
                    data: options.data,
                    sort: options.sort || 1,
                    availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime, 5)),
                    type: "situation",
                    show: options.show instanceof Array ? true : options.show,
                    polyline: {
                        material: Cesium.Color.RED,
                        positions: positions,
                        width: 2,
                        clampToGround: true
                    },
                    EditingPoint: options.memory.editPoint?.map(point => plottingUtils.latitudeAndLongitudeToDegrees(point)),
                });
                if (options.show instanceof Array) entity.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                this.routeMap.set(options.id, entity)
                this.viewer.resource.set(options.id, this.getRouteToJson(entity))
                resolve(entity)
            }
        })
    }

    /**
     * 改变实体的生存时间
     *
     * @param options {*} 相关参数
     * */
    changeAvailability(options) {
        const entity = this.viewer.entities.getById(options.id);
        entity.availability = new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: Cesium.JulianDate.fromIso8601(options.startTime),
                stop: Cesium.JulianDate.fromIso8601(options.endTime)
            })
        ]);
    }
    /**
     * 判断实体是否存实体是否能够运动
     *
     * @param id {*} 实体id
     * */
    showEntityPath(id){
        const entity = this.viewer.entities.getById(id);
        return entity.position instanceof Cesium.SampledPositionProperty
    }
    /** 根据 id 查询道路实体 */
    getRouteById(id) {
        return this.routeMap.get(id)
    }

    /** 移除路径 */
    removeById(id) {
        this.viewer.entities.removeById(id)
        this.viewer.resource.delete(id)
        this.routeMap.delete(id)
        this.viewer.resource.delete(id)
    }

    /** 移除所有路径 */
    removeAll() {
        for (const [, entity] of this.routeMap) {
            this.viewer.entities.removeById(entity.id)
        }
    }

    /**
     * 获取 道路 Json数据据
     *
     * @param {*} entity 实体
     * */
    getRouteToJson(entity) {
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        return {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            data: entity.data || null,
            sort: entity.sort,
            startTime: startTime,
            endTime: endTime,
            show: entity.polyline.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.polyline.distanceDisplayCondition.getValue())] : entity.show,
            material: entity.material,
            // position: entity.children.map(children => children.polyline.positions.getValue().map(item => plottingUtils.degreesToLatitudeAndLongitude(item))),
            position: entity.PottingPoint
        }
    }

    /**
     * 获取运动实体路径点
     *
     * @param {*} entity 实体
     */
    _getPathPoint() {
        let pathData = {
            name: this.pathName,
            type: "draw",
            polyline: [],
            keyPoints: this.originalEditPoint.map(point => plottingUtils.degreesToLatitudeAndLongitude(point)),
            times: []
        };
        for (let i = 0; i < this.routePath.length; i++) {
            let times = this.routePath[i].times;
            let positions = this.routePath[i].line
            pathData.polyline.push(positions.map(point => plottingUtils.degreesToLatitudeAndLongitude(point)));
            pathData.times.push(times)
        }
        return pathData;
    }

    /**
     * 获取资源列表
     * */
    getRouteToList() {
        const result = []
        for (const [, value] of this.routeMap) {
            result.push(this.getRouteToJson(value))
        }
        return result
    }
}

export default RoutePlotting
