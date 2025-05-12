import Image from "./image";
import ModelPlotting from "./model";
import Particle from "./particle";
import SituationPlotting from "./situation";
import RiverPlotting from "./river";
import PlacePlotting from "./place";
import TagPlotting from "./tag";
import RoutePlotting from "./route";
import BoundaryPlotting from "./boundary";
import RoadPlotting from "./road";


class Plotting {

    /** 视图 */
    viewer = null
    /** 父级 */
    supper = null

    /** 图像标绘插件 */
    imagePlotting = null
    /** 模型标绘插件 */
    modelPlotting = null
    /** 粒子特效标绘插件 */
    particlePlotting = null
    /** 地标标绘插件 */
    placePlotting = null
    /** 河流标绘插件 */
    riverPlotting = null
    /** 边界标绘插件 */
    boundaryPlotting = null
    /** 态势标绘插件 */
    situationPlotting = null
    /** 标签标绘插件 */
    tagPlotting = null
    /** 路径标绘插件 */
    routePlotting = null
    /** 道路标绘插件 */
    roadPlotting = null

    /**
     * 构造方法
     *
     * 初始化各类标绘插件
     * @param {Cesium.Viewer} viewer 视图
     * @param {CesiumHelper} supper 父类
     * */
    constructor(viewer, supper) {
        this.viewer = viewer
        this.supper = supper

        /* 初始化标绘插件 */
        this.imagePlotting = new Image(viewer)
        this.modelPlotting = new ModelPlotting(viewer)
        this.particlePlotting = new Particle(viewer)
        this.situationPlotting = new SituationPlotting(viewer)
        this.placePlotting = new PlacePlotting(viewer)
        this.boundaryPlotting = new BoundaryPlotting(viewer)
        this.riverPlotting = new RiverPlotting(viewer)
        this.tagPlotting = new TagPlotting(viewer)
        this.routePlotting = new RoutePlotting(viewer)
        this.roadPlotting = new RoadPlotting(viewer)
    }

    /**
     * 获取 标绘 Json数据
     * */
    getPlottingToJson(entity) {
        switch (entity.type) {
            case "image":
                return this.imagePlotting.getBillboardToJson(entity);
            case "model":
                return this.modelPlotting.getModelToJson(entity);
            case "situation":
                return this.situationPlotting.getMilitaryToJson(entity)
            case "particle":
                return this.particlePlotting.getParticlesToJson(entity)
            case "river":
                return this.riverPlotting.getRiverToJson(entity)
            case "road":
                return this.roadPlotting.getRoadToJson(entity)
            case "boundary":
                return this.boundaryPlotting.getBoundaryToJson(entity)
            case "place":
                return this.placePlotting.getPlaceToJson(entity)
            case "tag":
                return this.tagPlotting.getTagToJson(entity)
            default:
                return null
        }
    }

    /**
     * 实体复制功能
     * */
    copy(entity) {
        switch (entity.type) {
            case "image":
                return this.imagePlotting.copyEntityAdd(entity)
            case "model":
                return this.modelPlotting.copyEntityAdd(entity)
            case "particle":
                return this.particlePlotting.copyEntityAdd(entity)
            case "situation":
                return this.situationPlotting.copyEntityAdd(entity)
            case "place":
                return this.situationPlotting.copyEntityAdd(entity)
            default:
                throw Error("实体不支持复制")
        }
    }

    /** 获取所有标绘数组 */
    getPlottingToList() {
        const billboardList = this.imagePlotting.getBillboardToList()
        const modelList = this.modelPlotting.getModelToList()
        const particleList = this.particlePlotting.getParticlesToList()
        const riverList = this.riverPlotting.getRiverToList()
        const roadList = this.roadPlotting.getRoadToList()
        const placeList = this.placePlotting.getPlaceToList()
        const boundaryList = this.boundaryPlotting.getBoundaryToList()
        const militaryList = this.situationPlotting.getMilitaryToList()
        // const tagList = this.tagPlotting.getTagToList()
        return [
            ...billboardList,
            ...modelList,
            ...particleList,
            ...militaryList,
            ...riverList,
            ...roadList,
            ...placeList,
            ...boundaryList,
            // ...tagList
        ]
    }

