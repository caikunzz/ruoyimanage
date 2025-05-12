import service from "@/api/base/request-java";

// 保存战例资源
export function save(caseId, data) {
    return service.post("/bc/example_resource/save/"+caseId, data)
}

export function list(caseId) {
    return service.get("/bc/example_resource/list/"+caseId)
}