/**
 * 时间处理工具类
 *
 * 实现格式化、转换时间字符串相关功能
 * @author:charles
 * @date:2023/08/31
 * */
class DateUtils{

    static YYYY = "yyyy";

    static YYYY_MM = "yyyy-MM";

    static YYYY_MM_DD = "yyyy-MM-dd";

    static YYYYMMDDHHMMSS = "yyyyMMddHHmmss";

    static YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss";

    static YYYY_MM_DDTHH_MM_SSZ = "yyyy-MM-ddTHH:mm:ssZ";

    /** 获取当前时间 */
    static getNowDate(){
        return new Date()
    }

    /** 时间字符串转化为 Date */
    static parseDate(timeStr){
        return new Date(timeStr)
    }

    /** Date 转化为指定格式的时间字符串 */
    static parseDateToString(format, dateTime){
        const date = new Date(dateTime)
        let str = format
        str = str.replace(/yyyy|YYYY/, date.getFullYear())
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
        str = str.replace(
            /fff|FFF/,
            date.getMilliseconds()
        );
        return str;
    }

    /**
     * 给定时间 求 n 秒后的时间
     *
     * @param {Date} startDate 开始时间
     * @param {number} second 秒
     */
    static addSecond(startDate, second){
        const date = new Date(startDate)
        date.setSeconds(date.getSeconds()+second)
        return date
    }

    /**
     * 求两时间见时间差（秒）
     * */
    static dateDifference(date1, date2){
        return (date2.getTime() - date1.getTime()) / 1000
    }
}

export default DateUtils
