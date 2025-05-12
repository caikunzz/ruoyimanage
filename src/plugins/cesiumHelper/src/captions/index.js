import * as uuid from "../common/uuid"
import * as DateUtils from "../common/dateUtils";
import {julianDateToIso8602Times} from "../common/dateUtils";


/**
 * 字幕工具类
 *
 * 包含字幕编辑设置等相关方法
 * @author：tzx
 * @date：2023/08/22
 * */
class Captions {

  /** 字母字典 */
  captionsMap = null

  /** 文字展示栏 Dom */
  textContainer = null

  /** 音频集合 */
  audioGroupContainer = null

  /** 视图 */
  viewer = null

  /** 当前字幕展示 */
  activateElements = null

  /** 系统播放状态 */
  isPlay = false

  /** 父类 */
  supper = null

  /** 上一帧时间 */
  lastFrameTime = null

  /** 构造方法 */
  constructor(viewer, cesiumContainer, supper) {
    /** 初始化变量 */
    this.viewer = viewer

    this.captionsMap = new Map()
    this.activateElements = new Map()

    this.supper = supper

    /** 创建 并将文字标签加入到容器中 */
    this._createCaptionsDiv(cesiumContainer)
    /** 创建 音频集合 */
    this._createAudioGroupContainer(cesiumContainer)
    /** 设置 系统时间回调 */
    supper.player.addEventListener("play", "playCaption", this.playCaption.bind(this))
    supper.player.addEventListener("pause", "pauseCaption", this.pauseCaption.bind(this))
    supper.player.addEventListener("change", "updateCaptions", this.updateCaptions.bind(this))
    supper.player.addEventListener("speed_change", "speed_change_caption_callback", this._speedChangeCallback.bind(this))
  }

  /**
   * @description: 添加字幕
   *
   * 该方法用于创建并添加一个新的字幕实体，字幕包括文本标签和可选的音频文件。它通过提供的选项配置字幕的相关信息，生成字幕实体，并将其添加到 `captionsMap` 和 `viewer.resource` 中。
   *
   * 1. 如果未指定字幕的 ID，会自动生成一个唯一的 ID。
   * 2. 通过音频引用生成音频容器并将音频关联到字幕。
   * 3. 更新当前字幕的时间。
   *
   * @method addCaptions
   * @param {Object} options 字幕配置选项，包含以下字段：
   *  - id: 字幕 ID（可选）
   *  - label: 字幕显示文本
   *  - data: 其他附加数据
   *  - sort: 字幕排序顺序（可选，默认值为 1）
   *  - references: 音频文件的引用 URL（可选）
   *  - availability: 字幕可用的时间范围（可选，默认值为当前时间）
   *
   * @returns {Promise} 返回一个 Promise 对象，成功时返回创建的字幕实体，失败时返回音频加载错误信息。
   *
   * @example
   * // 创建一个字幕并添加
   * this.addCaptions({
   *   id: "caption1",
   *   label: "Hello World!",
   *   references: ["audio_url.mp3"]
   * }).then(entity => {
   *   console.log("字幕添加成功", entity);
   * }).catch(error => {
   *   console.error("字幕添加失败", error);
   * });
   */

