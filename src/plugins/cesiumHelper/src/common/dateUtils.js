const Cesium = window.Cesium;

/**
 * 获取当前时间，并将其格式化为ISO 8601时间区间
 *
 * @param time {*} 传入时间，通常是Cesium中的JulianDate对象
 * @param second {number} 增加的秒数，默认增加5秒
 * @returns {string} 格式化后的ISO 8601时间区间，形如 "2000-01-01T00:00:00Z/2000-01-01T00:00:05Z"
 */

export function julianDateToIso8602Times(time, second) {
  second = second || 5;
  // 增加五秒
  const newTime = Cesium.JulianDate.addSeconds(
    time,
    second,
    new Cesium.JulianDate()
  );
  // 格式化成"2000-01-01T00:00:00Z/2000-01-01T00:00:05Z"
  return (
    Cesium.JulianDate.toIso8601(time, 6) +
    "/" +
    Cesium.JulianDate.toIso8601(newTime, 6)
  );
}

/**
 * iso8601格式时间范围 换算 availability所需值
 *
 * @param iso8601TimeRange {*} iso8601格式的时间范围字符串，形如 "2000-01-01T00:00:00Z/2000-01-01T00:00:05Z"
 * @returns {Cesium.TimeIntervalCollection} 返回一个包含时间区间的Cesium.TimeIntervalCollection对象
 */

export function iso8602TimesToJulianDate(iso8601TimeRange) {
  const start = iso8601TimeRange.split("/")[0];
  const stop = iso8601TimeRange.split("/")[1];
  return new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({
      start: Cesium.JulianDate.fromIso8601(start),
      stop: Cesium.JulianDate.fromIso8601(stop),
    }),
  ]);
}

/**
 * availability属性转为两个字符串
 *
 * @param availability {*} 实体 availability 属性，通常是Cesium的TimeIntervalCollection对象
 * @returns {Object} 返回一个包含`startTime`和`endTime`的对象，格式为ISO 8601时间字符串，去除T和Z
 */

export function availabilityToTimes(availability) {
  let startTime = null;
  let endTime = null;

  if (availability && availability.length > 0) {
    const interval = availability.get(0);
    startTime = Cesium.JulianDate.toIso8601(interval.start)
      .replace("T", " ")
      .replace("Z", "");
    endTime = Cesium.JulianDate.toIso8601(interval.stop)
      .replace("T", " ")
      .replace("Z", "");
  }

  return { startTime, endTime };
}

/**
 * JulianDate格式时间转ISO8601
 *
 * @param julianTime {*} JulianDate格式时间
 * @returns {string} 返回ISO 8601格式的时间字符串
 */

export function julianDateToIso8601(julianTime) {
  return parseDateToString(
    "YYYY-MM-DDThh:mm:ss.fffZ",
    julianDateToDate(julianTime)
  );
}
/**
 * JulianDate格式时间转Date
 *
 * @param julianTime {*} JulianDate格式时间
 * @returns {Date} 返回转换后的JavaScript Date对象，已减去8小时时差
 */

export function julianDateToDate(julianTime) {
  const date = Cesium.JulianDate.toDate(julianTime);
  date.setHours(date.getHours() - 8);
  return date;
}

/**
 * JulianDate格式时间转Date
 *
 * @param iso8601 {*} 时间 iso8601 字符串
 * @returns {Cesium.JulianDate} 返回转换后的JulianDate对象
 */

export function julianDateFromIso8601(iso8601) {
  return Cesium.JulianDate.fromIso8601(iso8601);
}
/**
 * Date 转化为指定格式的时间字符串
 *
 * @param format {string} 指定的时间格式，支持"yyyy", "MM", "dd", "hh", "mm", "ss", "fff"等格式
 * @param dateTime {*} 要转换的Date对象或时间戳
 * @returns {string} 返回格式化后的时间字符串
 */

export function parseDateToString(format, dateTime) {
  const date = new Date(dateTime);
  let str = format;
  str = str.replace(/yyyy|YYYY/, date.getFullYear());
  str = str.replace(
    /MM/,
    date.getMonth() > 9
      ? (date.getMonth() + 1).toString()
      : "0" + (date.getMonth() + 1)
  );
  str = str.replace(
    /dd|DD/,
    date.getDate() > 9 ? date.getDate().toString() : "0" + date.getDate()
  );
  str = str.replace(
    /hh|HH/,
    date.getHours() > 9 ? date.getHours().toString() : "0" + date.getHours()
  );
  str = str.replace(
    /mm/,
    date.getMinutes() > 9
      ? date.getMinutes().toString()
      : "0" + date.getMinutes()
  );
  str = str.replace(
    /ss|SS/,
    date.getSeconds() > 9
      ? date.getSeconds().toString()
      : "0" + date.getSeconds()
  );
  str = str.replace(/fff|FFF/, date.getMilliseconds());
  return str;
}

/**
 * 给定时间 求 n 秒后的时间
 *
 * @param {Date} startDate 开始时间
 * @param {number} second 秒
 * @returns {Date} 返回n秒后的时间
 */

export function dateDistance(startDate, second) {
  const date = new Date(startDate);
  date.setSeconds(date.getSeconds() + second);
  return date;
}
