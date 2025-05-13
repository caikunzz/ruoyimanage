const Cesium = window.Cesium;

const PRECISION = 6; // 小数点后的位数
const EARTH_RADIUS = 6371; // 地球半径（千米）
/**
 * 根据行驶时间返回每个点所需要时间
 *
 * @param {*} options 参数列表，包含起止时间、行驶路径等信息
 * @returns {Array} 返回包含每个点对应时间的ISO 8601格式时间字符串数组
 *
 * @description
 * 1. 如果提供了`difference`，计算从起始时间开始，经过`difference`秒后的结束时间；
 * 2. 如果没有提供`difference`，则使用`times.end`作为结束时间；
 * 3. 计算起始时间到结束时间的时间差，并根据路径计算每个点到下一个点的所需时间；
 * 4. 根据时间差和路径距离，计算每个点的时间间隔，并生成相应的时间数组。
 */

export function generateTime(options) {
  console.log(options);
  let startTime;
  let endTime;
  if (options.difference) {
    let start = Cesium.JulianDate.fromIso8601(options.times.start);
    endTime = Cesium.JulianDate.addSeconds(
      start,
      options.difference,
      new Cesium.JulianDate()
    );
  } else {
    endTime = Cesium.JulianDate.fromIso8601(options.times.end);
  }
  startTime = Cesium.JulianDate.fromIso8601(options.times.start);
  let timeG = [Cesium.JulianDate.toIso8601(startTime, PRECISION)];
  const timeDifferenceInSeconds = Cesium.JulianDate.secondsDifference(
    endTime,
    startTime
  );
  // 计算距离和总距离
  const { distances, totalDistance } = calculateDistances(options.path);

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
    timeG.push(Cesium.JulianDate.toIso8601(newTime, PRECISION));
    if (i === timeIntervals.length - 1) {
      timeG[timeG.length - 1] = Cesium.JulianDate.toIso8601(endTime, PRECISION);
    }
    startTime = newTime;
  }
  return timeG;
}
/**
 * 根据数据渲染实体运动动画
 *
 * @param {*} options 相关参数，包含位置点和时间信息
 * @returns {Cesium.SampledPositionProperty} 返回一个包含多个位置样本的SampledPositionProperty对象，用于实体动画
 *
 * @description
 * 1. 创建一个`SampledPositionProperty`对象，用于存储运动轨迹；
 * 2. 遍历传入的`points`，通过对应的经纬度和高度值创建`Cartesian3`坐标；
 * 3. 根据传入的时间数组`times`将位置点与时间关联，形成时间-位置的样本；
 * 4. 最终返回`positionProperty`，它可以用于实体的运动轨迹渲染。
 */

export function computedRunPoints(options) {
  // 创建 SampledPositionProperty 对象
  const positionProperty = new Cesium.SampledPositionProperty();
  for (let i = 0; i < options.position.points.length; i++) {
    const point = options.position.points[i];
    const time = Cesium.JulianDate.fromIso8601(options.position.times[i]);
    const position = Cesium.Cartesian3.fromDegrees(
      point[0],
      point[1],
      point[2]
    );
    positionProperty.addSample(time, position);
  }
  return positionProperty;
}
/**
 * 根据行驶速度返回每个点所需要时间
 *
 * @param {*} options 参数列表，包含起始时间、路径和行驶速度等信息
 * @returns {Array} 返回包含每个点对应时间的ISO 8601格式时间字符串数组
 *
 * @description
 * 1. 从`startTime`开始，将其转换为`JulianDate`格式；
 * 2. 根据路径和行驶速度，计算每个点之间的行驶时间（单位：秒）；
 * 3. 使用行驶时间间隔，通过`Cesium.JulianDate.addSeconds`方法逐步计算每个点的时间；
 * 4. 最终返回一个时间数组，包含了从起始点到每个后续点的时间，格式为ISO 8601。
 */

