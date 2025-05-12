import service from "@/api/base/request-python";

export const defaultUrl = service.defaultUrl

export function tts(text){
    return service.get("/tts", {params: {text: text}})
}
