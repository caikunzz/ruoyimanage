/* 文件系统相关 api */
import request from "@/api/base/request-java";

// 查询文件详细信息
export function info(id) {
  return request.get("/file/node/" + id);
}

// 查询列表下的文件
export function list(query) {
  return request.get("/file/node/list", { params: query });
}
//模糊检索文件
export function like(keyword) {
  return request.get("/file/node/like/" + keyword);
}
