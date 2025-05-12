import toolTips from "../common/reminderTip";
import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
import {julianDateToIso8602Times} from "../common/dateUtils";

const Cesium = window.Cesium

/**
 * 标签标绘类
 *
 * 包含标签标绘相关方法
 * @author: tzx
 * @date: 2023/8/6
 * */
class TagPlotting{
    /** 视图 */
    viewer = null

    /** 标会实体字典 */
    tagMap = null

    /** 构造方法 */
    constructor(viewer) {
        this.viewer = viewer
        this.tagMap = new Map()
    }
    /**
     * 创建标签
     *
     * @param options {*|?} 相关参数
     * */
    createTagPlot(options){
        return new Promise((res) => {
            const id = options?.id || uuid.uuid()
            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
            const toolTip = "选择标签位置"
            handler.setInputAction( (event) => {
                let pixPos = event.position;
                const cartesian = plottingUtils.getCatesian3FromPX(this.viewer, pixPos);
                const entity = this.viewer.entities.add({
                    id: id,
                    name: options?.name || this._getDefaultName(),
                    type: "tag",
                    data: options?.data,
                    sort: options?.sort || 1,
                    position: cartesian,
                    show: options?.show instanceof Array ? true : options?.show === undefined ? true : options.show,
                    billboard: {
                        image: require("../../static/tag/place.png"),
                        colorBlendMode: Cesium.ColorBlendMode.REPLACE, // 使用材质的颜色属性替换实体颜色属性
                    },
                });
                if (options?.show instanceof Array){
                    entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                }
                this.tagMap.set(id, entity)
                this.viewer.resource.set(id, entity)
                res(entity)
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.setInputAction( (event) => {
                toolTips(toolTip, event.endPosition, true);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.setInputAction((event) => {
                toolTips(toolTip, event.endPosition, false);
                handler.destroy();
            }, Cesium.ScreenSpaceEventType.LEFT_UP)
            const cancel = (e) => {
                if (e.key === 'Escape') {
                    this.viewer.entities.removeById(id)
                    handler.destroy();
                    toolTips(window.toolTip, null, false);
                    document.removeEventListener('keydown', cancel)
                    res("取消标绘")
                }
            }
            document.addEventListener('keydown', cancel)
        })
    }
    /**
     * 根据数据渲染标签
     *
     * @param {*} options 相关参数
     * */
    showPlottingForData(options) {
        return new Promise((resolve, reject) => {
            let entity = this.viewer.entities.getById(options.id)
            if (entity) {
                reject(entity)
                console.log("该实体已经存在， 不能重复加载")
            } else {
                const id = options?.id || uuid.uuid()
                entity = this.viewer.entities.add({
                    id: id,
                    name: options.name || this._getDefaultName(),
                    type: "tag",
                    data: options.data,
                    sort: options.sort || 1,
                    groupId: options.groupId || this.viewer.root.id,
                    show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                    availability: dateUtils.iso8602TimesToJulianDate(options?.availability || julianDateToIso8602Times(this.viewer.clock.currentTime)),
                    position: plottingUtils.latitudeAndLongitudeToDegrees(options.position),
                    billboard: {
                        image: require("../../static/tag/place.png"),
                        colorBlendMode: Cesium.ColorBlendMode.REPLACE, // 使用材质的颜色属性替换实体颜色属性
                    },
                });
            }
            if (options.show instanceof Array){
                entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            this.tagMap.set(options.id, entity)
            this.viewer.resource.set(options.id, this.getTagToJson(entity))
            resolve(entity)
        })
    }

    /**
     * 获取 标签 Json数据
     * */
    getTagToJson(entity){
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        return {
            id: entity.id,
            name: entity.name,
            type: "tag",
            data: entity.data || null,
            sort: entity.sort,
            groupId: entity.groupId,
            startTime: startTime,
            endTime: endTime,
            show: entity.billboard.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.billboard.distanceDisplayCondition.getValue())] : entity.show,
            material: entity.billboard?.color?.getValue().toCssColorString() || null,
            scale: entity.billboard?.scale?.getValue() || 0,
            angle: entity.billboard?.rotation?.getValue() || 1,
            position: plottingUtils.degreesToLatitudeAndLongitude(entity.position?.getValue(Cesium.JulianDate.now())),
            references: entity.billboard?.image.getValue()
        }
    }

    /**
     * 根据 id 删除标签
     *
     * @param {string} id 实体 id
     * */
    removeById(id) {
        this.viewer.entities.removeById(id);
        this.tagMap.delete(id)
        this.viewer.animations.values().forEach(item=>item.delete(id))
        this.viewer.resource.delete(id)
    }

    /**
     * 移除当前所有标签实体
     * */
    removeAll(){
        for (const [key,] of this.tagMap) {
            this.removeById(key)
        }
    }

    /**
     * 获取默认名称
     * */
    _getDefaultName() {
        return "标签" + ("000" + ( Array.from(this.tagMap.keys()).length+1)).substr(-3);
    }
}

export default TagPlotting
