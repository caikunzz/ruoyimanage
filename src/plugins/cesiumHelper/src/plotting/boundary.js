import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
const Cesium = window.Cesium

/**
 * 行政边界标绘类
 *
 * 包含边界标绘相关方法
 * @author: tzx
 * @date: 2023/8/6
 * */
class BoundaryPlotting {

    /** 视图 */
    viewer = null

    /** 标会实体字典 */
    boundaryMap = null

    /** 构造方法 */
    constructor(viewer) {
        this.viewer = viewer

        this.boundaryMap = new Map()
    }

    /**
     * 根据数据展示边界
     *
     * @param options {*} 相关参数
     * */
    showPlottingForData(options){
        return new Promise((resolve, reject) => {
            const id = options.id || uuid.uuid()
            options.availability = options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime, 5)
            let entity = this.boundaryMap.get(options.id)
            if (entity) {
                reject("实体已重复存在")
            } else {
                const children = options.position.map(ones=>{
                    return new Promise(resolve=>{
                        const outLine = ones.map(item => plottingUtils.latitudeAndLongitudeToDegrees(item))
                        const boundary = this.viewer.entities.add({
                            id: uuid.uuid(),
                            parentId: options.id,
                            entityId: id,
                            type: "boundary-polyline",
                            name: options.name+"-片段",
                            availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                            show: options.show instanceof Array ? true : options.show,
                            polyline: {
                                clampToGround:true,
                                positions: outLine,
                                material: new Cesium.PolylineDashMaterialProperty({
                                    color: Cesium.Color.fromCssColorString(options.material.border.color),
                                    // gapColor:Cesium.Color.YELLOW,
                                    dashLength: 15.0,
                                    dashPattern: 2047.0,
                                }),
                                width: 1,

                            }
                        })
                        if (options.show instanceof Array) boundary.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                        resolve(boundary)
                    })
                })
                Promise.all(children).then(entities=>{
                    entity = {
                        id: id,
                        type: "boundary",
                        data: options.data,
                        sort: options.sort || 1,
                        groupId: options.groupId || this.viewer.root.id,
                        camp: options.camp,
                        name: options.name,
                        material: options.material,
                        children: entities,
                        availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                        show: options.show === undefined || options.show == null ? true : options.show
                    }
                    this.boundaryMap.set(id, entity)
                    this.viewer.resource.set(id, this.getBoundaryToJson(entity))
                    resolve(entity)
                })
            }
        })
    }

    /** 编辑边界材质 */
    editBoundaryPlotting(source, options){
        // 修改 实体 名称
        "name" in options && (source.name = options.name)
        // 修改 实体 阵营
        "camp" in options && (source.camp = options.camp)
        // 修改 实体 分组
        "groupId" in options && options.groupId != null && (source.groupId = options.groupId)
        // 修改实体顺序
        "sort" in options && (source.sort = options.sort)
        // 修改实体数据id
        "data" in options && (source.data = options.data)
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
                // entity.polyline.show = options.material.border.show || false
                // entity.polygon.show = options.material.fill.show || false
                entity.polyline.material = Cesium.Color.fromCssColorString(options.material.border.color)
                entity.polygon.material = Cesium.Color.fromCssColorString(options.material.fill.color)
            }
        }
        this.viewer.resource.set(source.id, this.getBoundaryToJson(source))
    }

    /** 根据 id 查询河流实体 */
    getBoundaryById(id){
        return this.boundaryMap.get(id)
    }

    /**
     * 根据 id 删除元素
     *
     * @param {string} id 实体 id
     * */
    removeById(id) {
        for (let child of this.boundaryMap.get(id).children) {
            this.viewer.entities.removeById(child.id);
        }
        this.boundaryMap.delete(id)
        this.viewer.resource.delete(id)
    }

    /**
     * 移除当前所有河流实体
     * */
    removeAll(){
        for(const [key,] of this.boundaryMap){
            this.removeById(key)
        }
    }

    /**
     * 获取 边界 Json数据据
     *
     * @param {*} entity 实体
     * */
    getBoundaryToJson(entity){
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        return {
            id: entity.id,
            name: entity.name,
            type: "boundary",
            data: entity.data || null,
            sort: entity.sort,
            groupId: entity.groupId,
            camp: entity.camp || 0,
            startTime: startTime,
            endTime: endTime,
            show: entity.show,
            material: {
                border:{
                    color:entity.material.border.color
                },
                fill: {
                    color: entity.material.fill.color
                }
            },
            position: entity.children.map(children=>children.polyline.positions.getValue().map(item => plottingUtils.degreesToLatitudeAndLongitude(item))),
        }
    }

    /**
     * 获取资源列表
     * */
    getBoundaryToList(){
        const result = []
        for (const [, value] of this.boundaryMap) {
            result.push(this.getBoundaryToJson(value))
        }
        return result
    }

}

export default BoundaryPlotting
