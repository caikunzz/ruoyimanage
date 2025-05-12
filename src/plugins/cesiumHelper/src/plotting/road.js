import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
const Cesium = window.Cesium
/**
 * 道路标绘类
 *
 * 包含道路标绘相关方法
 * @author: tzx
 * @date: 2023/8/6
 * */
class RoadPlotting{

    viewer = null

    roadMap = null

    constructor(viewer) {

        this.viewer = viewer

        this.roadMap = new Map()
    }

    /**
     * 根据数据展示道路
     *
     * @param options {*} 相关参数
     * */
    showPlottingForData(options){
        return new Promise((resolve, reject) => {
            const id = options.id || uuid.uuid()
            let entity = this.roadMap.get(id)
            if (entity) {
                reject("该实体已经存在， 不能重复加载")
            } else {
                const availability = dateUtils.iso8602TimesToJulianDate(options.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime, 5))
                const polylines = options.position.map(item => {
                    return new Promise(resolve=>{
                        const polyline = this.viewer.entities.add({
                            id: uuid.uuid(),
                            entityId: id,
                            availability: availability,
                            type: "road-polyline",
                            name: options.name+"-片段",
                            polyline: {
                                positions: item.map(item => plottingUtils.latitudeAndLongitudeToDegrees(item)),
                                material: new Cesium.PolylineGlowMaterialProperty({
                                    glowPower: 0.1,
                                    color: Cesium.Color.fromCssColorString(options.material.fill.color),
                                }),
                                width: 15,
                                clampToGround: true,
                            },
                            show: options.show instanceof Array ? true : options.show,
                        });
                        if (options.show instanceof Array) polyline.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                        resolve(polyline)
                    })
                })
                Promise.all(polylines).then(entities=>{
                    const temp = {
                        id: id,
                        name: options.name,
                        availability: availability,
                        type: "road",
                        data: options.data,
                        sort: options.sort || 1,
                        groupId: options.groupId || this.viewer.root.id,
                        material: options.material,
                        children: entities,
                        show: options.show === undefined || options.show == null ? true : options.show
                    }
                    this.roadMap.set(id, temp)
                    this.viewer.resource.set(id, this.getRoadToJson(temp))
                    resolve(temp)
                })
            }
        })
    }

    /** 编辑边界材质 */
    editRoadPlotting(source, options){
        // 修改 实体 名称
        "name" in options && (source.name = options.name)
        // 修改 实体 阵营
        "camp" in options && (source.camp = options.camp)
        // 修改 实体 分组
        "groupId" in options && (source.groupId = options.groupId)
        // 修改 实体 数据
        "data" in options && (source.data = options.data)
        // 修改 实体 顺序
        "sort" in options && (source.sort = options.sort)
        // 修改 实体 显隐
        if ('show' in options){
            if (options.show instanceof Array){
                source.show = options.show
                for (let entity of source.children) {
                    entity.show = true
                    entity.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                }
            } else {
                source.show = options.show
                for (let entity of source.children) {
                    entity.show = options.show
                }
            }
        }

        if ("availability" in options){
            source.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
            for (let entity of source.children) {
                entity.availability.removeAll(); // 移除所有时间间隔
                entity.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
            }
        }

        if ("material" in options){
            source.material = options.material
            for (let entity of source.children) {
                entity.polyline.material = Cesium.Color.fromCssColorString(options.material.fill.color)
            }
        }

        this.viewer.resource.set(source.id, this.getRoadToJson(source))
    }

    /** 根据 id 查询道路实体 */
    getRoadById(id){
        return this.roadMap.get(id)
    }

    /** 移除路径 */
    removeById(id){
        const paragraphs = this.roadMap.get(id).children
        paragraphs.forEach(item=>{
            this.viewer.entities.removeById(item.id)
        })
        this.roadMap.delete(id)
        this.viewer.resource.delete(id)
    }

    /** 移除所有路径 */
    removeAll(){
        for(const [key, ] of this.roadMap) {
            this.removeById(key)
        }
    }

    /**
     * 获取 道路 Json数据据
     *
     * @param {*} entity 实体
     * */
    getRoadToJson(entity){
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        return {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            groupId: entity.groupId,
            data: entity.data || null,
            sort: entity.sort,
            startTime: startTime,
            endTime: endTime,
            show: entity.show,
            material: entity.material,
            position: entity.children.map(children=>children.polyline.positions.getValue().map(item => plottingUtils.degreesToLatitudeAndLongitude(item))),
        }
    }

    /**
     * 获取资源列表
     * */
    getRoadToList(){
        const result = []
        for (const [,value] of this.roadMap) {
            result.push(this.getRoadToJson(value))
        }
        return result
    }
}

export default RoadPlotting
