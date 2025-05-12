/* 位置相关poi */
import service from "@/api/base/request-gdpoi";

export function geo(param){
        return service.get("/v3/geocode/geo", {params: param})
}
