/* 决策相关api */
import service from "@/api/base/request-java";

export function branch(flowNodeId) {
  return service.get("/bc/decision_resource/branch/" + flowNodeId);
}

export function previous(flowNodeId) {
  return service.get("/bc/decision_resource/previous/" + flowNodeId);
}

export function list(flowNodeId) {
  return service.get("/bc/decision_resource/list/" + flowNodeId);
}

export function stream(data) {
  return service.post("/bc/decision_resource/stream", data);
}

export function save(flowNodeId, data) {
  return service.post("/bc/decision_resource/save/" + flowNodeId, data);
}
