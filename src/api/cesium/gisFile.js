/* GIS 资源信息相关 api */
import service from "@/api/base/request-java";

/** 获取用户上传列表 */
export function listByUser(){
    return service.get("/gis/file/listByUser")
}

/** 获取用户上传列表 */
export function add(data){
    return service.post("/gis/file", data)
}

export function del(id){
    return service.delete("/gis/file/" + id)
}

/** 获取用户上传列表 */
export function exportVideo(data){
    return service.post("/gis/file/video/export", data, {
        responseType: 'blob', // 关键：指定返回类型为二进制流
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}
