import * as plottingUtils from "./plottingUtils";
const Cesium = window.Cesium;
/** 路径工具类 */
/**
 * 生成一系列时间点
 *
 * @param {Object} options - 配置对象，包含起始时间和结束时间
 * @param {Array} points - 地理坐标点数组，每个点包含经纬度和高度
 * @returns {Array} - 返回一个时间数组，每个时间点对应于给定坐标点
 *
 * @description
 * 1. 从 `options.times.start` 和 `options.times.end` 中提取并转换成 `Cesium.JulianDate` 类型的时间对象。
 * 2. 初始化时间数组 `timeG`，并将起始时间（精确到毫秒）添加到数组中。
 * 3. 计算起始时间和结束时间之间的时间差，以秒为单位。
 * 4. 通过 `calculateDistances` 函数计算每个地理坐标点之间的距离以及总距离。
 * 5. 计算每个点到下一个点所需的时间间隔（`timeIntervals`），通过总时间差和总距离进行分配。
 * 6. 使用 `Cesium.JulianDate.addSeconds` 方法为每个点计算新的时间并添加到 `timeG` 数组中。
 * 7. 在循环结束时，将最后一个时间点设置为结束时间 `endTime`。
 * 8. 返回时间数组 `timeG`，表示每个点对应的时间点。
 */

export function generateTime(options, points) {
  let startTime = Cesium.JulianDate.fromIso8601(options.times.start);
  let endTime = Cesium.JulianDate.fromIso8601(options.times.end);
  let timeG = [Cesium.JulianDate.toIso8601(startTime, 6)];
  const timeDifferenceInSeconds = Cesium.JulianDate.secondsDifference(
    endTime,
    startTime
  );
  // 计算距离和总距离
  const { distances, totalDistance } = calculateDistances(
    points.map((point) => plottingUtils.degreesToLatitudeAndLongitude(point))
  );
  // 计算每个点到下一个点需要的时间
  const timeIntervals = calculateTimeIntervals(
    distances,
    timeDifferenceInSeconds,
    totalDistance
  );
  // 输出每个点到下一个点需要的时间
  for (let i = 0; i < timeIntervals.length; i++) {
    const secondsToAdd = timeIntervals[i];
    const newTime = Cesium.JulianDate.addSeconds(
      startTime,
      secondsToAdd,
      new Cesium.JulianDate()
    );
    timeG.push(Cesium.JulianDate.toIso8601(newTime, 6));
    if (i === timeIntervals.length - 1) {
      timeG[timeG.length - 1] = Cesium.JulianDate.toIso8601(endTime, 6);
    }
    startTime = newTime;
  }
  return timeG;
}
/**
 * 计算一组点之间的距离
 *
 * @param {Array} points - 经纬度数组，每个点包含经度、纬度以及可选的高度信息
 * @returns {Object} - 返回一个对象，包含每两个点之间的距离数组 (`distances`) 和总距离 (`totalDistance`)
 *
 * @description
 * 1. 初始化一个空数组 `distances` 用于存储每两个相邻点之间的距离。
 * 2. 初始化一个变量 `totalDistance` 用于累计所有相邻点之间的总距离。
 * 3. 遍历 `points` 数组，从第二个点开始（索引为 1），计算每两个相邻点之间的距离。
 * 4. 每次计算的距离通过 `calculateHaversineDistance` 函数获取，并将该距离添加到 `distances` 数组。
 * 5. 累加当前距离到 `totalDistance`，最终得到所有点之间的总距离。
 * 6. 返回一个包含 `distances` 和 `totalDistance` 的对象。
 */

function calculateDistances(points) {
  const distances = [];
  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    const distance = calculateHaversineDistance(prevPoint, currentPoint);
    distances.push(distance);
    totalDistance += distance;
  }

  return { distances, totalDistance };
}
/**
 * 计算两点间的哈弗辛距离（大圆距离）
 *
 * @param {Array} point1 - 第一个点的经纬度数组 [纬度, 经度]
 * @param {Array} point2 - 第二个点的经纬度数组 [纬度, 经度]
 * @returns {number} - 返回两点之间的哈弗辛距离，单位为公里
 *
 * @description
 * 1. 提取 `point1` 和 `point2` 的经纬度，分别赋值给 `lat1`, `lon1` 和 `lat2`, `lon2`。
 * 2. 将纬度转换为弧度：`radLat1` 和 `radLat2`。
 * 3. 计算纬度和经度差值：`deltaLat` 和 `deltaLon`。
 * 4. 通过哈弗辛公式计算两点之间的球面距离的中间值 `a`。
 * 5. 计算角度 `c`，然后通过 `2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))` 获得两点之间的角度。
 * 6. 使用地球半径（6371 公里）乘以角度 `c` 得到实际的距离，单位为公里。
 *
 * 注意：此函数使用的是球面地球模型，结果可能与实际值略有差异，特别是在地形复杂的地区。
 */

function calculateHaversineDistance(point1, point2) {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const radLat1 = (Math.PI * lat1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const deltaLat = (Math.PI * (lat2 - lat1)) / 180;
  const deltaLon = (Math.PI * (lon2 - lon1)) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return 6371 * c;
}

function calculateTimeIntervals(distances, totalSeconds, totalDistance) {
  return distances.map((distance) => (distance / totalDistance) * totalSeconds);
}
