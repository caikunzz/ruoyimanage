/**
 * 将从实体获取到的颜色进行格式化 "rgba(241,7,7,0.6)"
 * */
export function colorFormat(colorObj) {
    return `rgba(${colorObj.red * 255},${colorObj.green * 255},${colorObj.blue * 255},${colorObj.alpha})`
}