import * as plottingUtils from "../../common/plottingUtils";
import toolTips from "../../common/reminderTip";
import * as uuid from "../../common/uuid"
import * as dateUtils from "../../common/dateUtils";
import {
    computeCurveLinePoints,
    lockingMap,
    updateEntityToStaticProperties
} from "../tool/plottingTools";
import {setGlowLine, setLineMaterial} from "../material/officialMaterial";
import {colorFormat} from "../color/colorFormat";

const Cesium = window.Cesium

/**
 * 创建曲线标绘类
 */
class CurveLineClass {
    viewer = null

    constructor(viewer) {
        this.viewer = viewer
    }

    /**
     * 创建曲线标绘
     * @param {Array} [options]  相关参数
     */
    createCurveLine(options) {
        return new Promise((resolve, reject) => {
            const id = options.id || uuid.uuid();
            const exist = this.viewer.entities.getById(id)
            if (exist) reject(exist)

            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
            window.toolTip = '点击鼠标左键开始绘制, 按ESC取消标绘';

            let anchorpoints = [];
            let polyline = undefined;

            // 左键点击事件
            handler.setInputAction((event) => {
                window.toolTip = '左键添加点，右键撤销，双击鼠标左键或按回车键结束绘制, 按ESC取消标绘';
                let pixPos = event.position;
                let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, pixPos);
                if (!cartesian) return;
                if (anchorpoints.length === 0) {
                    anchorpoints.push(cartesian);
                    polyline = this.viewer.entities.add({
                        id: id,
                        name: 'Curve',
                        type: "situation",
                        data: options.data,
                        sort: options.sort || 1,
                        groupId: this.viewer.root.id,
                        availability: dateUtils.iso8602TimesToJulianDate(options?.availability || dateUtils.julianDateToIso8602Times(this.viewer.clock.currentTime)),
                        polyline: {
                            positions: new Cesium.CallbackProperty(function () {
                                return anchorpoints.length >= 2? computeCurveLinePoints(anchorpoints, 15):null //防止点少于两个报错
                            }, false),
                            width: 3,
                            material: options.material.line.style === "solid" ? Cesium.Color.fromCssColorString(options.material.border.color) : new Cesium.PolylineDashMaterialProperty({
                                color: Cesium.Color.fromCssColorString(options.material.line.color),
                                // gapColor:Cesium.Color.YELLOW,
                                dashLength: 15.0,
                                dashPattern: 255.0,
                            }),
                            clampToGround: true,
                        }
                    });
                    polyline.GeoType = 'Curve'; //记录对象的类型，用户后续编辑等操作
                    polyline.Editable = true; //代表当前对象可编辑,false状态下不可编辑
                }
                anchorpoints.push(cartesian);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // 鼠标移动事件
            handler.setInputAction((movement) => {
                let endPos = movement.endPosition;
                toolTips(window.toolTip, endPos, true);
                if (Cesium.defined(polyline)) {
                    anchorpoints.pop();
                    let cartesian = plottingUtils.getCatesian3FromPX(this.viewer, endPos);
                    anchorpoints.push(cartesian);
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
                document.removeEventListener('keydown', enterEnd)
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
                    document.removeEventListener('keydown', enterEnd)
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
     * 编辑曲线标绘
     * @param {Cesium.Viewer} viewer 该viewer带有实体编辑的信息
     * @param {Cesium.Entity} entity  编辑实体
     * @param {Cesium.ScreenSpaceEventHandler} handler 事件处理函数
     * @param {Array} collection 实体集和
     *
     */
    editCurveLine(viewer, entity, handler, collection) {
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
                GeoType: "EditCurve",
                Editable: true,
                id: "edit_" + entity.id,
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
                geoType: "remix_curve",
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
                if (pickEntity.GeoType === "CurveEditPoints") {
                    lockingMap(viewer, false);
                    currentPickVertex = pickEntity;
                } else if (pickEntity.GeoType === "EditCurve") {
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
                const startPosition = plottingUtils.getCatesian3FromPX(viewer, event.startPosition);
                const endPosition = plottingUtils.getCatesian3FromPX(viewer, event.endPosition);
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
                if (pick.id.GeoType === "CurveEditCenterPoints") {
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
                if (pick.id.GeoType === "CurveEditPoints") {
                    if (updatePos.length < 3) {
                        alert("折线节点数不能少于2个");
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
                    id: "edit_" + uuid.uuid(),
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
                point.GeoType = "CurveEditPoints";
                point.Editable = true;
                vertexPointsEntity.push(point);
                if (updatePos[index + 1]) {
                    let centerPoint = viewer.entities.add({
                        id: "edit_" + uuid.uuid(),
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
                    centerPoint.GeoType = "CurveEditCenterPoints";
                    centerPoint.Editable = true;
                    centerPointsEntity.push(centerPoint);
                }
            }
            return vertexPointsEntity.concat(centerPointsEntity);
        }
    }

    /**
     * 根据数据生成实体
     * @param {Array} options 实体数据导入
     */
    showCurveLine(options) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            let entity = this.viewer.entities.getById(options.id)
            if (entity) {
                reject(entity)
                console.log("该实体已经存在， 不能重复加载")
            } else {
                const plottingPoints = options.position.map(position => plottingUtils.latitudeAndLongitudeToDegrees(position));
                const degreesPositions = computeCurveLinePoints(plottingPoints).map(item => {
                    const temp = plottingUtils.degreesToLatitudeAndLongitude(item)
                    temp[2] = options.material?.line?.height || 0
                    return plottingUtils.latitudeAndLongitudeToDegrees(temp)
                })
                entity = this.viewer.entities.add({
                    id: options.id,
                    name: options.name,
                    GeoType: options.geoType,
                    groupId: options.groupId,
                    data: options.data,
                    sort: options.sort || 1,
                    Editable: true,
                    height: options.material.line.height,
                    availability: dateUtils.iso8602TimesToJulianDate(options.availability),
                    type: "situation",
                    polyline: {
                        material: await this._createLineStyle(options.material.line),
                        positions: degreesPositions,
                        width: options.material?.line?.width || 15,
                        clampToGround: options.material.line.height ? false : true,
                    },
                    PottingPoint: plottingPoints,
                    show: options.show instanceof Array ? true : options.show === undefined ? true : options.show,
                });
            }
            if (options.show instanceof Array) {
                entity.polyline.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(...options.show)
            }
            if (options.animation !== undefined && options.animation != null) {
                entity.animation = entity.animation || {}
                if (options.animation.flicker) {
                    entity.animation.flicker = options.animation.flicker
                    this.viewer.animations.get("flicker").set(entity.id, entity)
                }
                if(options.animation.growthLine){
                    entity.animation.growthLine = options.animation.growthLine
                    this.viewer.animations.get("growthLine").set(entity.id, entity)
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
    editCurveLineData(source, options) {
        //编辑状态实体
        const showEditEntity = this.viewer.entities.getById(source.showEditEntityId)
        // 修改 实体 名称
        "name" in options && (source.name = options.name)
        //修改实体分组
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
        if ("camp" in options) {
            source.camp = options.camp
            const bc = options.camp === 0 ? "rgba(255, 0, 0, .8)" : options.camp === 1 ? "rgba(0, 0, 255, .8)" : "rgba(0, 255, 0, .8)"
            source.polyline.material = Cesium.Color.fromCssColorString(bc)
            showEditEntity.polyline.material = Cesium.Color.fromCssColorString(bc)
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
                    source.polyline.material = this._createLineStyle({style:style, color:outline.color})
                    showEditEntity.polyline.material = this._createLineStyle({style:style, color:outline.color})
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
            if (options.animation.growthLine) {
                source.animation.growthLine = options.animation.growthLine
                this.viewer.animations.get("growthLine").set(source.id, source)
            } else {
                delete source.animation["growthLine"]
                this.viewer.animations.get("growthLine").delete(source.id)
            }
        }
        this.viewer.resource.set(source.id, this.getCurveLineJson(source))
    }

    /**
     * 导出态势箭头 Json 数据
     *
     * @param {*} entity 实体
     * */
    getCurveLineJson(entity) {
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
        } else if (entity?.polyline.material instanceof Cesium.PolylineArrowMaterialProperty) {
            lineType = "arrow"
        } else if(entity?.polyline.material instanceof Cesium.ImageMaterialProperty){
            lineType = "image"
        }else{
            lineType = "solid"
        }
        const colorObj = entity.polyline.material?.color?.getValue()
        // 获取图片的URL
        const imageUrl = entity.polyline?.material?.image?.getValue(Cesium.JulianDate.now());
        const imageColor = entity?.imageColor
        temp['material'] = {
            line: {
                style: lineType,
                image:imageUrl?imageUrl:null,
                color: colorObj?colorFormat(colorObj):imageColor,
                height: entity?.height,
                width: entity.polyline.width.getValue(),
                show: entity.polyline?.show?.getValue()
            }
        }
        if (entity.animation){
            temp["animation"] = {}
            if (entity.animation.flicker) temp["animation"]["flicker"] = entity.animation.flicker
            if (entity.animation.growthLine) temp["animation"]["growthLine"] = entity.animation.growthLine
        }
        temp['position'] = entity.PottingPoint.map(point => plottingUtils.degreesToLatitudeAndLongitude(point))
        return temp
    }

    /**
     * 创建边框或线样式 材质
     *
     * 实线、虚线、发光线
     * */
    async _createLineStyle(line) {
        // 检查 color 是否为 Cesium.Color 实例，并转换为字符串格式
        line.color = line.color instanceof Cesium.Color ? colorFormat(line.color) : line.color;

        if (line.style === "solid") {
            // 如果没有图像，直接返回颜色
            return Cesium.Color.fromCssColorString(line.color);
        } else if (line.style === "dashed") {
            return setLineMaterial(Cesium.Color.fromCssColorString(line.color));
        } else if (line.style === "glow") {
            return setGlowLine(Cesium.Color.fromCssColorString(line.color));
        } else if(line.style === "image"){
            try {
                // 等待 changeImageColor 完成，并获取 newImageUrl
                const newImageUrl = await this.changeImageColor(line.image, line.color);
                // 返回 Cesium.ImageMaterialProperty
                return new Cesium.ImageMaterialProperty({
                    image: newImageUrl,  // 纹理图片的路径
                    transparent: true, // 保持图片的透明部分透明
                    repeat: new Cesium.Cartesian2(10, 1)  // 控制纹理的重复次数
                });
            } catch (error) {
                console.error('图片错误！！:', error);
            }
        }else {
            return null
        }
    }
    /**
     * 修改图片颜色
     * @param imageUrl 生长时间 秒
     * @param rgbaColor 笛卡尔数组
     * */
    changeImageColor(imageUrl, rgbaColor) {
        return new Promise((resolve, reject) => {
            // 解析rgba颜色值
            const rgba = rgbaColor.match(/(\d+(\.\d+)?)/g).map(Number);
            // 创建一个新的 Image 对象
            const img = new Image();
            img.src = imageUrl;
            img.crossOrigin = "Anonymous";  // 确保可以跨域访问图像

            img.onload = function() {
                // 创建一个 canvas 元素
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 设置 canvas 大小为图像的宽高
                canvas.width = img.width;
                canvas.height = img.height;

                // 将图像绘制到 canvas 上
                ctx.drawImage(img, 0, 0);

                // 获取图像的像素数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // 遍历每个像素，改变颜色
                for (let i = 0; i < data.length; i += 4) {
                    // 应用新的颜色
                    data[i] = rgba[0];         // 红色分量
                    data[i + 1] = rgba[1];     // 绿色分量
                    data[i + 2] = rgba[2];     // 蓝色分量
                    data[i + 3] = data[i + 3] * rgba[3];  // 透明度乘以新的透明度
                }

                // 将修改后的像素数据放回 canvas
                ctx.putImageData(imageData, 0, 0);

                // 将 canvas 转换为 data URL
                const url = canvas.toDataURL();
                // 解析后的URL返回
                resolve(url);
            };

            img.onerror = function() {
                reject(new Error('没有找到图片。'));
            };
        });
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

export default CurveLineClass
