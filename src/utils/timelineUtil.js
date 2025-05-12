import dateUtils from "@/utils/dateUtils";

/**
 * 将日期转换为时间字符串
 * 将时间字符串 减去 一个时间字符串 所剩下的时间 转化为 00:00:00 时分秒这样的字符串
 *
 * @param {string} currentTimeStr 当前日期字符串  2000-01-01 00:00:00
 * @param {string} startTimeStr 开始日期字符串  2000-01-01 00:00:00
 * */
export function transformTimeString(currentTimeStr, startTimeStr) {
    const currentTime = new Date(currentTimeStr)
    const startTime = new Date(startTimeStr)
    const timeDifference = currentTime.getTime() - startTime.getTime(); //时间差的毫秒数
    const hours = Math.floor(timeDifference / 3600000); // 1小时 = 3600000毫秒
    const minutes = Math.floor((timeDifference % 3600000) / 60000); // 1分钟 = 60000毫秒
    const seconds = Math.floor((timeDifference % 60000) / 1000); // 1秒 = 1000毫秒
    return `${hours > 9 ? hours : '0' + hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 将时间转换为日期
 * 将 00:00:00 时分秒这样的字符串 以某个开始时间 转化为 2000-01-01 00:00:00 这样的时间字符串
 *
 * @param {string} timeString 当前时间字符串  01:20:03
 * @param {string} startTimeString 开始时间字符串  2000-01-01 00:00:00
 * */
export function transformDateString(timeString, startTimeString) {
    const second = transformSecond(timeString)
    const startDate = new Date(startTimeString)
    const endDate = dateUtils.addSecond(startDate, second)
    return dateUtils.parseDateToString("yyyy-MM-dd HH:mm:ss", endDate)
}

/**
 * 将时间字符串转化为秒
 *
 * @param {string} timeString 当前时间字符串  01:20:03
 * */
export function transformSecond(timeString) {
    const timeList = timeString.split(/[:|.]/)
    const hours = parseInt(timeList[0]) * 3600
    const min = parseInt(timeList[1]) * 60
    const second = parseInt(timeList[2])
    const milliseconds = parseFloat((timeList.length > 3 ? parseInt(timeList[3]) : "0")) / 1000
    return hours + min + second + milliseconds
}