  /** 添加字幕 */
  addCaptions(options) {
    return new Promise((resolve, reject) => {
      const entity = JSON.parse(JSON.stringify(options))
      entity.id = options.id || uuid.uuid()
      entity.type = "captions"
      entity.groupId = this.viewer.root.id
      entity.name = options.label
      entity.data = options.data
      entity.sort = options.sort || 1
      entity.label = options.label
      entity.availability = options.availability || julianDateToIso8602Times(this.viewer.clock.currentTime)
      this._createAudioContainer(options.references)
        .then(audio => {
          entity.audio = audio
          entity.references = options.references
          this.captionsMap.set(entity.id, entity)
          this.viewer.resource.set(entity.id, this.getCaptionToJson(entity))
          const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime)
          this.updateCaptions(time, false)
          resolve(entity)
        }).catch(audio => {
        reject("【音频加载错误】：url->" + audio + ", entity->" + entity.name)
      })
    })
  }

  /**
   * @description: 加载字幕
   *
   * 该方法用于加载一个字幕实体，字幕包括文本标签和音频文件的引用。它通过提供的选项配置字幕的相关信息，加载音频并将字幕实体添加到 `captionsMap` 和 `viewer.resource` 中。
   *
   * 1. 根据传入的 `options` 设置字幕的 ID、标签、音频引用等属性。
   * 2. 调用 `_createAudioContainer` 方法加载音频并关联到字幕。
   * 3. 字幕加载成功后，更新字幕显示的时间。
   *
   * @method loadCaptions
   * @param {Object} options 字幕配置选项，包含以下字段：
   *  - id: 字幕 ID
   *  - name: 字幕名称
   *  - label: 字幕显示文本
   *  - sort: 字幕排序顺序（可选）
   *  - references: 音频文件的引用 URL（可选）
   *  - groupId: 字幕的组 ID
   *  - data: 其他附加数据
   *
   * @returns {Promise} 返回一个 Promise 对象，成功时返回创建的字幕实体，失败时返回音频加载错误信息。
   *
   * @example
   * // 加载一个字幕并处理
   * this.loadCaptions({
   *   id: "caption1",
   *   name: "Caption Name",
   *   label: "Hello World!",
   *   references: ["audio_url.mp3"]
   * }).then(entity => {
   *   console.log("字幕加载成功", entity);
   * }).catch(error => {
   *   console.error("字幕加载失败", error);
   * });
   */

  /** 加载字幕 */
  async loadCaptions(options) {
    return new Promise((resolve, reject) => {
      const entity = JSON.parse(JSON.stringify(options))
      entity.id = options.id
      entity.type = "captions"
      entity.groupId = options.groupId
      entity.data = options.data
      entity.sort = options.sort
      entity.name = options.name
      entity.label = options.label
      entity.references = options.references
      this._createAudioContainer(options.references)
        .then(audio => {
          entity.audio = audio
          this.captionsMap.set(entity.id, entity)
          this.viewer.resource.set(entity.id, this.getCaptionToJson(entity))
          const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime)
          this.updateCaptions(time)
          resolve(entity)
        }).catch(audio => {
        reject("【音频加载错误】：url->" + audio + ", entity->" + entity.name)
      })
    })
  }

  /**
   * @description: 编辑字幕
   *
   * 该方法用于编辑现有字幕实体的属性。通过提供字幕 ID 和新的选项，它可以更新字幕的名称、标签、音频文件、排序顺序等。
   *
   * 1. 根据字幕 ID 从 `captionsMap` 中获取对应的字幕实体。
   * 2. 根据提供的选项 `options`，逐一更新字幕的属性。
   * 3. 更新字幕的音频文件引用（如果提供了新的音频 URL）。
   * 4. 更新字幕的资源数据，并刷新显示的字幕。
   *
   * @method editCaptions
   * @param {string} id 字幕的 ID
   * @param {Object} options 要更新的字幕选项，可能包括以下字段：
   *  - name: 字幕的名称
   *  - label: 字幕显示文本
   *  - data: 其他附加数据
   *  - sort: 字幕排序顺序
   *  - groupId: 字幕的组 ID
   *  - availability: 字幕可用时间
   *  - references: 新的音频文件 URL
   *
   * @example
   * // 编辑一个已存在的字幕
   * this.editCaptions("caption1", {
   *   name: "Updated Caption Name",
   *   label: "Updated Label",
   *   references: ["new_audio_url.mp3"]
   * });
   */

  /** 编辑字幕 */
  editCaptions(id, options) {
    const entity = this.captionsMap.get(id)
    "name" in options && (entity.name = options.name)
    "label" in options && (entity.label = options.label)
    "data" in options && (entity.data = options.data)
    "sort" in options && (entity.sort = options.sort)
    "groupId" in options && (entity.groupId = options.groupId)
    "availability" in options && (entity.availability = options.availability)
    if ("references" in options) {
      entity.references = options.references
      entity.audio.src = options.references
    }
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime)
    this.viewer.resource.set(id, this.getCaptionToJson(entity))
    this.updateCaptions(time)
  }

  /**
   * @description: 移除字幕
   *
   * 该方法用于根据字幕的 ID 移除对应的字幕实体及其相关的音频资源。
   *
   * 1. 根据提供的字幕 ID，从 `captionsMap` 中查找并获取对应的字幕实体。
   * 2. 如果字幕包含音频文件，调用 `audio.remove()` 方法删除音频资源。
   * 3. 从 `captionsMap` 中删除该字幕实体，并从 `viewer.resource` 中删除其对应的资源。
   * 4. 更新当前字幕的显示状态，确保字幕列表的同步更新。
   *
   * @method removeById
   * @param {string} id 字幕的 ID
   *
   * @example
   * // 移除一个已存在的字幕
   * this.removeById("caption1");
   */

  /** 移除字幕 */
  removeById(id) {
    const entity = this.captionsMap.get(id)
    entity.audio?.remove()
    this.captionsMap.delete(id)
    this.viewer.resource.delete(id)
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime)
    this.updateCaptions(time)
  }

  /**
   * @description: 移除所有字幕
   *
   * 该方法用于移除系统中的所有字幕实体及其相关的音频资源，并清空字幕映射。
   *
   * 1. 遍历 `captionsMap` 中的所有字幕实体。
   * 2. 对于每个字幕实体，检查是否包含音频资源，并调用 `audio.remove()` 方法删除音频文件。
   * 3. 从 `viewer.resource` 中删除字幕资源。
   * 4. 清空 `captionsMap` 中的所有字幕记录。
   * 5. 更新字幕显示状态，确保字幕列表被清空并同步更新。
   *
   * @method removeAll
   *
   * @example
   * // 移除系统中所有字幕
   * this.removeAll();
   */

  /** 移除所有字幕 */
  removeAll() {
    for (const [key,] of this.captionsMap) {
      const entity = this.captionsMap.get(key)
      entity.audio?.remove()
      this.viewer.resource.delete(key)
    }
    this.captionsMap.clear()
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime)
    this.updateCaptions(time)
  }

  /**
   * @description: 根据 id 获取字幕
   *
   * 该方法根据字幕的唯一标识符 `id` 从 `captionsMap` 中获取对应的字幕实体。
   *
   * @param {string} id - 字幕的唯一标识符。
   *
   * @returns {Object|null} - 返回对应 `id` 的字幕实体，如果不存在该字幕则返回 `null`。
   *
   * @example
   * // 根据字幕的 ID 获取字幕实体
   * const caption = this.getCaptionById('12345');
   */

  /** 根据 id 获取字幕 */
  getCaptionById(id) {
    return this.captionsMap.get(id)
  }

  /**
   * @description: 获取字幕的 JSON 表示
   *
   * 该方法将字幕实体对象 `entity` 转换为 JSON 格式的数据。
   *
   * @param {Object} entity - 字幕实体对象，包含字幕的各类信息，如 ID、名称、可见性、时间段等。
   *
   * @returns {Object} - 返回字幕实体的 JSON 数据，包含字幕的各个属性，如 ID、名称、排序、时间范围等。
   *
   * @example
   * // 获取字幕实体的 JSON 数据
   * const captionJson = this.getCaptionToJson(captionEntity);
   */

  /** 获取 字幕 Json */
  getCaptionToJson(entity) {
    const startTime = entity.availability.split("/")[0].replace("T", " ").replace("Z", "")
    const endTime = entity.availability.split("/")[1].replace("T", " ").replace("Z", "")
    return {
      id: entity.id,
      name: entity.name,
      label: entity.label,
      data: entity.data || null,
      sort: entity.sort || 1,
      groupId: entity.groupId,
      type: "captions",
      startTime: startTime,
      endTime: endTime,
      show: entity.show,
      references: entity.references
    }
  }

  /**
   * @description: 获取字幕列表的 JSON 数据
   *
   * 该方法遍历所有的字幕实体，将它们转换为 JSON 格式的数据，并返回字幕列表。
   *
   * @returns {Array} - 返回一个包含所有字幕的 JSON 对象数组，每个字幕对象都包含字幕的各项信息。
   *
   * @example
   * // 获取所有字幕的 JSON 数据列表
   * const captionList = this.getCaptionToList();
   */

  /** 获取 字幕 列表 */
  getCaptionToList() {
    const result = []
    for (let [, value] of this.captionsMap) {
      result.push(this.getCaptionToJson(value))
    }
    return result
  }

  /**
   * @description: 更新字幕内容
   *
   * 根据当前时间，检查并更新正在播放的字幕内容。
   * 该方法会遍历所有字幕实体，如果字幕的显示时间段包含当前时间，则播放对应的音频，并更新字幕文本。
   * 如果字幕不在当前时间范围内，则暂停该字幕对应的音频。
   *
   * @param {string} currentTime - 当前系统时间（ISO 8601 格式的时间字符串）
   *
   * @returns {void}
   *
   * @example
   * // 更新字幕内容
   * this.updateCaptions("2024-12-24T12:00:00Z");
   */

  /** 更新字幕内容 */
  updateCaptions(currentTime) {
    currentTime = new Date(currentTime.replace("T", " ").replace("Z", ""))
    for (const [key, value] of this.captionsMap) {
      const times = value.availability.split("/")
      const startTime = new Date(times[0].replace("T", " ").replace("Z", ""))
      const endTime = new Date(times[1].replace("T", " ").replace("Z", ""))
      const frameTran = currentTime && this.lastFrameTime && currentTime?.getTime() !== this.lastFrameTime?.getTime()
      if (currentTime >= startTime && currentTime < endTime && frameTran){
        if (this.activateElements.get(key)) continue;
        this.textContainer.innerHTML = value.label
        this.activateElements.set(key, true)
        value.audio.currentTime = Math.abs(currentTime.getTime() - startTime.getTime()) / 1000
        this.isPlay && value.audio.play()
        if (this.activateElements.size > 0) this.textContainer.style.display = "block"
      } else {
        this.activateElements.delete(key)
        value.audio.pause()
      }
    }
    /* 如果没有符合的字幕  就把字幕隐藏 */
    if (this.captionsMap.size === 0 || this.activateElements.size === 0) {
      this.show = {}
      this.textContainer.style.display = "none"
    }
    this.lastFrameTime = currentTime
  }

  /**
   * @description: 播放字幕
   *
   * 启动字幕播放。遍历所有正在显示的字幕（即已激活的字幕），播放对应的音频。
   * 该方法会将 `isPlay` 标记为 `true`，并确保所有未播放的字幕音频开始播放。
   *
   * @returns {void}
   *
   * @example
   * // 播放所有正在显示的字幕音频
   * this.playCaption();
   */

  /** 播放字幕 */
  playCaption() {
    this.isPlay = true
    for (const [key,] of this.activateElements) {
      const caption = this.captionsMap.get(key)
      caption?.audio?.paused && caption.audio?.play()
    }
  }

  /**
   * @description: 暂停字幕
   *
   * 暂停所有正在播放的字幕音频。遍历所有正在显示的字幕（即已激活的字幕），并暂停其对应的音频。
   * 该方法会将 `isPlay` 标记为 `false`，表示字幕播放已暂停。
   *
   * @returns {void}
   *
   * @example
   * // 暂停所有正在显示的字幕音频
   * this.pauseCaption();
   */

  /** 暂停字幕 */
  pauseCaption() {
    this.isPlay = false
    for (const [key,] of this.activateElements) {
      this.captionsMap.get(key)?.audio?.pause()
    }
  }

  /**
   * @description: 变速回调函数
   *
   * 用于调整所有字幕音频的播放速度。该方法会遍历所有字幕实体，并根据传入的速度值更新每个字幕的音频播放速度。
   *
   * @param {number} speed - 播放速度因子。1表示正常速度，值大于1表示加速，值小于1表示减速。
   *
   * @returns {void}
   *
   * @example
   * // 调整字幕音频播放速度为2倍速
   * this._speedChangeCallback(2);
   */

  /** 变速回调函数 */
  _speedChangeCallback(speed) {
    for (let [, value] of this.captionsMap) {
      const audio = value.audio
      audio.playbackRate = speed
    }
  }

  /**
   * @description: 创建文字标签
   *
   * 该方法创建一个用于显示字幕的 HTML 元素，并将其添加到指定的 Cesium 容器中。字幕将使用固定的位置样式显示在屏幕底部，居中显示。
   *
   * @param {HTMLElement} cesiumContainer - Cesium 的容器元素，用于将字幕 DOM 添加到其中。
   *
   * @returns {void}
   *
   * @example
   * // 创建并将字幕标签添加到 Cesium 容器中
   * this._createCaptionsDiv(cesiumContainer);
   */

  /** 创建文字标签 */
  _createCaptionsDiv(cesiumContainer) {
    /** 创建 Dom */
    const dom = document.createElement("div")
    /** 设置 Dom id */
    dom.id = "cesium-helper-caption"
    /** 创建样式 */
    const style = document.createElement("style")
    /** 设置样式 */
    style.innerHTML = "#cesium-helper-caption{\n" +
      "  width:90%;\n" +
      "  font-size: 30px;\n" +
      "  letter-spacing: .05em;\n" +
      "\n" +
      "  color: #FCF9FB;\n" +
      "  text-shadow: 0 1px #000000, 1px 0 #000000, -1px 0 #000000, 0 -1px #000000;\n" +
      "\n" +
      "  position: fixed;\n" +
      "  bottom: 60px;\n" +
      "  left: 50%;\n" +
      "  transform: translateX(-50%);\n" +
      "\n" +
      "  text-align: center;\n" +
      "}"
    this.textContainer = dom
    cesiumContainer.appendChild(style)
    cesiumContainer.appendChild(dom)
  }

  /**
   * @description: 生成音频标签组
   *
   * 该方法创建一个用于容纳音频元素的 `div` 容器，并将其添加到指定的 Cesium 容器中。音频元素会被包裹在这个容器中，且容器初始状态为隐藏。
   *
   * @param {HTMLElement} cesiumContainer - Cesium 的容器元素，用于将音频容器 DOM 添加到其中。
   *
   * @returns {HTMLElement} - 返回创建的音频容器 DOM 元素。
   *
   * @example
   * // 创建音频标签组容器并将其添加到 Cesium 容器中
   * const audioGroup = this._createAudioGroupContainer(cesiumContainer);
   */

  /** 生成音频标签组 */
  _createAudioGroupContainer(cesiumContainer) {
    const dom = document.createElement("div")
    dom.style.display = "none"
    dom.className = "cesium-helper-captions-audio-wrapper"
    cesiumContainer.appendChild(dom)
    this.audioGroupContainer = dom
    return dom
  }

  /**
   * @description: 创建音频标签
   *
   * 该方法根据给定的音频 URL 创建一个 `audio` 标签，并设置相关的属性以确保音频能够正确加载和播放。音频标签会被添加到之前创建的音频容器中。
   *
   * @param {string} url - 音频文件的 URL 地址。
   *
   * @returns {Promise} - 返回一个 Promise，成功时解析音频标签 DOM 元素，失败时拒绝音频文件 URL。
   *
   * @example
   * // 创建音频标签并返回 Promise，当音频标签加载完成时调用 resolve
   * this._createAudioContainer(url).then(audioElement => {
   *     // 在音频加载完成后执行的逻辑
   * }).catch(error => {
   *     // 处理加载失败的错误
   * });
   */

  /** 创建音频标签 */
  _createAudioContainer(url) {
    const dom = document.createElement("audio")
    dom.src = url
    dom.autoplay = false
    dom.preload = "auto"
    dom.playbackRate = this.supper.player.speed
    this.audioGroupContainer.appendChild(dom)
    return new Promise((resolve, reject) => {
      dom.addEventListener("loadedmetadata", () => resolve(dom))
      dom.onerror = () => reject(url)
    })
  }

}

export default Captions
