import "./infobox.css"
import "./infobox2.css"
import * as DateUtils from "../common/dateUtils";
const Cesium = window.Cesium

/**
 * 信息框工具类
 *
 * 包含信息框展示 鼠标点击实体弹出信息框
 * @author: Tzx
 * @date: 2023/08/30
 * */
class Infobox{

    viewer = null

    infoboxMap = null

    infoboxGroupContainer = null

    /** 构造方法 */
    constructor(viewer, cesiumContainer, supper) {
        this.viewer = viewer
        this.infoboxGroupContainer = this._createInfoboxGroupContainer(cesiumContainer)
        this.infoboxMap = new Map()

        /** 挂载拖拽事件 */
        if (supper.setting.showInfobox) this._mouseDrag()

        // 添加实体激活默认事件
        supper.addEntityActivateEvent("cesiumHelperInfoboxCreate" ,this.showEntityInfobox.bind(this))
    }

    /**
     * 激活实体信息框
     *
     * @param _
     * @param {Cesium.Entity} entity
     * @return {HTMLElement} dom
     * */
    showEntityInfobox(_, entity){
        const id = entity.id
        if (!entity || !entity["infobox"]) return null
        if (this.infoboxMap.get(id)) return this.infoboxMap.get(id)
        const innerHtml = entity["infobox"] === true ? "<span>"+ entity.name +"</span>" : entity["infobox"]
        let temp = document.createElement("div")
        temp.innerHTML = innerHtml
        const dom = temp.firstElementChild
        dom.style.position = "absolute"
        dom.style.pointerEvents = "auto"
        entity["infobox"] = dom
        this.infoboxGroupContainer.appendChild(dom)
        this.infoboxMap.set(id, dom)
        return dom
    }

    /**
     * 隐藏实体文本框
     *
     * @param {Cesium.Entity} entity
     * @return void
     * */
    hideEntityInfobox(entity){
        const id = entity.id
        const element = this.infoboxMap.get(id)
        this.infoboxMap.delete(id)
        entity["infobox"] = element.outerHTML
        element.remove()
    }

    /** 创建信息框组容器 */
    _createInfoboxGroupContainer(cesiumContainer){
        const dom = document.createElement("div")
        dom.className = "cesium-helper-infobox-group-container"
        dom.style.width = "100%"
        dom.style.height = "100%"
        dom.style.overflow = "hidden"
        dom.style.pointerEvents = "none"
        dom.style.position = "absolute"
        dom.style.left = "0px"
        dom.style.top = "0px"
        cesiumContainer.appendChild(dom)
        return dom
    }

    /** 鼠标拖拽事件  信息框跟随移动 */
    _mouseDrag(){
        // 在每一帧更新div元素的位置
        this.viewer.scene.preRender.addEventListener(() => {
            for (let [key, value] of this.infoboxMap){
                const entity = this.viewer.entities.getById(key)
                if (!entity) {
                    this.infoboxMap.delete(key)
                    value.remove()
                    continue
                }
                const currentTime = DateUtils.julianDateToDate(this.viewer.clock.currentTime)
                const times = DateUtils.availabilityToTimes(entity.availability)
                const startTime = new Date(times.startTime)
                const endTime = new Date(times.endTime)
                if (currentTime < startTime || currentTime > endTime) {
                    this.hideEntityInfobox(entity)
                    continue
                }
                const position = entity.position.getValue(this.viewer.clock.currentTime);
                const screenPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, position);
                if (screenPosition){
                    // 设置div元素的位置
                    value.style.left = screenPosition.x + 'px';
                    value.style.top = screenPosition.y - 60 + 'px';
                }
            }
        });
    }

}

export default Infobox