export function generateSpeedTime(options) {
  let startTime = Cesium.JulianDate.fromIso8601(options.startTime);
  // 计算每个点之间的行驶时间
  const timesBetweenPoints = calculateTimeBetweenPoints(
    options.path,
    options.speed * 10
  );
  let timeJ = [Cesium.JulianDate.toIso8601(startTime, PRECISION)];
  for (let i = 0; i < timesBetweenPoints.length; i++) {
    const secondsToAdd = timesBetweenPoints[i];
    const newTime = Cesium.JulianDate.addSeconds(
      startTime,
      secondsToAdd,
      new Cesium.JulianDate()
    );
    timeJ.push(Cesium.JulianDate.toIso8601(newTime, PRECISION));
    startTime = newTime;
  }

  return timeJ;
}

/**
 * 计算每个点到下一个点需要的时间
 *
 * @param {*} distances 距离数组，每个元素表示路径中相邻两点之间的距离
 * @param {*} totalSeconds 总行驶时间（单位：秒）
 * @param {*} totalDistance 总路径距离
 * @returns {Array} 返回一个数组，包含每个点到下一个点的时间（单位：秒）
 *
 * @description
 * 1. 使用`distances`数组和`totalDistance`计算每个点到下一个点的时间；
 * 2. 根据距离和总距离的比例，将总时间`totalSeconds`分配到每个点之间；
 * 3. 使用`map`方法遍历距离数组，计算并返回每个点之间的时间间隔。
 */

function calculateTimeIntervals(distances, totalSeconds, totalDistance) {
  return distances.map((distance) => (distance / totalDistance) * totalSeconds);
}

/**
 * 计算每个点之间的距离和总距离
 *
 * @param {*} points 路径点数组，每个点包含经度、纬度和高度
 * @returns {Object} 返回一个对象，包含`distances`（每对相邻点之间的距离数组）和`totalDistance`（总距离）
 *
 * @description
 * 1. 遍历路径点数组`points`，从第二个点开始计算每对相邻点之间的距离；
 * 2. 使用`calculateHaversineDistance`函数计算两点间的距离，并将其加入到`distances`数组；
 * 3. 将每次计算的距离累加到`totalDistance`，最终返回包含每个点之间的距离数组和总距离的对象。
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
 * 根据行驶速度返回每个点所需要时间
 *
 * @param {*} points 路径点数组，每个点包含经度、纬度和高度
 * @param {*} speed 实体行驶速度，单位：单位距离/小时
 * @returns {Array} 返回一个数组，包含每对相邻点之间所需的时间（单位：秒）
 *
 * @description
 * 1. 遍历路径点数组`points`，计算每对相邻点之间的距离；
 * 2. 使用`calculateHaversineDistance`函数计算两点之间的距离；
 * 3. 根据速度`speed`和距离计算行驶时间（单位：小时），然后将其转换为秒；
 * 4. 返回每对点之间所需的时间数组。
 */

function calculateTimeBetweenPoints(points, speed) {
  return points.slice(0, -1).map((point, i) => {
    const nextPoint = points[i + 1];
    const distance = calculateHaversineDistance(point, nextPoint);
    const timeInHours = distance / speed;
    return timeInHours * 3600; // 转换为秒
  });
}

/**
 * 使用 Haversine 公式计算两个经纬度点之间的距离（以千米为单位）
 *
 * @param {*} point1 经纬度数组，表示起点坐标 [纬度, 经度]
 * @param {*} point2 经纬度数组，表示终点坐标 [纬度, 经度]
 * @returns {number} 返回两个点之间的距离，单位为千米
 *
 * @description
 * 1. 将输入的经纬度从度数转换为弧度，以便进行三角函数计算；
 * 2. 计算两点之间的纬度差和经度差；
 * 3. 使用 Haversine 公式计算球面两点之间的距离；
 * 4. 返回计算结果，单位为千米（通过与地球半径的乘积得到）。
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

  return EARTH_RADIUS * c;
}
