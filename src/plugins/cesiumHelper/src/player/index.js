const Cesium = window.Cesium;

/**
 * 自定义播放器
 * */
export default class Player {
  clock = null;

  viewer = null;

  isPlaying = null;

  speed = null;

  callbacks = null;

  /** 构造函数 */
  constructor(viewer, clockOptions) {
    this.viewer = viewer;
    this.clock = viewer.clock;
    this.isPlaying = false;

    this.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER; // 时间变化取决于时钟
    this.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

    const { startTime, endTime, currentTime } = clockOptions;
    this.initTimeRange(startTime, endTime, currentTime);

    this.speed = 1;
    this.callbacks = new Map([
      ["change", new Map()], // 时间变化回调列表
      ["stop", new Map()], // 时间停止回调列表
      ["play", new Map()], // 播放回调列表
      ["pause", new Map()], // 暂停回调列表
      ["speed_change", new Map()], // 时间变化回调列表
    ]);

    this.clock.onStop.addEventListener(this.pause.bind(this));
    this.clock.onStop.addEventListener(() => {
      const currentTime =
        Cesium.JulianDate.toIso8601(viewer.clock.currentTime)
          .substring(0, 23)
          .replace("Z", "") + "Z";
      Array.from(this.callbacks.get("stop").values()).forEach(
        (func) => func && func(currentTime)
      );
    });
    this.clock.onTick.addEventListener((clock) => {
      const currentTime =
        Cesium.JulianDate.toIso8601(clock.currentTime)
          .substring(0, 23)
          .replace("Z", "") + "Z";
      this.isPlaying &&
        Array.from(this.callbacks.get("change").values()).forEach(
          (func) => func && func(currentTime)
        );
    });
  }

  /**
   * 初始化系统时间
   *
   * @param {string} startTime 开始时间：iso8601格式字符
   * @param {string} endTime 结束时间：iso8601格式字符
   * @param {String} currentTime 当前时间：iso8601格式字符
   * */
  initTimeRange(startTime, endTime, currentTime) {
    this.clock.startTime = Cesium.JulianDate.fromIso8601(startTime);
    this.clock.stopTime = Cesium.JulianDate.fromIso8601(endTime);
    this.clock.currentTime = Cesium.JulianDate.fromIso8601(currentTime);
  }

  /** 播放 */
  play() {
    this.isPlaying = true;
    Array.from(this.callbacks.get("play").values()).forEach((item) => item());
    this.viewer.clock.shouldAnimate = true;
  }

  /** 暂停 */
  pause() {
    this.isPlaying = false;
    this.viewer.clock.shouldAnimate = false;
    Array.from(this.callbacks.get("pause").values()).forEach((item) => item());
  }

  /** 设置播放速度 */
  setSpeed(speed) {
    if (speed !== this.speed)
      Array.from(this.callbacks.get("speed_change").values()).forEach((item) =>
        item(speed)
      );
    this.speed = speed;
    this.clock.multiplier = speed;
  }

  /** 修改系统当前事件 */
  updateTime(time) {
    this.viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(time);
    Array.from(this.callbacks.get("change").values()).forEach(
      (func) => func && func(time)
    );
  }

  /** 添加时间监听 */
  addEventListener(type, name, func) {
    if (type === "change") {
      this.callbacks.get("change").set(name, func);
    } else if (type === "stop") {
      this.callbacks.get("stop").set(name, func);
    } else if (type === "play") {
      this.callbacks.get("play").set(name, func);
    } else if (type === "pause") {
      this.callbacks.get("pause").set(name, func);
    } else if (type === "speed_change") {
      this.callbacks.get("speed_change").set(name, func);
    }
  }

  /** 移除监听事件 */
  removeEventListener(type, name) {
    if (type === "change") {
      this.callbacks.get("change").delete(name);
    } else if (type === "stop") {
      this.callbacks.get("stop").delete(name);
    } else if (type === "play") {
      this.callbacks.get("play").delete(name);
    } else if (type === "pause") {
      this.callbacks.get("pause").delete(name);
    } else if (type === "speed_change") {
      this.callbacks.get("speed_change").delete(name);
    }
  }
}
