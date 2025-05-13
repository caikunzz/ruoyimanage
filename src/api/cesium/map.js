import service from "@/api/base/request-video";

export function mapDownload(data) {
  return service.post("/map/tiles", data, {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
