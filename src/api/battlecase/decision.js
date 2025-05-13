import service from "@/api/base/request-java";

export function tree(exampleId) {
  return service.get("/bc/decision/tree/" + exampleId);
}
