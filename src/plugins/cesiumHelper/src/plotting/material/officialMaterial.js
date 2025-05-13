const Cesium = window.Cesium;
/** 设置虚线材质*/
export function setLineMaterial(color) {
  return new Cesium.PolylineDashMaterialProperty({
    color: color, // 设置虚线的颜色
    // gapColor:Cesium.Color.YELLOW,   //间隙颜色
    dashLength: 30.0, // 设置虚线段的长度
    dashPattern: 255.0, // 设置虚线的模式，这里使用一个8位二进制数来表示虚线和间隙
  });
}

/** 设置发光线材质*/
export function setGlowLine(color) {
  return new Cesium.PolylineGlowMaterialProperty({
    glowPower: 0.1,
    color: color,
  });
}
