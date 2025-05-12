import service from "@/api/base/request-video";

export function videoProperties(data){
    return service.post("/gis/video", data,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}