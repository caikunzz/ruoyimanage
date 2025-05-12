import SuperGif from "../../lib/libgif";
import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
import {julianDateToIso8602Times} from "../common/dateUtils";
import * as entityRun from "../common/entityRun";

const Cesium = window.Cesium

class Particle {

    viewer = null

    particleMap = null

    constructor(viewer) {
        this.viewer = viewer
        this.particleMap = new Map()
    }

    createParticlePlot(options){
        let data = {
            references: options.url || options.references,
            position: options.position,
            name: this._getDefaultName(),
            availability: julianDateToIso8602Times(this.viewer.clock.currentTime, 5),
            show: true,
        }
        return new Promise((res, rej) => {
            this._createGifPlot(data).then(obj => {
                this.particleMap.set(obj.id, obj)
                this.viewer.resource.set(obj.id, this.getParticlesToJson(obj))
                res(obj)
            }, error => {
                rej(error)
            })
        })
    }

    //复制特效实体
    copyEntityAdd(entity){
        return new Promise((resolve, reject)=>{
            const particleJson = this.getParticlesToJson(entity)
            const camera = this.viewer.camera
            const cameraHeight = camera.positionCartographic.height;
            particleJson.id = uuid.uuid();
            // 进行位置偏移
            let offset = {}
            offset.x = cameraHeight * 0.0000001;
            offset.y = cameraHeight * 0.0000001;
            particleJson.position[0] += offset.x;
            particleJson.position[1] += offset.y;
            particleJson.availability = dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", new Date(particleJson.startTime)) + "/" + dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", particleJson.endTime)
            this.showPlottingForData(particleJson).then(entity=>{
                resolve(entity)
            }, error => {
                reject(error)
            })
        })
    }
    //编辑特效
    editParticle(source, options) {
        // 修改实体名称
        "name" in options && (source.name = options.name)
        // 修改实体分组
        "groupId" in options && (source.groupId = options.groupId)
        // 修改实体数据 id
        "data" in options && (source.data = options.data)
        // 修改实体顺序
        "sort" in options && (source.sort = options.sort)
        // 修改 实体 角度
        "angle" in options && (source.billboard.rotation = Cesium.Math.toRadians(options.angle))
        //修改实体大小
        "scale" in options && (source.billboard.scale = options.scale)
        // 修改可见性
        if ('show' in options){
            if (options.show instanceof Array){
                source.show = true
                source.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            } else {
                source.show = options.show
            }
        }
        // 修改实体有效期
        if ("availability" in options) {
            source.availability.removeAll(); // 移除所有时间间隔
            source.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
        }
        // 修改动画
        if (options.animation !== undefined && options.animation != null){
            source.animation = source.animation || {}
            if (options.animation.flicker){
                source.animation.flicker = options.animation.flicker
                this.viewer.animations.get("flicker").set(source.id, source)
            }  else {
                delete source.animation["flicker"]
                this.viewer.animations.get("flicker").delete(source.id)
            }
        }
        // 修改实体位置
        if ("position" in options) {
            if (options.position instanceof Array) {
                source.position = plottingUtils.latitudeAndLongitudeToDegrees(options.position)
            } else {
                source.position = entityRun.computedRunPoints(options)
            }
        }
        this.viewer.resource.set(source.id, this.getParticlesToJson(source))
    }

    /** 获取 动画 Json */
    getParticlesToJson(entity) {
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        const temp =  {
            id: entity.id,
            name: entity.name,
            type: "particle",
            camp: entity.camp || 0,
            groupId: entity.groupId,
            data: entity.data || null,
            sort: entity.sort,
            startTime: startTime,
            endTime: endTime,
            show: entity.billboard.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.billboard.distanceDisplayCondition.getValue())] : entity.show,
            label:entity.label?.text?.getValue(),
            memory: entity.memory,
            position: entity.position instanceof Cesium.SampledPositionProperty ? this._getPathPoint(entity) : plottingUtils.degreesToLatitudeAndLongitude(entity.position?.getValue(Cesium.JulianDate.now())) || null,
            angle: Cesium.Math.toDegrees(entity.billboard?.rotation?.getValue()),
            scale: entity.billboard?.scale?.getValue() || 0,
            references: entity.gifUrl,
            material: {}
        }
        if (entity.animation){
            temp["animation"] = {}
            if (entity.animation.flicker) temp["animation"]["flicker"] = entity.animation.flicker
        }
        return temp
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
                times: []
            };
            for (let i = 0; i < times.length; i++) {
                let time = times[i];
                let position = positionProperty.getValue(time);
                pathData.points.push(plottingUtils.degreesToLatitudeAndLongitude(position));
                pathData.times.push(time.toString());
            }
            return pathData;
        }
        return null
    }

    /**
     * 获取资源列表
     * */
    getParticlesToList() {
        const result = []
        for (const [, value] of this.particleMap) {
            result.push(this.getParticlesToJson(value))
        }
        return result
    }

    /**
     * 根据数据渲染gif
     *
     * @param {*} options 相关参数
     * */
    showPlottingForData(options) {
        return new Promise((resolve, reject) => {
            this._createGifPlot(options).then(res => resolve(res), () => reject(null))
        })

    }

    /**
     * 根据 id 删除元素
     *
     * @param {string} id 实体 id
     * */
    removeById(id) {
        this.viewer.entities.removeById(id);
        this.particleMap.delete(id)
        this.viewer.animations.values().forEach(item=>item.delete(id))
        this.viewer.resource.delete(id)
    }

    /**
     * 移除当前所有gif实体
     * */
    removeAll() {
        for (const [key,] of this.particleMap) {
            this.removeById(key)
        }
    }

    /**
     * 添加gif
     *
     * @param {*} options 配置项
     *
     */
    _createGifPlot(options) {
        return new Promise((resolve, reject) => {
            let div = document.createElement("div");
            let img = document.createElement("img");
            const id = options?.id || uuid.uuid();
            div.appendChild(img);
            img.src = options.references;
            img.onload = () => {
                let rub = new SuperGif({
                    gif: img
                });
                rub.load(() => {
                    const entity = this.viewer.entities.add({
                        id: id,
                        type: "particle",
                        name: options.name,
                        data: options.data,
                        sort: 1,
                        groupId: options.groupId || this.viewer.root.id,
                        gifUrl: options.references,
                        position: Cesium.Cartesian3.fromDegrees(options.position[0], options.position[1], options.position[2]),
                        availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                        show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                        billboard: {
                            image: new Cesium.CallbackProperty(() => {
                                return rub.get_canvas().toDataURL("image/png");
                            }, false),
                            rotation:Cesium.Math.toRadians(options.angle||0),
                            scaleByDistance: new Cesium.NearFarScalar(
                                500,
                                1.0,
                                2000,
                                0.1
                            ),
                        }
                    });
                    if (options.show instanceof Array){
                        entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                    }
                    if (options.animation !== undefined && options.animation != null){
                        entity.animation = entity.animation || {}
                        if (options.animation.flicker){
                            entity.animation.flicker = options.animation.flicker
                            this.viewer.animations.get("flicker").set(entity.id, entity)
                        }
                    }
                    this.particleMap.set(id, entity)
                    this.viewer.resource.set(id, this.getParticlesToJson(entity))
                    resolve(entity);
                });
            };
            img.onerror = (error) => {
                reject(error);
            };
        })
    }

    /**
     * 获取默认名称
     * */
    _getDefaultName() {
        return "particle" + ("000" + (Array.from(this.particleMap.keys()).length+1)).substr(-3);
    }
}

export default Particle
