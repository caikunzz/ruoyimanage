import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
import * as entityRun from "../common/entityRun";
import {julianDateToIso8602Times} from "../common/dateUtils";
import "../../lib/graphical/material/RaderWaveMaterialProperty"
import "../../lib/graphical/material/RaderLineMaterialProperty"
import  "../../lib/graphical/material/CircleWaveMaterialProperty";


const Cesium = window.Cesium

/**
 * 图片标绘类
 *
 * 包含图片标绘相关方法
 * 支持二维（相对屏幕）、三维（相对地球）显示
 * @author: tzx
 * @date: 2023/8/6
 * */
class Image {

    /** 视图 */
    viewer = null

    /** 图片字典 */
    imageMap = null


    /** 构造方法 */
    constructor(viewer) {
        this.viewer = viewer
        this.imageMap = new Map()
    }

    /**
     * 添加图片标绘
     * @param {*} [options]  其他相关参数
     */
    createImagePlot(options) {
        return new Promise((resolve) => {
            const id = options.id || uuid.uuid()
            /* 在屏幕中添加图形 */
            const entity = this.viewer.entities.add({
                id: id,
                name: options?.name || this._getDefaultName(),
                type: "image",
                data: options?.data,
                sort: 1,
                groupId: this.viewer.root.id,
                camp: options?.camp || 0,
                availability: dateUtils.iso8602TimesToJulianDate(options?.availability || julianDateToIso8602Times(this.viewer.clock.currentTime)),
                position: plottingUtils.latitudeAndLongitudeToDegrees(options.position),
                billboard: {
                    image: options.url,
                    colorBlendMode: Cesium.ColorBlendMode.REPLACE, // 使用材质的颜色属性替换实体颜色属性
                },
                label: {
                    font: "15px sans-serif",
                    outline: true,
                    outlineWidth: 5,
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    pixelOffset: new Cesium.Cartesian2(0, -30),
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                },
                memory: {},
                material: {},
                show: options?.show instanceof Array ? true : options?.show === undefined ? true : options.show,

            });
            if (options?.show instanceof Array) {
                entity.point.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            this.imageMap.set(id, entity)
            this.viewer.resource.set(id, this.getBillboardToJson(entity))
            resolve(entity)
        })
    }

    /**
     * 编辑图片属性
     *
     * @param {*} source    资源实体
     * @param {*} options   相关参数 {name: 海军, ...}
     *
     * option: {
     *     id: "1"  实体 id
     *     name: "海军"  图标名称
     *     camp: 0 阵营  0：我方  1：敌方
     *     scale: 1 放大倍数
     *     rotation: 1 角度
     *     color: rgba(255, 255, 255, 1)  图标颜色
     *     ...
     * }
     * */
    editImagePlot(source, options) {
        // 修改实体名称
        "name" in options && (source.name = options.name)
        // 修改实体编组
        "groupId" in options && (source.groupId = options.groupId)
        // 修改实体阵营
        "camp" in options != null && (source.camp = options.camp)
        // 修改实体顺序
        "sort" in options != null && (source.sort = options.sort)
        // 修改实体数据id
        "data" in options != null && (source.data = options.data)
        // 修改字体内容
        "label" in options && (source.label.text = options.label)
        // 修改 实体 角度
        "angle" in options && (source.billboard.rotation = Cesium.Math.toRadians(options.angle))
        // 修改 实体 尺寸
        if ("scale" in options) {
            source.billboard.scale = options.scale
            source.label.scale = options.scale
        }
        // 修改实体有效期
        if ("availability" in options) {
            source.availability.removeAll(); // 移除所有时间间隔
            source.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
        }
        //控制实体显隐
        if ('show' in options) {
            if (options.show instanceof Array) {
                source.show = true
                source.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                source.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            } else {
                source.show = options.show
            }
        }
        // 修改样式
        if ("material" in options) {
            const material = options.material
            const fontValue = source.label.font.getValue();
            const item = fontValue.split(' ');
            const size = parseFloat(item[item.length <= 2 ? 0 : 1]);
            const family = item[item.length - 1];
            // 文字
            if (material.text) {
                const text = material.text
                // 颜色
                if (text.color) source.label.fillColor = Cesium.Color.fromCssColorString(text.color)
                // 尺寸
                if (text.size) source.label.font = fontValue.includes('italic') ? 'italic' + " " + text.size + "px" + " " + family : text.size + "px" + " " + family
                // 轮廓
                if (text.outline) source.label.outlineColor = Cesium.Color.fromCssColorString(text.outline)
                // 字体 family
                if (text.family) source.label.font = fontValue.includes('italic') ? 'italic' + " " + size + "px" + " " + text.family : size + "px" + " " + text.family
                // 加粗 weight
                /** 待补充 */
                // if (text.position) source.label.pixelOffset = new Cesium.Cartesian2(text.position[0],text.position[1])
                /** 待补充 */
                // 斜体 italic
                if (text.italic) source.label.font = text.italic ? "italic " + source.label.font.getValue() : source.label.font.getValue().replace("italic", "").trim()
                // 文字显隐
                if (text.show !== undefined && text.show !== null) source.label.show = text.show
            }
            // 背景
            if (material.fill) {
                const fill = material.fill
                // 颜色
                if (fill.color) source.label.backgroundColor = Cesium.Color.fromCssColorString(fill.color)
                // 显示
                if (fill.show !== undefined && fill.show !== null) source.label.showBackground = fill.show
            }
            // 航迹线
            if (material.trackLine) {
                source.material.trackLine = options.material.trackLine || source.material.trackLine
                source.material.polyline.width = options.material.trackLine.width || 2
                source.polyline.color = Cesium.Color.fromCssColorString(options.material.trackLine.color) || "rgba(255,0,0,1)"
            }
            // 目标线
            if (material.targetLine){
                const targetLine = material.targetLine
                source.material.targetLine = {
                    color: targetLine.color || source.material.targetLine?.color || "rgba(255,255,255,1)",
                    width: targetLine.width || source.material.targetLine?.width || 2,
                    style: targetLine.style || source.material.targetLine?.style || "solid"
                }
            }
        }
        // 修改动画
        if (options.animation !== undefined && options.animation != null) {
            source.animation = source.animation || {}
            // 闪烁
            if (options.animation.flicker) {
                source.animation.flicker = options.animation.flicker
                this.viewer.animations.get("flicker").set(source.id, source)
            } else {
                delete source.animation["flicker"]
                this.viewer.animations.get("flicker").delete(source.id)
            }
            // 旋转
            if (options.animation.rotate) {
                source.animation.rotate = options.animation.rotate
                this.viewer.animations.get("rotate").set(source.id, source)
            } else {
                delete source.animation["rotate"]
                this.viewer.animations.get("rotate").delete(source.id)
            }
            // 缩放
            if (options.animation.scale) {
                source.animation.scale = options.animation.scale
                this.viewer.animations.get("scale").set(source.id, source)
            } else {
                delete source.animation["scale"]
                this.viewer.animations.get("scale").delete(source.id)
            }
            // 自动旋转
            if (options.animation.autoRotate) {
                source.animation.autoRotate = options.animation.autoRotate
                this.viewer.animations.get("autoRotate").set(source.id, source)
            } else {
                delete source.animation["autoRotate"]
                this.viewer.animations.get("autoRotate").delete(source.id)
            }
            // 目标线
            if(options.animation.targetLine){
                source.material.targetLine = {
                    color: source.material?.targetLine?.color || "rgba(255,255,255,1)",
                    width: source.material?.targetLine?.width || 2,
                    style: source.material?.targetLine?.style || "solid"
                }
                source.animation.targetLine = options.animation.targetLine
                this.viewer.animations.get("targetLine").set(source.id,source)
            }else {
                delete source.animation["targetLine"]
                this.viewer.animations.get("targetLine").delete(source.id)
            }
            // 修改航迹线
            if(options.animation.trackLine){
                source.material.trackLine = {}
                source.material.trackLine.style =  "solid"
                source.material.trackLine.color =  "rgba(255,0,0,1)"
                source.material.trackLine.width =  3
                source.animation.trackLine = options.animation.trackLine
                this.viewer.animations.get("trackLine").set(source.id,source)
            } else {
                delete source.animation["trackLine"]
                this.viewer.animations.get("trackLine").delete(source.id)
            }
            //雷达
            if (options.animation.radar !== undefined && options.animation.radar !== null) {
                source.animation.radar = options.animation.radar
                const entity = this.createRadar(source)
                entity.ellipse.show = options.animation.radar
                if(!options.animation.radar){
                    source.ellipse.semiMinorAxis = this.viewer.camera.positionCartographic.height / 12
                    source.ellipse.semiMajorAxis = this.viewer.camera.positionCartographic.height / 12
                }
                // TODO 是否需要加入到 viewer[animation][radar]
            } else {
                delete source.animation["radar"]
                // TODO 如果加入到字典中这里要删除
            }
            //空间扩散（波纹）
            if (options.animation.ripple !== undefined && options.animation.ripple !== null ) {
                source.animation.ripple = options.animation.ripple
                const entity = this.createRipple(source)
                entity.ellipse.show = options.animation.ripple
                if(!options.animation.ripple){
                    source.ellipse.semiMinorAxis = this.viewer.camera.positionCartographic.height / 12
                    source.ellipse.semiMajorAxis = this.viewer.camera.positionCartographic.height / 12
                }
                // TODO 是否需要加入到 viewer[animation][radar]
            } else {
                delete source.animation["ripple"]
                // TODO 如果加入到字典中这里要删除
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
        this.viewer.resource.set(source.id, this.getBillboardToJson(source))
    }

    /**
     * 根据数据渲染标绘
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
                // 判断 Position 属性 为运动或静态
                if (options.position.times) {
                    options.position = entityRun.computedRunPoints(options)
                } else {
                    options.position = plottingUtils.latitudeAndLongitudeToDegrees(options.position)
                }
                entity = this.viewer.entities.add({
                    id: options.id,
                    name: options.name,
                    type: "image",
                    camp: options.camp,
                    data: options.data,
                    sort: options.sort,
                    groupId: options.groupId,
                    flicker: options.flicker,
                    show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                    availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                    position: options.position,
                    billboard: {
                        image: options.references,
                        scale: options.scale,
                        colorBlendMode: Cesium.ColorBlendMode.REPLACE, // 使用材质的颜色属性替换实体颜色属性,
                    },
                    memory: options.memory,
                    material:options.material,
                    label: {
                        text: options.label,
                        font: options.material.text.italic ? "italic " + options.material.text.size + "px " + options.material.text.family : options.material.text.size + "px " + options.material.text.family,
                        // 字体边框
                        outline: true,
                        outlineWidth: 5,
                        fillColor: Cesium.Color.fromCssColorString(options.material.text.color),
                        outlineColor: Cesium.Color.fromCssColorString(options.material.text.outline),
                        pixelOffset: new Cesium.Cartesian2(0, -30),
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    }
                });
            }
            if (options.show instanceof Array) {
                entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            if (options.animation !== undefined && options.animation != null) {
                entity.animation = entity.animation || {}
                // 闪烁
                if (options.animation.flicker) {
                    entity.animation.flicker = options.animation.flicker
                    this.viewer.animations.get("flicker").set(entity.id, entity)
                }
                // 旋转
                if (options.animation.rotate) {
                    entity.animation.rotate = options.animation.rotate
                    this.viewer.animations.get("rotate").set(entity.id, entity)
                }
                // 缩放
                if (options.animation.scale) {
                    entity.animation.scale = options.animation.scale
                    this.viewer.animations.get("scale").set(entity.id, entity)
                }
                // 转向
                if (options.animation.autoRotate) {
                    entity.animation.autoRotate = options.animation.autoRotate
                    this.viewer.animations.get("autoRotate").set(entity.id, entity)
                }
                // 目标线
                if(options.animation.targetLine){
                    entity.animation.targetLine = options.animation.targetLine
                    this.viewer.animations.get("targetLine").set(entity.id,entity)
                }
                // 雷达
                if (options.animation.radar) {
                    entity.animation.radar = options.animation.radar
                    const entity1 = this.createRadar(entity)
                    entity1.ellipse.show = options.animation.radar
                    // TODO 此处要不要加入到字典中
                }
                // 航迹线
                if (options.animation.trackLine) {
                    entity.animation.trackLine = options.animation.trackLine
                    this.viewer.animations.get("trackLine").set(entity.id,entity)
                }
                // 空间扩散（波纹）
                if (options.animation.ripple) {
                    entity.animation.ripple = options.animation.ripple
                    const entity1 = this.createRipple(entity)
                    entity1.ellipse.show = options.animation.ripple
                    // TODO 此处要不要加入到字典中
                }
            }
            this.imageMap.set(options.id, entity)
            this.viewer.resource.set(options.id, this.getBillboardToJson(entity))
            resolve(entity)
        })
    }
    /**
     * 获取图片 Json 数据
     *
     * @param {*} entity 实体
     * */
    getBillboardToJson(entity) {
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        const temp = {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            camp: entity.camp || 0,
            data: entity.data || null,
            sort: entity.sort,
            groupId: entity.groupId,
            startTime: startTime,
            endTime: endTime,
            show: entity.billboard.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.billboard.distanceDisplayCondition.getValue())] : entity.show,
            label: entity.label?.text?.getValue(),
            angle: entity.billboard?.rotation?.getValue() || 1,
            scale: entity.billboard?.scale?.getValue() || 1,
            references: entity.billboard?.image?.getValue(),
            memory: entity.memory,
            material: entity.material
        }
        const item = entity.label.font.getValue().split(' ');
        const sizeIndex = item.length <= 2 ? 0 : 1;
        const size = item[sizeIndex];
        const family = item[item.length - 1];
        if (entity.label){
            temp.material.text = {
                color: this._colorFormat(entity.label.fillColor.getValue()),
                outline: this._colorFormat(entity.label.outlineColor.getValue()),
                size: parseFloat(size),
                family: family,
                weight: "normal",
                position: this.getRelativePosition({show: true, offset: entity.label.pixelOffset.getValue()}),
                italic: entity.label.font.getValue().includes('italic')
            }
        }
        if (entity.position instanceof Cesium.SampledPositionProperty) {  //(item.position instanceof Cesium.Cartesian3)
            temp['position'] = this._getPathPoint(entity)
        } else {
            temp['position'] = plottingUtils.degreesToLatitudeAndLongitude(entity.position?.getValue(Cesium.JulianDate.now())) || null
        }
        if (entity.animation) {
            temp["animation"] = {}
            if (entity.animation.flicker) temp["animation"]["flicker"] = entity.animation.flicker
            if (entity.animation.rotate) temp["animation"]["rotate"] = entity.animation.rotate
            if (entity.animation.scale) temp["animation"]["scale"] = entity.animation.scale
            if (entity.animation.autoRotate) temp["animation"]["autoRotate"] = entity.animation.autoRotate
            if (entity.animation.targetLine) temp["animation"]["targetLine"] = entity.animation.targetLine
            if (entity.animation.trackLine) temp["animation"]["trackLine"] = entity.animation.trackLine
            if (entity.animation.radar) temp["animation"]["radar"] = entity.animation.radar
            if (entity.animation.ripple) temp["animation"]["ripple"] = entity.animation.ripple
        }
        return temp
    }

    /**
     * 根据 id 删除元素
     *
     * @param {string} id 实体 id
     * */
    removeById(id) {
        this.viewer.entities.removeById(id);
        this.imageMap.delete(id)
        this.viewer.animations.values().forEach(item=>item.delete(id))
        this.viewer.resource.delete(id)
    }

    /**
     * 移除当前所有图片实体
     * */
    removeAll() {
        for (const [key,] of this.imageMap) {
            this.removeById(key)
        }
    }

    /**
     * 实体复制功能
     * */
    copyEntityAdd(entity) {
        return new Promise((resolve, reject) => {
            const billboardJson = this.getBillboardToJson(entity)
            const camera = this.viewer.camera
            const cameraHeight = camera.positionCartographic.height;
            billboardJson.id = uuid.uuid();
            // 进行位置偏移
            let offset = {}
            offset.x = cameraHeight * 0.0000001;
            offset.y = cameraHeight * 0.0000001;
            billboardJson.position[0] += offset.x;
            billboardJson.position[1] += offset.y;
            billboardJson.availability = dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", new Date(billboardJson.startTime)) + "/" + dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", billboardJson.endTime)
            this.showPlottingForData(billboardJson).then(entity => {
                resolve(entity)
            }, error => {
                reject(error)
            })
        })
    }
    /**
     *生成雷达效果
     */
    createRadar(entity) {
        entity.ellipse = {
            semiMinorAxis: new Cesium.CallbackProperty(()=> {
                return  this.viewer.camera.positionCartographic.height / 12;
            }, false),
            semiMajorAxis: new Cesium.CallbackProperty(()=>  {
                return this.viewer.camera.positionCartographic.height / 12
            }, false),
            material: new Cesium.RadarWaveMaterialProperty({
                color: new Cesium.Color(1.0, 1.0, 0.0, 0.7),
                speed: 25.0
            }),
        }
        return entity
    }
    /**
     *生成波纹效果
     */
    createRipple(entity){
        entity.ellipse =  {
            semiMinorAxis: new Cesium.CallbackProperty(()=> {
                return this.viewer.camera.positionCartographic.height / 12
            }, false),
            semiMajorAxis: new Cesium.CallbackProperty(()=>  {
                return this.viewer.camera.positionCartographic.height / 12
            }, false),
            material: new Cesium.CircleWaveMaterialProperty({
                duration: 3000,
                gradient: 0,
                color: new Cesium.Color.fromCssColorString('#1FA8E3'),
                count: 3,
            }),
        }
        return entity
    }
    /**
     * 将从实体获取到的颜色进行格式化 "rgba(241,7,7,0.6)"
     * */
    _colorFormat(colorObj) {
        return `rgba(${colorObj.red * 255},${colorObj.green * 255},${colorObj.blue * 255},${colorObj.alpha})`
    }

    /**
     * 获取资源列表
     * */
    getBillboardToList() {
        const result = []
        for (const [, value] of this.imageMap) {
            result.push(this.getBillboardToJson(value))
        }
        return result
    }

    /**
     * 获取文字的相对方向
     * */
    getRelativePosition(options) {
        const positionText = {
            top: [0, -30],
            bottom: [0, 30],
            left: [-45, 0],
            right: [45, 0]
        }
        if (options.show) {
            // 使用 find 函数查找匹配的键
            const matchedKey = Object.entries(positionText).find(([key, value]) => {
                if (value[0] === options.offset.x && value[1] === options.offset.y) {
                    return key
                }
            });
            return matchedKey[0]
        } else {
            return [positionText[options.textPosition][0], positionText[options.textPosition][1]]
        }
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
     * 获取默认名称
     * */
    _getDefaultName() {
        return "图片" + ("000" + (Array.from(this.imageMap.keys()).length + 1)).substr(-3);
    }

}

export default Image
