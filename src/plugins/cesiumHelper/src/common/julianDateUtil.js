const Cesium = window.Cesium;

/**
 * 儒略日时间转 Iso8601 格式
 *
 * @param {Cesium.JulianDate} julianDate Cesium 中的 JulianDate 对象
 * @returns {string} 返回对应的 ISO 8601 格式时间字符串
 *
 * @description
 * 1. 将输入的 `JulianDate` 对象转换为 ISO 8601 格式的时间字符串；
 * 2. 使用 Cesium 的 `JulianDate.toIso8601` 方法完成转换，返回标准的日期时间格式。
 */

export function julianDateToIso8601(julianDate) {
  return Cesium.JulianDate.toIso8601(julianDate);
}

/**
 * 儒略日时间转 Date 格式
 *
 * @param {Cesium.JulianDate} julianDate Cesium 中的 JulianDate 对象
 * @returns {Date} 返回转换后的 JavaScript Date 对象
 *
 * @description
 * 1. 将输入的 `JulianDate` 对象转换为 JavaScript 的 `Date` 对象；
 * 2. 将转换后的时间减去 8 小时，以适应时区偏差（例如北京时间 UTC+8）；
 * 3. 返回调整时区后的 `Date` 对象。
 */

export function julianDateToDate(julianDate) {
  const date = Cesium.JulianDate.toDate(julianDate);
  date.setHours(date.getHours() - 8);
  return date;
}

/**
 * 儒略日时间转 时间字符串 格式
 *
 * @param {Cesium.JulianDate} julianDate Cesium 中的 JulianDate 对象
 * @returns {string} 返回格式化后的时间字符串，替换 "T" 为空格，"Z" 为无
 *
 * @description
 * 1. 将输入的 `JulianDate` 对象转换为 ISO 8601 格式的时间字符串；
 * 2. 使用 `replace` 方法将 ISO 8601 字符串中的 "T" 替换为空格，将 "Z" 移除；
 * 3. 返回处理后的时间字符串，格式为 "YYYY-MM-DD hh:mm:ss.SSS"。
 */

export function julianDateToString(julianDate) {
  const str = Cesium.JulianDate.toIso8601(julianDate);
  return str.replace("T", " ").replace("Z", "");
}

/**
 * Iso8601 时间转儒略日格式
 *
 * @param {String} iso8601 ISO 8601 格式的时间字符串
 * @returns {Cesium.JulianDate} 返回对应的 JulianDate 对象
 *
 * @description
 * 1. 将输入的 ISO 8601 格式时间字符串转换为 `JulianDate` 对象；
 * 2. 使用 Cesium 的 `JulianDate.fromIso8601` 方法进行转换，返回与之对应的儒略日格式时间。
 */

export function julianDateFromIso8601(iso8601) {
  return Cesium.JulianDate.fromIso8601(iso8601);
}

/**
 * Date 时间转儒略日格式
 *
 * @param {Date} date JavaScript 的 Date 对象
 * @returns {Cesium.JulianDate} 返回对应的 JulianDate 对象
 *
 * @description
 * 1. 将输入的 `Date` 对象转换为 `JulianDate` 格式；
 * 2. 使用 Cesium 的 `JulianDate.fromDate` 方法进行转换，返回与之对应的儒略日格式时间。
 */

export function julianDateFromDate(date) {
  return Cesium.JulianDate.fromDate(date);
}
