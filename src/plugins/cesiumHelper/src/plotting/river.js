import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
import * as uuid from "../common/uuid";
const Cesium = window.Cesium

/**
 * 河流标绘类
 *
 * 包含河流标绘相关方法
 * @author: tzx
 * @date: 2023/8/6
 * */
class RiverPlotting {

    /** 视图 */
    viewer = null

    /** 标会实体字典 */
    riverMap = null

    /** 构造方法 */
    constructor(viewer) {
        this.viewer = viewer
        this.riverMap = new Map()
    }

    /**
     * 根据数据展示河流
     *
     * @param options {*} 相关参数
     * */
    showPlottingForData(options){
        return new Promise((resolve, reject) => {
            const id = options.id || uuid.uuid()
            let entity = this.riverMap.get(id)
            if (entity) {
                reject("该实体已经存在， 不能重复加载")
            } else {
                const availability = dateUtils.iso8602TimesToJulianDate(options.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime, 5))
                const polylines = options.position.polyline?.map(item => {
                    return new Promise(resolve=>{
                        const polyline = this.viewer.entities.add({
                            id: uuid.uuid(),
                            availability: availability,
                            entityId: id,
                            type: "river-polyline",
                            name: options.name+"-片段",
                            polyline: {
                                positions: item.map(item => plottingUtils.latitudeAndLongitudeToDegrees(item)),
                                material: new Cesium.PolylineGlowMaterialProperty({
                                    glowPower: 0.1,
                                    color: Cesium.Color.fromCssColorString(options?.material?.fill?.color || "rgba(16,57,255,0.5)"),
                                }),
                                width: options?.material?.line?.width || 15,
                                clampToGround: true,
                            },
                            show: options.show instanceof Array ? true : options.show,
                        });
                        if (options.show instanceof Array) polyline.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                        resolve(polyline)
                    })
                }) || []
                const polygons = options.position.polygon?.map(item => {
                    return new Promise(resolve=>{
                        const polygon = this.viewer.entities.add({
                            id: uuid.uuid(),
                            entityId: id,
                            availability: availability,
                            type: "river-polygon",
                            name: options.name+"-片段",
                            polygon: {
                                hierarchy: item.map(item => plottingUtils.latitudeAndLongitudeToDegrees(item)),
                                material: Cesium.Color.fromCssColorString(options?.material?.fill?.color || "rgba(16,57,255,0.5)"),
                            },
                            show: options.show instanceof Array ? true : options.show,
                        });
                        if (options.show instanceof Array) polygon.polygon.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                        resolve(polygon)
                    })
                }) || []
                const children = polylines.concat(polygons)
                Promise.all(children).then(entities=>{
                    const temp = {
                        id: id,
                        name: options.name,
                        data: options.data,
                        sort: options.sort || 1,
                        groupId: options?.groupId || this.viewer.root.id,
                        availability: availability,
                        type: "river",
                        material: {
                            fill: {
                                color: options.material?.fill?.color || "rgba(16,57,255,0.5)"
                            },
                            line: {
                                width: options.material?.line?.width || 15
                            }
                        },
                        children: entities,
                        show: options.show === undefined || options.show == null ? true : options.show
                    }
                    this.riverMap.set(id, temp)
                    this.viewer.resource.set(id, this.getRiverToJson(temp))
                    resolve(temp)
                })
            }
        })
    }

    /** 编辑 河流 标绘 */
    editRiverPlotting(source, options){
        "name" in options && (source.name = options.name)
        "groupId" in options && (source.groupId = options.groupId)
        "data" in options && (source.data = options.data)
        "sort" in options && (source.sort = options.sort)
        if ('show' in options){
            if (options.show instanceof Array){
                source.show = options.show
                for (let entity of source.children) {
                    entity.show = true
                    if (entity.polyline) entity.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                    if (entity.polygon) entity.polygon.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
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

        // 修改材质
        if ("material" in options){
            if (!source.material) source.material = {}

            const material = options.material
            // 填充
            if (material.fill){
                if (!source.material.fill) source.material.fill = {}

                const fill = material.fill
                // 填充颜色
                if (fill.color){
                    source.material.fill["color"] = fill.color

                    for (let entity of source.children) {
                        if (entity.polygon){
                            entity.polygon.material = Cesium.Color.fromCssColorString(fill.color)
                        }
                        if (entity.polyline){
                            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                                glowPower: 0.1,
                                color: Cesium.Color.fromCssColorString(fill.color),
                            })
                        }
                    }
                }
            }
            // 线段
            if (material.line){
                if (!source.material.line) source.material.line = {}

                const line = material.line
                if (line.width){
                    source.material.line["width"] = line.width

                    for (let entity of source.children) {
                        entity.polyline && (entity.polyline.width = line.width)
                    }
                }
            }
        }
        this.viewer.resource.set(source.id, this.getRiverToJson(source))
    }

    /** 根据 id 查询河流实体 */
    getRiverById(id){
        return this.riverMap.get(id)
    }

    /**
     * 根据 id 删除元素
     *
     * @param {string} id 实体 id
     * */
    removeById(id) {
        const paragraphs = this.riverMap.get(id).children
        paragraphs.forEach(item=>{
            this.viewer.entities.removeById(item.id)
        })
        this.riverMap.delete(id)
        this.viewer.resource.delete(id)
    }

    /**
     * 移除当前所有河流实体
     * */
    removeAll(){
        for(const [key,] of this.riverMap){
            this.removeById(key)
        }
    }

    /**
     * 获取 河流 Json数据据
     *
     * @param {*} entity 实体
     * */
    getRiverToJson(entity){
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        return {
            id: entity.id,
            name: entity.name,
            type: "river",
            groupId: entity.groupId,
            data: entity.data || null,
            sort: entity.sort,
            startTime: startTime,
            endTime: endTime,
            show: entity.show,
            material: {
                fill: {
                    color: entity.material.fill.color
                },
                line: {
                    width: entity.material.line.width
                }
            },
            position: {
                polyline: entity.children.filter(children=>children.type.indexOf("polyline")!==-1).map(children=>children.polyline.positions.getValue().map(item => plottingUtils.degreesToLatitudeAndLongitude(item))),
                polygon: entity.children.filter(children=>children.type.indexOf("polygon")!==-1).map(children=>children.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.map(item => plottingUtils.degreesToLatitudeAndLongitude(item)))
            }
        }
    }

    /**
     * 获取资源列表
     * */
    getRiverToList(){
        const result = []
        for (let [, value] of this.riverMap) {
            result.push(this.getRiverToJson(value))
        }
        return result
    }

}

export default RiverPlotting
