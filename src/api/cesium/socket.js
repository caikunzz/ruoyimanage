/* 位置相关poi */
import service from "@/api/base/request-java";

export function getSocketId(param){
    return service.get("/gis/socket/uuid", {params: param})
}