    /**
     * 根据实体 id 和信息更新标绘
     *
     * @param entity {*} 实体
     * @param options {*} 属性
     * */
    updatePlotting(entity, options) {
        if (entity) {
            switch (entity.type) {
                case "image":
                    this.imagePlotting.editImagePlot(entity, options);
                    break;
                case "model":
                    this.modelPlotting.editModelPlot(entity, options);
                    break;
                case "situation":
                    this.situationPlotting.editMilitaryPlotting(entity, options)
                    break;
                case "particle":
                    this.particlePlotting.editParticle(entity, options)
                    break
                case "place":
                    this.placePlotting.editPlacePlotting(entity, options)
                    break;
                case "boundary":
                    this.boundaryPlotting.editBoundaryPlotting(entity, options)
                    break;
                case "river":
                    this.riverPlotting.editRiverPlotting(entity, options)
                    break;
                case "road":
                    this.roadPlotting.editRoadPlotting(entity, options)
                    break;
                default:
                    console.log("暂不支持该类型编辑")
            }
        } else {
            console.log("未查询到该实体")
        }
    }

    /**
     * 根据数据渲染标绘
     *
     * @param {*} options 相关参数
     * */
    showPlottingForData(options) {
        switch (options.type) {
            case "image":
                return this.imagePlotting.showPlottingForData(options);
            case "model":
                return this.modelPlotting.showPlottingForData(options);
            case "situation":
                return this.situationPlotting.showPlottingForData(options)
            case "particle":
                return this.particlePlotting.showPlottingForData(options)
            case "river":
                return this.riverPlotting.showPlottingForData(options)
            case "road":
                return this.roadPlotting.showPlottingForData(options)
            case "place":
                return this.placePlotting.showPlottingForData(options)
            case "boundary":
                return this.boundaryPlotting.showPlottingForData(options)
            default:
                return new Promise((resolve, reject) => reject("暂不支持该类型编辑"))
        }
    }

    /**
     * 移除标绘
     *
     * @param {Cesium.Entity} entity 实体
     * */
    removePlotting(entity) {
        if (entity) {
            switch (entity.type) {
                case "image":
                    this.imagePlotting.removeById(entity.id);
                    break;
                case "model":
                    this.modelPlotting.removeById(entity.id);
                    break;
                case "situation":
                    this.situationPlotting.removeById(entity.id)
                    break
                case "river":
                    this.riverPlotting.removeById(entity.id)
                    break;
                case "road":
                    this.roadPlotting.removeById(entity.id)
                    break;
                case "route":
                    this.routePlotting.removeById(entity.id)
                    break;
                case "boundary":
                    this.boundaryPlotting.removeById(entity.id)
                    break;
                case "place":
                    this.placePlotting.removeById(entity.id)
                    break;
                case "tag":
                    this.tagPlotting.removeById(entity.id)
                    break;
                case "particle":
                    this.particlePlotting.removeById(entity.id)
                    break;
                default:
                    console.log("暂不支持该类型编辑")
            }
        } else {
            console.log("未查询到该实体")
        }
    }

    /** 移除所有标绘实体 */
    removeAll() {
        this.imagePlotting.removeAll()
        this.modelPlotting.removeAll()
        this.riverPlotting.removeAll()
        this.placePlotting.removeAll()
        this.boundaryPlotting.removeAll()
        this.situationPlotting.removeAll()
        this.tagPlotting.removeAll()
        this.routePlotting.removeAll()
        this.roadPlotting.removeAll()
        this.particlePlotting.removeAll()
    }

    /**
     * 设置实体移动路线
     *
     * @param {*} entity 实体
     * @param {*} options 配置项
     * */
    setPath(entity, options) {
        if (entity) {
            switch (entity.type) {
                case "image":
                    this.imagePlotting.setPath(entity, options);
                    break;
                case "model":
                    this.modelPlotting.setPath(entity, options);
                    break;
                case "situation":
                    console.log("该实体不支持设置运动路线")
                    break
                case "river":
                    console.log("该实体不支持设置运动路线")
                    break;
                case "place":
                    console.log("该实体不支持设置运动路线")
                    break;
                case "boundary":
                    console.log("该实体不支持设置运动路线")
                    break;
                case "tag":
                    console.log("该实体不支持设置运动路线")
                    break;
                default:
                    console.log("暂不支持该类型编辑")
            }
        } else {
            console.log("该实体不存在")
        }
    }

}

export default Plotting
