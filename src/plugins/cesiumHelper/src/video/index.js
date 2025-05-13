import * as uuid from "../common/uuid";
import {
  julianDateFromIso8601,
  julianDateToIso8602Times,
} from "../common/dateUtils";
import * as DateUtils from "../common/dateUtils";

/**
 * 视频标绘类
 *
 * 包含音频播放、暂停、结束、任一点播放等功能
 * @author: Tzx
 * @date: 2023/08/30
 * */
class Video {
  viewer = null;

  videoGroupContainer = null;

  videoMap = null;

  isPlay = false;

  supper = null;

  /** 当前音频播放展示 */
  activateElements = null;

  /** 上一帧时间点 */
  lastFrameTime = null;

  constructor(viewer, container, supper) {
    this.viewer = viewer;
    this.supper = supper;
    this.cesiumContainer = container;
    this.videoMap = new Map();
    this.activateElements = new Map();

    this.videoGroupContainer = this._createVideoGroupContainer(container);

    supper.player.addEventListener(
      "play",
      "playVideo",
      this.playVideo.bind(this)
    );
    supper.player.addEventListener(
      "pause",
      "pauseVideo",
      this.pauseVideo.bind(this)
    );
    supper.player.addEventListener(
      "change",
      "updateVideo",
      this.updateVideoState.bind(this)
    );
    supper.player.addEventListener(
      "speed_change",
      "speed_change_video_callback",
      this._speedChangeCallback.bind(this)
    );
  }

