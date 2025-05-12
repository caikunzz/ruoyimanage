import service from "@/api/base/request-java";

// 查询战例信息
export function info(caseId) {
    return service.get("/bc/example/"+caseId)
}

// 查询战例树
export function tree(caseId) {
    return service.get("/bc/example/tree/"+caseId)
}
