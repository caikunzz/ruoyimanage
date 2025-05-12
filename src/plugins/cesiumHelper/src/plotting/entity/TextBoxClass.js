import * as uuid from "../../common/uuid"
import * as dateUtils from "../../common/dateUtils"
import * as plottingUtils from "../../common/plottingUtils";
import * as entityRun from "../../common/entityRun";
import toolTips from "../../common/reminderTip";

const Cesium = window.Cesium

/**
 * 文本框标绘类
 *
 * 包含文本框标绘相关方法
 * 支持二维（相对屏幕）、三维（相对地球）显示
 *
 * @author: tzx
 * @date: 2023/8/6
 * */
class TextBoxClass {

    viewer = null

    constructor(viewer) {
        this.viewer = viewer
    }

    /**
     * 创建文本框
     *
     * @param {*} options 相关参数
     * */
    createTextBox(options) {
        return new Promise((res, rej) => {
            const id = options?.id || uuid.uuid()
            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
            const toolTip = "左键单击以创建文本框"
            handler.setInputAction(async (event) => {
                let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, event.position);
                const entity = this.viewer.entities.add({
                    id: id,
                    name: options?.name,
                    type: "situation",
                    GeoType: "TextBox",
                    camp: 0,
                    data: options?.data,
                    sort: options?.sort || 1,
                    groupId: this.viewer.root.id,
                    position: cartesian,
                    availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                    label: {
                        text: options.label || options.name,
                        font: "15px sans-serif",
                        outline: true,
                        outlineWidth: 5,
                        scale: 1,
                        fillColor: Cesium.Color.YELLOW,
                        outlineColor: Cesium.Color.BLACK,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        showBackground: true,
                        backgroundColor: Cesium.Color.fromCssColorString("rgba(255,0,0,0.5)"),
                        backgroundPadding: new Cesium.Cartesian2(12, 8),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    },
                    show: options?.show instanceof Array ? true : options?.show === undefined ? true : options.show,
                    memory: {},
                    material: {
                        trackLine:{}
                    },
                });
                if (options?.show instanceof Array) {
                    entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                }
                res(entity)
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.setInputAction((event) => {
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
                    rej("取消标绘")
                }
            }
            document.addEventListener('keydown', cancel)
        })
    }

    /**
     * 编辑文本框属性
     *
     * @param {*} source    资源实体
     * @param {*} options   相关参数 {name: 海军, ...}
     *
     * option: {
     *     id: "1"  实体 id
     *     name: "飞机"  文本框内容
     *     camp: 0 阵营  0：我方  1：敌方
     *     scale: 1 放大倍数
     *     orientation: 1 角度
     *     ...
     * }
     * */
    editTextBoxData(source, options) {
        // 修改 实体 名称
        "name" in options && (source.name = options.name)
        // 修改 实体 分组
        "groupId" in options && (source.groupId = options.groupId)
        // 修改字体内容
        "label" in options && (source.label.text = options.label)
        // 修改 实体文字 的比例
        "scale" in options && (source.label.scale = options.scale)
        // 修改 实体 阵营
        "camp" in options && (source.camp = options.camp)
        // 修改 实体 数据id
        "data" in options && (source.data = options.data)
        // 修改 实体 顺序
        "sort" in options && (source.sort = options.sort)
        //控制实体显隐
        if ('show' in options) {
            if (options.show instanceof Array) {
                source.show = true
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
                if (text.italic !== undefined && text.italic !== null) source.label.font = text.italic ? "italic " + source.label.font.getValue() : source.label.font.getValue().replace("italic", "").trim()
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
                source.material.polyline.width = options.material.trackLine.width || 2
                source.polyline.color = Cesium.Color.fromCssColorString(options.material.trackLine.color) || "rgba(255,0,0,1)"
            }
        }
        // 修改实体有效期
        if ("availability" in options) {
            source.availability.removeAll(); // 移除所有时间间隔
            source.availability = dateUtils.iso8602TimesToJulianDate(options.availability)
        }
        //修改动画时间
        if (options.animation !== undefined && options.animation != null) {
            source.animation = source.animation || {}
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
        }
        // 修改实体位置
        if ("position" in options) {
            if (options.position instanceof Array) {
                source.position = plottingUtils.latitudeAndLongitudeToDegrees(options.position)
            } else {
                source.position = entityRun.computedRunPoints(options)
            }
        }
    }

    /**
     * 根据数据渲染文本框
     *
     * @param {*} options 相关参数
     * */
    showTextBox(options) {
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
                const font = options.material.text.italic ? "italic " + options.material.text.size + "px " + options.material.text.family : options.material.text.size + "px " + options.material.text.family
                entity = this.viewer.entities.add({
                    id: options.id,
                    type: "situation",
                    GeoType: "TextBox",
                    data: options.data,
                    sort: options.sort,
                    camp: options.camp,
                    name: options.name,
                    groupId: options.groupId,
                    availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                    position: options.position,
                    label: {
                        text: options.label,
                        font: font,
                        // 字体边框
                        outline: true,
                        outlineWidth: 5,
                        fillColor: Cesium.Color.fromCssColorString(options.material.text.color),
                        outlineColor: Cesium.Color.fromCssColorString(options.material.text.outline),
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        showBackground: options.material.fill.show,
                        backgroundColor: Cesium.Color.fromCssColorString(options.material.fill.color),
                        backgroundPadding: new Cesium.Cartesian2(12, 8),
                        scale: options.scale,
                        // horizontalOrigin:Cesium.HorizontalOrigin.CENTER
                    },
                    memory: options.memory,
                    material: options.material,
                    show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                });
                if (options.show instanceof Array) {
                    entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
                }
                if (options.animation !== undefined && options.animation != null) {
                    entity.animation = entity.animation || {}
                    if (options.animation.flicker) {
                        entity.animation.flicker = options.animation.flicker
                        this.viewer.animations.get("flicker").set(entity.id, entity)
                    }
                    // 航迹线
                    if (options.animation.trackLine) {
                        entity.animation.trackLine = options.animation.trackLine
                        this.viewer.animations.get("trackLine").set(entity.id,entity)
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
                }
                resolve(entity)
            }
        })
    }

    /**
     * 实体复制功能
     * */
    copyTextBoxJson(entity) {
        const textBoxJson = this.getTextBoxJson(entity)
        const camera = this.viewer.camera
        const cameraHeight = camera.positionCartographic.height;
        textBoxJson.id = uuid.uuid();
        // 进行位置偏移
        let offset = {}
        offset.x = cameraHeight * 0.0000001;
        offset.y = cameraHeight * 0.0000001;
        textBoxJson.position[0] += offset.x;
        textBoxJson.position[1] += offset.y;
        textBoxJson.availability = dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", new Date(textBoxJson.startTime)) + "/" + dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", textBoxJson.endTime)
        return textBoxJson
    }

    /**
     * 获取文本框 Json 数据
     *
     * @param {*} entity 实体
     * */
    getTextBoxJson(entity) {
        const {startTime, endTime} = dateUtils.availabilityToTimes(entity.availability)
        const fontValue = entity.label.font.getValue();
        const item = fontValue.split(' ');
        const sizeIndex = item.length <= 2 ? 0 : 1;
        const size = item[sizeIndex];
        const family = item[item.length - 1];
        const italic = fontValue.includes('italic')
        const temp = {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            geoType: entity.GeoType,
            camp: entity.camp || 0,
            data: entity.data || null,
            sort: entity.sort,
            startTime: startTime,
            endTime: endTime,
            show: entity.label.distanceDisplayCondition?.getValue() instanceof Object ? [...Object.values(entity.label.distanceDisplayCondition.getValue())] : entity.show,
            groupId: entity.groupId,
            scale: entity.label.scale?.getValue(),
            label: entity.label.text.getValue(),
            memory: entity.memory,
            material: {
                text: {
                    color: this._colorFormat(entity.label.fillColor.getValue()),
                    outline: this._colorFormat(entity.label.outlineColor.getValue()),
                    size: parseFloat(size),
                    family: family,
                    weight: "normal",
                    italic: italic,
                    show: entity.label?.text.getValue() !== ""
                },
                fill: {
                    color: this._colorFormat(entity.label.backgroundColor.getValue()),
                    show: entity.label.showBackground.getValue()
                },
                trackLine:entity.material.trackLine
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
            if (entity.animation.trackLine) temp["animation"]["trackLine"] = entity.animation.trackLine
            if (entity.animation.radar) temp["animation"]["radar"] = entity.animation.radar
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
     * 设置实体移动路线
     *
     * @param {*} entity 实体
     * @param {*} options 移动路线点
     * */
    setPath(entity, options) {
        let times = options.controller ? entityRun.generateSpeedTime(options) : entityRun.generateTime(options);
        entity.position = entityRun.computedRunPoints({
            position: {times: times, points: options.path},
            startTime: options.startTime
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
}

export default TextBoxClass
