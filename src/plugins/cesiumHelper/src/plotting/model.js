import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils"
import * as plottingUtils from "../common/plottingUtils";
import * as entityRun from "../common/entityRun";

const Cesium = window.Cesium

/**
 * 模型标绘类
 *
 * 包含模型标绘相关方法
 * @author: tzx
 * @date: 2023/8/6
 * */
class ModelPlotting {

    viewer = null

    modelMap = null

    constructor(viewer) {
        this.viewer = viewer
        this.modelMap = new Map()
    }

    /**
     * 添加三维模型
     *
     * @param {string} url       模型地址 src/image/icon/飞机.png
     * @param {string} position  模型经纬度坐标 [112.8080, 29.6768, 0]
     * @param {*} [options]  相关参数
     */
    createModelPlot(options) {
        return new Promise((resolve,) => {
            const id = options?.id || uuid.uuid()
            /* 在屏幕中添加模型 */
            const entity = this.viewer.entities.add({
                id: id,
                name: this._getDefaultName(),
                camp: options?.camp || 0,
                data: options.data,
                sort: 1,
                groupId: this.viewer.root.id,
                show: options?.show instanceof Array ? true : options?.show === undefined ? true : options.show,
                angle: 0,
                availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                type: "model",
                position: plottingUtils.latitudeAndLongitudeToDegrees(options.position),
                model: {
                    uri: options.url,
                    scale:0.1,
                    minimumPixelSize: 50,
                    maximumScale: 5000,
                },
                label: {
                    // text:"文本",
                    font: "15px sans-serif",
                    // 字体边框
                    outline: true,
                    outlineWidth: 5,
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    pixelOffset: new Cesium.Cartesian2(0, -30),
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    eyeOffset: new Cesium.Cartesian3(0, 0, -10),
                },
                memory: {},
                material: {
                    trackLine:{}
                },
            });
            if (options?.show instanceof Array) {
                entity.model.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            this.modelMap.set(id, entity)
            this.viewer.resource.set(id, this.getModelToJson(entity))
            resolve(entity)
        })
    }

    /**
     * 编辑模型属性
     *
     * @param {*} source    资源实体
     * @param {*} options   相关参数 {name: 海军, ...}
     *
     * option: {
     *     id: "1"  实体 id
     *     name: "飞机"  模型名称
     *     camp: 0 阵营  0：我方  1：敌方
     *     scale: 1 放大倍数
     *     orientation: 1 角度
     *     ...
     * }
     * */
    editModelPlot(source, options) {
        // 修改实体名称
        "name" in options && (source.name = options.name)
        // 修改实体阵营
        "camp" in options && (source.camp = options.camp)
        // 修改实体分组
        "groupId" in options && (source.groupId = options.groupId)
        // 修改实体顺序
        "sort" in options && (source.sort = options.sort)
        // 修改实体数据id
        "data" in options && (source.data = options.data)
        // 修改可见性
        if ('show' in options) {
            if (options.show instanceof Array) {
                source.show = true
                source.model.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                source.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            } else {
                source.show = options.show
            }
        }
        // 修改实体有效期
        if ("availability" in options) {
            source.availability.removeAll(); // 移除所有时间间隔
            source.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
        }
        //修改模型旋转角度
        if ("angle" in options) {
            const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(options.angle), 0, 0);
            //在实体上设置角度
            source.angle = options.angle
            // 计算模型角度
            source.orientation = Cesium.Transforms.headingPitchRollQuaternion(source.position.getValue(Cesium.JulianDate.now()), hpr)
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
                // 显隐
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
            if (material.trackLine){
                source.material.trackLine = options.material.trackLine || source.material.trackLine
                source.material.polyline.width = options.material.trackLine.width || 3
                source.polyline.color = Cesium.Color.fromCssColorString(options.material.trackLine.color) || "rgba(255,0,0,1)"
            }
        }
        // 修改 实体 尺寸
        if ("scale" in options){
            source.model.scale = options.scale
            source.label.scale = options.scale
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
            //雷达
            if (options.animation.radar !== undefined && options.animation.radar !== null) {
                source.animation.radar = options.animation.radar
                const entity = this.createRadar(source)
                entity.ellipse.show = options.animation.radar
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
            // 修改航迹线
            if(options.animation.trackLine){
                source.material.trackLine.style =  "solid"
                source.material.trackLine.color =  "rgba(255,0,0,1)"
                source.material.trackLine.width =  3
                source.animation.trackLine = options.animation.trackLine
                this.viewer.animations.get("trackLine").set(source.id,source)
            } else {
                delete source.animation["trackLine"]
                this.viewer.animations.get("trackLine").delete(source.id)
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
        this.viewer.resource.set(source.id, this.getModelToJson(source))
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
     * 创建边框或线样式 材质
     *
     * 实线、虚线、发光线
     * */
    _createLineStyle(type, color) {
        if (type === "solid") {
            return Cesium.Color.fromCssColorString(color)
        } else if (type === "dashed") {
            return new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString(color), // 设置虚线的颜色
                // gapColor:Cesium.Color.YELLOW,   //间隙颜色
                dashLength: 30.0, // 设置虚线段的长度
                dashPattern: 255.0, // 设置虚线的模式，这里使用一个8位二进制数来表示虚线和间隙
            })
        } else if (type === "glow") {
            return new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.1,
                color: Cesium.Color.fromCssColorString(color),
            })
        } else {
            return null
        }
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
                let orientation
                if (options.position.times) {
                    options.position = entityRun.computedRunPoints(options)
                } else {
                    options.position = plottingUtils.latitudeAndLongitudeToDegrees(options.position)
                    let hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(options.angle), 0, 0);
                    orientation = Cesium.Transforms.headingPitchRollQuaternion(options.position, hpr);
                }
                entity = this.viewer.entities.add({
                    id: options.id,
                    name: options.name || this._getDefaultName(),
                    camp: options.camp,
                    show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                    data: options.data,
                    sort: 1,
                    availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                    type: "model",
                    position: options.position,
                    orientation: orientation,
                    label: {
                        text: options.label,
                        font: options.material.text.italic ? "italic " + options.material.text.size + "px " + options.material.text.family : options.material.text.size + "px " + options.material.text.family,
                        // 字体边框
                        outline: true,
                        outlineWidth: 5,
                        fillColor: Cesium.Color.fromCssColorString(options.material.text.color),
                        outlineColor: Cesium.Color.fromCssColorString(options.material.text.outline),
                        pixelOffset: new Cesium.Cartesian2(0, -30),
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE
                    },
                    model: {
                        uri: options.references,
                        minimumPixelSize: 50 + options.scale,
                        maximumScale: 5000,
                    },
                    memory: options.memory,
                    material: options.material,
                })
            }
            if (options.show instanceof Array) {
                entity.model.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            if (options.animation !== undefined && options.animation != null) {
                entity.animation = entity.animation || {}
                // 闪烁
                if (options.animation.flicker) {
                    entity.animation.flicker = options.animation.flicker
                    this.viewer.animations.get("flicker").set(entity.id, entity)
                }
                // 雷达
                if (options.animation.radar) {
                    entity.animation.radar = options.animation.radar
                    const entity1 = this.createRadar(entity)
                    entity1.ellipse.show = options.animation.radar
                    // TODO 此处要不要加入到字典中
                }
                // 空间扩散（波纹）
                if (options.animation.ripple) {
                    entity.animation.ripple = options.animation.ripple
                    const entity1 = this.createRipple(entity)
                    entity1.ellipse.show = options.animation.ripple
                    // TODO 此处要不要加入到字典中
                }
                // 航迹线
                if (options.animation.trackLine) {
                    entity.animation.trackLine = options.animation.trackLine
                    this.viewer.animations.get("trackLine").set(entity.id,entity)
                }
            }
            this.modelMap.set(options.id, entity)
            this.viewer.resource.set(options.id, this.getModelToJson(entity))
            resolve(entity)
        })
    }

    /**
     * 设置实体移动路线
     *
     * @param {*} entity 实体
     * @param {*} options 详细信息
     * */
    setPath(entity, options) {
        let times = options.controller ? entityRun.generateSpeedTime(options) : entityRun.generateTime(options);
        entity.position = entityRun.computedRunPoints({
            position: {times: times, points: options.path},
            startTime: options.startTime
        })
    }

    /**
     * 实体复制功能
     * */
    copyEntityAdd(entity) {
        return new Promise((resolve, reject) => {
            const billboardJson = this.getModelToJson(entity)
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
     * 获取模型 Json 数据
     *
     * @param {*} entity 实体
     * */
    getModelToJson(entity) {
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        const item = entity.label.font.getValue().split(' ');
        const sizeIndex = item.length <= 2 ? 0 : 1;
        const size = item[sizeIndex];
        const family = item[item.length - 1];
        const temp = {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            camp: entity.camp || 0,
            groupId: entity.groupId,
            data: entity.data || null,
            sort: entity.sort || 1,
            startTime: startTime,
            endTime: endTime,
            show: entity.model.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.model.distanceDisplayCondition.getValue())] : entity.show,
            memory: entity.memory,
            material: entity.material,
            label: entity.label?.text?.getValue(),
            angle: entity.angle || 1,
            scale: entity.model?.scale?.getValue() || 0,
            references: entity.model?.uri?.getValue(),
        }
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
        if (entity.position instanceof Cesium.SampledPositionProperty) {
            temp['position'] = this._getPathPoint(entity)
        } else {
            temp['position'] = plottingUtils.degreesToLatitudeAndLongitude(entity.position?.getValue(Cesium.JulianDate.now())) || null
        }
        if (entity.animation) {
            temp["animation"] = {}
            if (entity.animation.flicker) temp["animation"]["flicker"] = entity.animation.flicker
            if (entity.animation.radar) temp["animation"]["radar"] = entity.animation.radar
            if (entity.animation.trackLine) temp["animation"]["trackLine"] = entity.animation.trackLine
            if (entity.animation.ripple) temp["animation"]["ripple"] = entity.animation.ripple
        }
        return temp
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
    getModelToList() {
        const result = []
        for (const [, value] of this.modelMap) {
            result.push(this.getModelToJson(value))
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
     * 根据 id 删除元素
     *
     * @param {string} id 实体 id
     * */
    removeById(id) {
        this.viewer.entities.removeById(id);
        this.modelMap.delete(id)
        this.viewer.animations.values().forEach(item=>item.delete(id))
        this.viewer.resource.delete(id)
    }

    /**
     * 移除当前所有模型实体
     * */
    removeAll() {
        for (const [key,] of this.modelMap) {
            this.removeById(key)
        }
    }

    /**
     * 获取默认名称
     * */
    _getDefaultName() {
        return "模型" + ("000" + (Array.from(this.modelMap.keys()).length + 1)).substr(-3);
    }
}

export default ModelPlotting