  /** 添加音频 */
  addVideo(options) {
    return new Promise((resolve, reject) => {
      try {
        options.id = options.id || uuid.uuid();
        const startTime = options.availability
          ? julianDateFromIso8601(options.availability.split("/")[0])
          : this.viewer.clock.currentTime;
        this._createVideoContainer(options).then((video) => {
          const distance =
            Math.round(video.duration) &&
            Math.round(video.duration) !== Infinity
              ? Math.round(video.duration)
              : 5;
          const temp = {
            id: options.id,
            name: options.name || this._getDefaultName(),
            type: "video",
            availability:
              options.availability ||
              julianDateToIso8602Times(startTime, distance),
            url: options.references,
            scale: options.scale || 1,
            position: options.position || [0, 0, 0],
            show: true,
          };
          video.style.width = 300 * temp.scale + "px";
          video.style.height = "auto";
          video.style.left = temp.position[0] + "px";
          video.style.top = temp.position[1] + "px";
          temp["html"] = video;
          this.videoMap.set(options.id, temp);
          this.viewer.resource.set(options.id, this.getVideoToJson(temp));
          resolve(temp);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /** 编辑音频 */
  editVideo(id, options) {
    const video = this.videoMap.get(id);
    "groupId" in options && (video.groupId = options.groupId);
    "name" in options && (video.name = options.name);
    "data" in options && (video.data = options.data);
    "sort" in options && (video.sort = options.sort);
    "availability" in options && (video.availability = options.availability);
    if ("scale" in options) {
      video.html.style.width = 300 * options.scale + "px";
      video.scale = options.scale;
    }
    if ("show" in options) {
      video.html.style.display = options.show ? "block" : "none";
      video.show = options.show;
    }
    if ("position" in options) {
      video.position = options.position;
      video.html.style.left = options.position[0] + "px";
      video.html.style.top = options.position[1] + "px";
    }
    this.viewer.resource.set(id, this.getVideoToJson(video));
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime);
    this.updateVideoState(time);
  }

  /** 添加音频 */
  loadVideoOption(options) {
    return new Promise((resolve) => {
      const id = options.id;
      this._createVideoContainer(options).then((video) => {
        const temp = {
          id: id,
          name: options.name || this._getDefaultName(),
          type: "video",
          data: options.data,
          sort: options.sort,
          groupId: options.groupId,
          availability: options.availability,
          url: options.references,
          scale: options.scale,
          position: options.position,
          show: true,
        };
        video.style.width = 300 * temp.scale + "px";
        video.style.height = "auto";
        video.style.left = options.position[0] + "px";
        video.style.top = options.position[1] + "px";
        temp["html"] = video;
        this.videoMap.set(id, temp);
        this.viewer.resource.set(id, this.getVideoToJson(temp));
        resolve(temp);
      });
    });
  }

  /** 移除音频 */
  removeById(id) {
    const video = this.videoMap.get(id);
    video.html?.remove();
    this.videoMap.delete(id);
    this.activateElements.delete(id);
  }

  /** 移除音频 */
  removeAll() {
    for (let [id, value] of this.videoMap) {
      value.html?.remove();
      this.videoMap.delete(id);
      this.viewer.resource.delete(id);
    }
    this.activateElements = new Map();
  }

  /** 根据 id 获取字幕 */
  getVideoById(id) {
    return this.videoMap.get(id);
  }

  /** 获取音频 Json */
  getVideoToJson(entity) {
    const startTime = entity.availability
      .split("/")[0]
      .replace("T", " ")
      .replace("Z", "");
    const endTime = entity.availability
      .split("/")[1]
      .replace("T", " ")
      .replace("Z", "");
    return {
      id: entity.id,
      name: entity.name,
      type: "video",
      data: entity.data || null,
      sort: entity.sort || 1,
      groupId: entity.groupId,
      startTime: startTime,
      endTime: endTime,
      scale: entity.scale,
      position: entity.position,
      show: Boolean(entity.show),
      references: entity.url,
    };
  }

  /** 获取 音频 列表 */
  getVideoToList() {
    const result = [];
    for (let [, value] of this.videoMap) {
      result.push(this.getVideoToJson(value));
    }
    return result;
  }

  /** 变速回调函数 */
  _speedChangeCallback(speed) {
    for (let [, value] of this.videoMap) {
      const html = value.html;
      html.playbackRate = speed;
    }
  }

  /** 生成视频标签组 */
  _createVideoGroupContainer(cesiumContainer) {
    const dom = document.createElement("div");
    dom.style.zIndex = "-2";
    dom.className = "cesium-helper-video-wrapper";

    /** 创建样式 */
    const style = document.createElement("style");
    style.innerHTML =
      ".cesium-helper-video{\n" +
      "position: fixed;\n" +
      "z-index: 2;\n" +
      "border: 2px solid #FFFFFF;\n" +
      "border-radius: 5px;\n" +
      "}\n" +
      ".cesium-helper-video:hover{\n" +
      "cursor: pointer;\n" +
      "}";
    cesiumContainer.appendChild(style);
    cesiumContainer.appendChild(dom);
    return dom;
  }

  /** 创建视频标签 */
  _createVideoContainer(options) {
    const dom = document.createElement("video");
    dom.className = "cesium-helper-video";
    dom.setAttribute("data-id", options.id);
    dom.src = options.references;
    dom.autoplay = false;
    dom.preload = "auto";
    dom.playbackRate = this.supper.player.speed;
    this.videoGroupContainer.appendChild(dom);
    return new Promise((resolve) => {
      dom.addEventListener("loadeddata", () => resolve(dom));
    });
  }

  /** 更新视频状态 */
  updateVideoState(currentTime) {
    currentTime = new Date(currentTime.replace("T", " ").replace("Z", ""));
    for (const [key, value] of this.videoMap) {
      const times = value.availability.split("/");
      const startTime = new Date(times[0].replace("T", " ").replace("Z", ""));
      const endTime = new Date(times[1].replace("T", " ").replace("Z", ""));
      const frameTran =
        currentTime &&
        this.lastFrameTime &&
        currentTime?.getTime() === this.lastFrameTime?.getTime();
      if (currentTime >= startTime && currentTime < endTime && frameTran) {
        // 检查该视频在不在激活视频中 如果在就直接跳过
        if (this.activateElements.get(key)) continue;
        // 不在就将其添加到激活视频中
        this.activateElements.set(key, true);
        value.html.style.display = "block";
        value.html.currentTime =
          Math.abs(currentTime.getTime() - startTime.getTime()) / 1000;
        this.isPlay && value.html.play();
      } else {
        this.activateElements.delete(key);
        value.html.pause();
        value.html.style.display = "none";
      }
    }
    this.lastFrameTime = currentTime;
  }

  /** 播放视频 */
  playVideo() {
    this.isPlay = true;
    for (const [key] of this.activateElements) {
      const video = this.videoMap.get(key);
      video?.html.paused && video.html.play();
    }
  }

  /** 暂停视频 */
  pauseVideo() {
    this.isPlay = false;
    for (const [key] of this.activateElements) {
      this.videoMap.get(key)?.html.pause();
    }
  }

  /**
   * 获取默认名称
   * */
  _getDefaultName() {
    return "视频" + ("000" + Object.keys(this.videoMap).length + 1).substr(-3);
  }
}

export default Video;
