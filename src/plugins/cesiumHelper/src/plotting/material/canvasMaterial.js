const Cesium = window.Cesium;
/**
 * 使用镜面渐变材质
 *
 * @param colorList {*} 渐变颜色数组 [rgba(0,0,0,0), ...]
 * */
export function mirrorMaterial(colorList) {
  const canvas = document.createElement("canvas");
  canvas.width = 200; // 设置画布宽度
  canvas.height = 200; // 设置画布高度
  if (canvas && canvas.getContext) {
    let ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
    for (let i = 0; i < colorList.length; i++) {
      if (colorList.length === 1) {
        grad.addColorStop(1, colorList[i]);
      } else {
        if (i === 0) grad.addColorStop(0, colorList[i]);
        else if (i === colorList.length - 1) grad.addColorStop(1, colorList[i]);
        else
          grad.addColorStop(
            parseFloat((1 / colorList.length).toFixed(1)),
            colorList[i]
          );
      }
    }
    ctx.fillStyle = grad; // 设置fillStyle为当前的渐变对象
    ctx.fillRect(0, 0, 200, 200); // 绘制渐变图形
  }
  return new Cesium.ImageMaterialProperty({
    image: canvas,
    transparent: true,
  });
}

/**
 * 使用渐变材质
 *
 * @param colorList {*} 渐变颜色数组 [rgba(0,0,0,0), ...]
 * @param deg {number} 渐变的角度
 * */
export function gradientMaterial(colorList, deg) {
  const width = 200;
  const height = 500;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  if (canvas && canvas.getContext) {
    let ctx = canvas.getContext("2d");

    // 角度转换为弧度
    const rad = (deg * Math.PI) / 180;

    // 通过角度确定渐变线的最长距离，确保渐变覆盖整个画布
    const diagonal = Math.sqrt(width * width + height * height);
    const angleOffset = Math.atan2(height, width); // 画布对角线与X轴的夹角

    // 计算渐变起点和终点
    const x0 = width / 2 - (Math.cos(rad - angleOffset) * diagonal) / 2;
    const y0 = height / 2 - (Math.sin(rad - angleOffset) * diagonal) / 2;
    const x1 = width / 2 + (Math.cos(rad - angleOffset) * diagonal) / 2;
    const y1 = height / 2 + (Math.sin(rad - angleOffset) * diagonal) / 2;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);

    // 添加颜色停靠点
    for (let i = 0; i < colorList.length; i++) {
      const stop = i / (colorList.length - 1);
      grad.addColorStop(stop, colorList[i]);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  canvas.dataset.color = colorList[colorList.length - 1];
  return new Cesium.ImageMaterialProperty({
    image: canvas,
    transparent: true,
  });
}
