/* GIS 资源信息相关 api */
import service from "@/api/base/request-java";

export function queryCityById(id) {
  return service.get("/gis/city/get/" + id);
}

export function queryBoundaryById(id) {
  return service.get("/gis/boundary/get/" + id);
}

export function queryRiverById(id) {
  return service.get("/gis/river/get/" + id);
}

export function queryRoadById(id) {
  return service.get("/gis/road/get/" + id);
}

export function queryCityByCode(code) {
  return service.get("/gis/city/code/" + code);
}

export function queryCityLike(name) {
  return service.get("/gis/city/like/" + name);
}

export function queryCityNliLike(name) {
  return service.get("/gis/city/nlplike/" + name);
}

export function queryRiverLike(name) {
  return service.get("/gis/river/like/" + name);
}

export function queryRoadLike(name) {
  return service.get("/gis/road/like/" + name);
}

export function queryBoundaryLike(name) {
  return service.get("/gis/boundary/like/" + name);
}

export function insertCity(data) {
  return service.post("/gis/city/insert", data);
}

export function routePlan(origin, target) {
  return service.get("/gis/route/plan/" + origin + "/" + target);
}
