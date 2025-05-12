/**
 * 位置信息工具
 *
 * 用于经纬度位置间相关计算
 * @author： charles
 * @date：2023/12/13
 * */

/**
 * 度换成弧度
 *
 * @param {number} d 角度值（单位：度）
 * @returns {number} 对应的弧度值
 *
 * @description
 * 1. 将输入的角度值（单位：度）转换为弧度；
 * 2. 使用公式 `弧度 = 角度 × (π / 180)` 进行转换，返回对应的弧度值。
 */

export function radians(d){
    return d * Math.PI / 180.0;
}

/**
 * 弧度换成度
 *
 * @param {number} x 弧度值
 * @returns {number} 对应的角度值（单位：度）
 *
 * @description
 * 1. 将输入的弧度值转换为角度值；
 * 2. 使用公式 `角度 = 弧度 × (180 / π)` 进行转换，返回对应的角度值。
 */

export function degrees(x){
    return x*180/Math.PI;
}

/**
 * 计算两坐标点间距离
 *
 * @param {number[]} origin 起点坐标，格式为 [经度, 纬度, 高度]，高度默认为 0
 * @param {number[]} target 终点坐标，格式为 [经度, 纬度, 高度]，高度默认为 0
 * @returns {number} 两点之间的距离，单位：米
 *
 * @description
 * 1. 使用 Haversine 公式计算经纬度之间的地表距离，地表距离单位为千米。
 * 2. 通过计算高度差，结合地表距离计算总距离。
 * 3. 返回值为两点之间的总距离，单位转换为米。
 */

export function distance(origin, target) {
    let lng1 = origin[0];
    let lat1 = origin[1];
    let alt1 = origin[2] || 0; // 默认高度为0
    let lng2 = target[0];
    let lat2 = target[1];
    let alt2 = target[2] || 0; // 默认高度为0

    let radLat1 = lat1 * Math.PI / 180.0;
    let radLat2 = lat2 * Math.PI / 180.0;
    let a = radLat1 - radLat2;
    let b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // 地球半径

    let surfaceDistance = Math.round(s * 10000) / 10000; // 地表距离
    let altDifference = alt1 - alt2; // 高度差
     // 总距离
    return Math.sqrt(surfaceDistance * surfaceDistance + altDifference * altDifference) * 1000;
}

/**
 * 求两经纬度间正北方向夹角
 *
 * @param {number[]} point1 起点坐标，格式为 [经度, 纬度]
 * @param {number[]} point2 终点坐标，格式为 [经度, 纬度]
 * @returns {number} 两点间的正北方向夹角，单位：度
 *
 * @description
 * 1. 使用大地测量公式计算两点之间的正北方向夹角。
 * 2. 根据经纬度坐标计算两点的角度差，并通过三角函数得出正北方向的夹角。
 * 3. 返回值为两点之间的夹角，单位为度。
 */

export function getAzimuth (point1, point2) {
    let rad = Math.PI / 180,
        lat1 = point1[1] * rad,
        lat2 = point2[1] * rad,
        lon1 = point1[0] * rad,
        lon2 = point2[0] * rad;
    const a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const b = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return degrees(Math.atan2(a, b));
}

/**
 * 已知方位角及距离 求另一个点
 *
 * @param {number[]} point 参考点的经纬度，格式为 [经度, 纬度]
 * @param {number} brng 方位角，单位为度
 * @param {number} dist 距离，单位为米
 * @returns {number[]} 计算得到的新点的经纬度，格式为 [经度, 纬度]
 *
 * @description
 * 1. 使用大地坐标系（WGS-84）的参数进行计算，包括地球的长半径、短半径以及扁率。
 * 2. 通过已知的参考点（起始点）经纬度、方位角和距离，利用大地测量算法（Vincenty算法）计算出新点的经纬度。
 * 3. 方位角是从北向东的角度，距离是从起点沿着方位角方向的距离。
 * 4. 返回新点的经纬度，精确到小数点后六位。
 */

export function computePointForDegAndLength(point, brng, dist){
    //大地坐标系资料WGS-84 长半径a=6378137 短半径b=6356752.3142 扁率f=1/298.2572236
    let a = 6378137;
    let b = 6356752.3142;
    let f=1/298.257223563;

    let lon1 = point[0];
    let lat1 = point[1];
    let s = dist;
    let alpha1 = radians(brng);
    let sinAlpha1 = Math.sin(alpha1);
    let cosAlpha1 = Math.cos(alpha1);

    let tanU1 = (1-f) * Math.tan(radians(lat1));
    let cosU1 = 1 / Math.sqrt((1 + tanU1*tanU1)), sinU1 = tanU1*cosU1;
    let sigma1 = Math.atan2(tanU1, cosAlpha1);
    let sinAlpha = cosU1 * sinAlpha1;
    let cosSqAlpha = 1 - sinAlpha*sinAlpha;
    let uSq = cosSqAlpha * (a*a - b*b) / (b*b);
    let A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
    let B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));

    let sigma = s / (b*A), sigmaP = 2*Math.PI;

    while (Math.abs(sigma-sigmaP) > 1e-12) {
        var cos2SigmaM = Math.cos(2*sigma1 + sigma);
        var sinSigma = Math.sin(sigma);
        var cosSigma = Math.cos(sigma);
        var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
            B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
        sigmaP = sigma;
        sigma = s / (b*A) + deltaSigma;
    }

    let tmp = sinU1*sinSigma - cosU1*cosSigma*cosAlpha1;
    let lat2 = Math.atan2(sinU1*cosSigma + cosU1*sinSigma*cosAlpha1,
        (1-f)*Math.sqrt(sinAlpha*sinAlpha + tmp*tmp));
    let lambda = Math.atan2(sinSigma*sinAlpha1, cosU1*cosSigma - sinU1*sinSigma*cosAlpha1);
    let C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
    let L = lambda - (1-C) * f * sinAlpha *
        (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));

    return [parseFloat((lon1 + degrees(L)).toFixed(6)), parseFloat((degrees(lat2)).toFixed(6))];
}

