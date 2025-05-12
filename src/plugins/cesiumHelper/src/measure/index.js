import "../../lib/cesium-measure"
const Cesium = window.Cesium
class Measure{
    viewer = null
    cesiumContainer = null
    supper = null
    measure = null
    constructor(viewer, cesiumContainer, supper) {
        this.viewer = viewer
        this.cesiumContainer=cesiumContainer
        this.supper = supper
        this.measure = new Cesium.Measure(this.viewer);
    }
    distanceMeasure(){
        this.measure.drawLineMeasureGraphics({width:3,material:"rgba(255, 255,0,0.8)",clampToGround: true, callback: () => { } });
    }
    areaMeasure(){
        this.measure.drawAreaMeasureGraphics({width:3,material:"rgba(255, 255,0,0.8)",clampToGround: true, callback: () => { } });
    }
    modelMeasure(){
        this.measure.drawTrianglesMeasureGraphics({width:3,material:"rgba(255, 255,0,0.8)",clampToGround: false, callback: () => { } });
    }
    cancel(){
        this.measure._drawLayer.entities.removeAll();
    }
}
export default Measure