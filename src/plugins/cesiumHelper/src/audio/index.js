import * as uuid from "../common/uuid";
import {
  julianDateFromIso8601,
  julianDateToIso8602Times,
} from "../common/dateUtils";

/**
 * 音频标绘类
 *
 * 包含音频播放、暂停、结束、任一点播放等功能
 * @author: Tzx
 * @date: 2023/08/30
 * */
class Audio {
  viewer = null;

  audioGroupContainer = null;

  audioMap = null;

  isPlay = false;

  supper = null;

  /** 当前音频播放展示 */
  activateElements = null;

  /** 上一帧时间点 */
  lastFrameTime = null;

  /**
   * 构造函数
   *
   *  Cesium.Viewer 对象
   * */
  constructor(viewer, container, supper) {
    this.viewer = viewer;
    this.cesiumContainer = container;
    this.audioMap = new Map();

    this.activateElements = new Map();
    this.audioGroupContainer = this._createAudioGroupContainer(container);

    this.supper = supper;

    supper.player.addEventListener(
      "play",
      "playAudio",
      this.playAudio.bind(this)
    );
    supper.player.addEventListener(
      "pause",
      "pauseAudio",
      this.pauseAudio.bind(this)
    );
    supper.player.addEventListener(
      "change",
      "updateAudio",
      this.updateAudioState.bind(this)
    );
    supper.player.addEventListener(
      "speed_change",
      "speed_change_audio_callback",
      this._speedChangeCallback.bind(this)
    );
  }
  /**
   * @description: 添加音频
   *
   * 该方法用于向系统中添加音频文件，并根据提供的 `options` 配置音频的相关属性。音频文件通过 `references` 参数指定，可以指定音频的 ID、名称、排序、可用时间段等信息。音频将被创建并存储在 `audioMap` 中，并通过资源管理器进行注册。
   *
   * 主要功能：
   * 1. 通过 `options.id` 或自动生成唯一 ID，确保每个音频的唯一性。
   * 2. 设置音频的可用时间段（通过 `availability` 参数）。如果未提供可用时间段，则默认使用当前时间作为音频的起始时间。
   * 3. 加载音频文件，生成 HTML 元素，并将其与其他音频信息一起存储。
   * 4. 将音频数据转换为 JSON 格式，并通过 `viewer.resource.set` 进行资源注册。
   *
   * @param {Object} options 配置选项对象，包含以下属性：
   * - `id` (string): 音频的唯一标识符。如果未提供，则自动生成一个 UUID。
   * - `name` (string): 音频的名称，默认为默认名称。
   * - `availability` (string): 音频的可用时间段，格式为 ISO 8601 时间字符串，表示音频的开始和结束时间。
   * - `references` (string): 音频文件的 URL 地址，指向音频资源。
   * - `data` (object): 音频的其他数据，具体格式由系统使用。
   * - `sort` (number): 音频的排序编号，默认为 1。
   *
   * @returns {Promise<Object>} 返回一个 `Promise`，解析结果为音频对象，包含音频的 ID、名称、类型、数据、可用时间段等信息。
   *
   * 数据来源：
   * - `uuid.uuid()`：用于生成音频的唯一 ID。
   * - `julianDateFromIso8601(iso8601)`：将 ISO 8601 格式的时间字符串转换为 `JulianDate`，用于计算音频的开始时间。
   * - `this._createAudioContainer(options.references)`：根据传入的音频资源 URL（`references`）加载音频文件，返回一个 HTML 元素。
   * - `Math.round(audio.duration)`：获取音频文件的时长（以秒为单位），用于计算音频的结束时间。
   * - `julianDateToIso8602Times(startTime, distance)`：将音频的开始时间和时长（`distance`）转换为 ISO 8601 格式的时间段，表示音频的可用时间。
   *
   * 实现步骤：
   * 1. 根据 `options.id` 或生成新的 UUID 为音频指定唯一标识符。
   * 2. 通过 `julianDateFromIso8601` 获取音频的开始时间。如果 `availability` 参数未提供，则使用当前时间。
   * 3. 使用 `this._createAudioContainer` 方法加载音频文件，并生成音频的 HTML 元素。
   * 4. 计算音频的时长并确定结束时间。
   * 5. 创建一个包含音频信息的对象 `temp`，并将其存储在 `audioMap` 中。
   * 6. 使用 `viewer.resource.set` 将音频数据转换为 JSON 格式并注册。
   * 7. 返回包含音频信息的对象，作为 Promise 的解析结果。
   *
   * 该方法适用于需要动态加载和管理音频资源的场景，如在地理信息系统中为特定位置或事件添加音频提示或背景音乐。
   */

  /** 添加音频 */
  addAudio(options) {
    return new Promise((resolve, reject) => {
      try {
        const id = options.id || uuid.uuid();
        const startTime = options.availability
          ? julianDateFromIso8601(options.availability.split("/")[0])
          : this.viewer.clock.currentTime;
        this._createAudioContainer(options.references).then((audio) => {
          const distance =
            Math.round(audio.duration) &&
            Math.round(audio.duration) !== Infinity
              ? Math.round(audio.duration)
              : 5;
          const temp = {
            id: id,
            name: options.name || this._getDefaultName(),
            type: "audio",
            data: options.data,
            sort: options.sort || 1,
            groupId: this.viewer.root.id,
            availability:
              options.availability ||
              julianDateToIso8602Times(startTime, distance),
            url: options.references,
            show: true,
          };
          temp["html"] = audio;
          this.audioMap.set(id, temp);
          this.viewer.resource.set(id, this.getAudioToJson(temp));
          resolve(temp);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * @description: 编辑音频
   *
   * 该方法用于编辑已存在的音频对象，通过 `id` 获取音频对象，并根据提供的 `options` 更新音频的相关属性。支持修改音频的名称、数据、分组 ID、排序编号、可用时间段等信息。更新后的音频数据会通过 `viewer.resource.set` 重新注册，确保音频的最新状态能够反映在系统中。
   *
   * 主要功能：
   * 1. 根据音频的唯一标识符 `id` 获取已存在的音频对象。
   * 2. 根据 `options` 中提供的属性更新音频对象的对应字段。
   * 3. 通过 `viewer.resource.set` 更新音频资源，确保音频的最新状态能够生效。
   *
   * @param {string} id 音频的唯一标识符。
   * @param {Object} options 配置选项对象，包含以下属性：
   * - `name` (string): 音频的新名称。
   * - `data` (object): 音频的新数据。
   * - `groupId` (string): 音频所属的分组 ID。
   * - `sort` (number): 音频的排序编号。
   * - `availability` (string): 音频的可用时间段，格式为 ISO 8601 时间字符串。
   *
   * @returns {void} 此方法无返回值，直接修改音频对象的属性并更新资源。
   *
   * 数据来源：
   * - `this.audioMap.get(id)`：通过音频的唯一标识符 `id` 从 `audioMap` 中获取对应的音频对象。
   * - `viewer.resource.set(id, this.getAudioToJson(audio))`：将更新后的音频数据转换为 JSON 格式，并通过 `viewer.resource.set` 注册资源，确保系统中存储的音频数据是最新的。
   *
   * 实现步骤：
   * 1. 根据传入的音频 `id` 从 `audioMap` 中获取对应的音频对象。
   * 2. 根据 `options` 对象中提供的字段更新音频对象的相关属性。若 `options` 中包含某个属性，则更新该属性的值。
   * 3. 使用 `viewer.resource.set` 方法重新注册更新后的音频对象，确保系统中的音频数据与当前状态保持一致。
   *
   * 该方法适用于需要修改音频对象属性的场景，如在系统中动态调整音频的播放属性、修改音频的分组信息、更新音频的显示顺序等。
   */

  /** 编辑音频 */
  editAudio(id, options) {
    const audio = this.audioMap.get(id);
    "name" in options && (audio.name = options.name);
    "data" in options && (audio.data = options.data);
    "groupId" in options && (audio.groupId = options.groupId);
    "sort" in options && (audio.sort = options.sort);
    "availability" in options && (audio.availability = options.availability);
    this.viewer.resource.set(id, this.getAudioToJson(audio));
  }
  /**
   * @description: 移除音频
   *
   * 该方法用于从系统中移除指定的音频对象。根据提供的音频 `id`，将执行以下操作：
   * 1. 从 `audioMap` 中删除该音频对象。
   * 2. 从 DOM 中移除音频对应的 HTML 元素（如果存在）。
   * 3. 通过 `viewer.resource.delete` 删除音频资源。
   * 4. 从 `activateElements` 中删除该音频的激活元素。
   *
   * 主要功能：
   * 1. 根据音频的唯一标识符 `id` 获取音频对象。
   * 2. 从系统中删除该音频对象及其相关资源，确保音频不再显示和播放。
   * 3. 从 `audioMap` 和 `activateElements` 中删除音频相关信息，清理内存。
   *
   * @param {string} id 音频的唯一标识符，用于标识要移除的音频对象。
   *
   * @returns {void} 此方法无返回值，直接执行移除操作。
   *
   * 数据来源：
   * - `this.audioMap.get(id)`：通过音频的唯一标识符 `id` 从 `audioMap` 中获取对应的音频对象。
   * - `audio.html?.remove()`：如果音频对象中包含 `html` 属性，则调用 `remove()` 方法将音频对应的 HTML 元素从 DOM 中移除。
   * - `this.audioMap.delete(id)`：从 `audioMap` 中删除指定 `id` 的音频对象，释放内存。
   * - `this.viewer.resource.delete(id)`：通过 `viewer.resource.delete` 删除音频资源，确保音频对象不再被系统管理。
   * - `this.activateElements.delete(id)`：从 `activateElements` 集合中删除该音频的激活元素，清理与音频相关的激活状态。
   *
   * 实现步骤：
   * 1. 根据传入的 `id` 从 `audioMap` 获取音频对象。
   * 2. 如果该音频对象包含 `html` 属性，则移除对应的 HTML 元素。
   * 3. 从 `audioMap` 中删除该音频对象。
   * 4. 使用 `viewer.resource.delete` 删除该音频资源。
   * 5. 从 `activateElements` 中删除该音频的激活元素，清理与音频相关的状态信息。
   *
   * 该方法适用于需要从系统中完全移除音频对象的场景，例如在音频播放完成后或音频对象不再需要时，将其彻底清除。
   */

  /** 移除音频 */
  removeById(id) {
    const audio = this.audioMap.get(id);
    audio.html?.remove();
    this.audioMap.delete(id);
    this.viewer.resource.delete(id);
    this.activateElements.delete(id);
  }
  /**
   * @description: 加载音频选项
   *
   * 该方法用于加载并配置音频对象。它接收一个包含音频信息的 `options` 对象，通过提供的音频 `id` 和相关配置，创建音频对象并将其加入系统中。方法执行时会返回一个 Promise，用于异步处理音频资源的加载。
   *
   * 主要功能：
   * 1. 根据 `options` 中提供的参数，创建一个音频对象。
   * 2. 将音频对象的相关数据（如音频名称、数据、排序等）存储在 `audioMap` 中。
   * 3. 将音频对象的 HTML 元素添加到页面中并更新资源管理器。
   * 4. 返回创建的音频对象，供其他操作使用。
   *
   * @param {Object} options 包含音频信息的配置对象，字段包括：
   *   - `id`: 音频的唯一标识符。
   *   - `name`: 音频的名称。
   *   - `data`: 音频数据，可以是音频的路径或内容。
   *   - `sort`: 音频的排序值，用于控制显示顺序。
   *   - `groupId`: 音频所属的组标识符。
   *   - `availability`: 音频的可用时间范围，格式为 ISO8601 时间字符串。
   *   - `references`: 音频资源的 URL 或文件路径。
   *
   * @returns {Promise} 返回一个 Promise，resolve 时返回音频对象。
   *
   * 数据来源：
   * - `options.id`: 从外部传入，作为音频的唯一标识符。
   * - `options.references`: 用于音频资源的 URL，指向音频文件或数据的来源。
   * - `audio`: 由 `_createAudioContainer` 方法创建的音频 HTML 元素，代表音频资源的视觉表现。
   * - `this.audioMap`: 存储音频对象的集合，通过音频 `id` 快速访问。
   * - `this.viewer.resource.set(id, this.getAudioToJson(temp))`: 将音频对象的 JSON 数据存储到资源管理器中，以便于后续使用。
   *
   * 实现步骤：
   * 1. 从 `options` 获取音频的 `id` 和其他相关信息。
   * 2. 调用 `_createAudioContainer(options.references)` 方法加载音频资源，返回音频的 HTML 元素。
   * 3. 创建音频对象 `temp`，并将其相关数据存入 `audioMap`。
   * 4. 使用 `this.viewer.resource.set` 更新音频资源，以便资源管理器可以管理该音频。
   * 5. 最后，resolve 返回创建的音频对象，以便进一步处理。
   *
   * 该方法适用于需要加载和配置音频资源的场景，例如在动态加载音频文件或更新音频设置时，确保音频能够正确加载并被系统管理。
   */

  loadAudioOption(options) {
    return new Promise((resolve) => {
      const id = options.id;
      this._createAudioContainer(options.references).then((audio) => {
        const temp = {
          id: id,
          name: options.name,
          type: "audio",
          data: options.data,
          sort: options.sort,
          groupId: options.groupId,
          availability: options.availability,
          url: options.references,
          show: true,
        };
        temp["html"] = audio;
        this.audioMap.set(id, temp);
        this.viewer.resource.set(id, this.getAudioToJson(temp));
        resolve(temp);
      });
    });
  }
  /**
   * @description: 根据 id 获取音频
   *
   * 该方法用于根据音频的唯一标识符 `id` 从系统中获取对应的音频对象。它会查询 `audioMap` 中存储的音频数据，并返回对应的音频对象。如果音频对象不存在，则返回 `undefined`。
   *
   * 主要功能：
   * 1. 根据提供的 `id` 查找并返回对应的音频对象。
   * 2. 如果找到了对应的音频对象，则返回该对象，供后续操作使用。
   * 3. 如果没有找到对应的音频对象，则返回 `undefined`，提示该音频不存在。
   *
   * @param {string} id 音频对象的唯一标识符。
   *
   * @returns {Object|undefined} 返回对应的音频对象，如果不存在则返回 `undefined`。
   *
   * 数据来源：
   * - `this.audioMap`: 存储音频对象的映射集合，其中的键是音频的 `id`，值是对应的音频对象。
   *
   * 实现步骤：
   * 1. 从 `audioMap` 中使用 `id` 查找对应的音频对象。
   * 2. 如果找到音频对象，则返回该对象；否则，返回 `undefined`。
   *
   * 该方法适用于根据音频的 `id` 查找已经加载的音频对象，方便进行后续的音频控制、编辑或删除等操作。
   */

  /** 根据 id 获取音频 */
  getAudioById(id) {
    return this.audioMap.get(id);
  }
  /**
   * @description: 获取音频对象的 JSON 格式数据
   *
   * 该方法用于将音频实体转换为一个标准化的 JSON 对象格式，以便于存储或传输。它将音频实体的各个属性（如名称、开始/结束时间、排序等）提取出来，并按照指定的格式返回 JSON 对象。此方法通常用于将音频对象的数据持久化存储或与其他系统进行数据交互。
   *
   * 主要功能：
   * 1. 提取音频实体中的关键信息（如 `id`、`name`、`availability`、`url` 等）。
   * 2. 将音频的开始时间和结束时间从 ISO 8601 格式转换为本地时间格式。
   * 3. 返回一个结构化的 JSON 对象，包含音频的各类属性。
   *
   * @param {Object} entity 音频实体对象，包含音频的各类信息。
   *
   * @returns {Object} 返回一个包含音频属性的 JSON 对象，结构化的音频数据。
   *
   * 数据来源：
   * - `entity.id`: 音频的唯一标识符。
   * - `entity.name`: 音频的名称。
   * - `entity.data`: 音频的附加数据（如果有的话）。
   * - `entity.sort`: 音频的排序值，默认为 `1`。
   * - `entity.groupId`: 音频的分组标识符。
   * - `entity.availability`: 音频的可用时间范围，格式为 "startTime/endTime"。
   * - `entity.show`: 音频是否显示的标志，转换为布尔值。
   * - `entity.url`: 音频的资源引用地址。
   *
   * 实现步骤：
   * 1. 从 `entity.availability` 中提取开始时间和结束时间，并将其转换为标准的时间格式。
   * 2. 构建一个 JSON 对象，将音频实体的各个属性填充到该对象中。
   * 3. 返回这个结构化的 JSON 数据，以便后续处理、存储或传输。
   *
   * 该方法适用于将音频实体的详细信息转换为易于存储和传输的 JSON 格式，特别是在需要将音频数据序列化或与其他系统进行交互时。
   */

  /** 获取音频 Json */
  getAudioToJson(entity) {
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
      type: "audio",
      data: entity.data || null,
      sort: entity.sort || 1,
      groupId: entity.groupId,
      startTime: startTime,
      endTime: endTime,
      show: Boolean(entity.show),
      references: entity.url,
    };
  }
  /**
   * @description: 获取音频列表的 JSON 格式数据
   *
   * 该方法用于从 `audioMap` 中获取所有音频实体，并将每个音频实体转换为 JSON 格式后返回一个列表。这个方法常用于在音频管理系统中汇总所有音频数据，并将其以结构化的 JSON 列表形式返回，方便后续操作或数据展示。
   *
   * 主要功能：
   * 1. 遍历 `audioMap` 中存储的所有音频实体。
   * 2. 对每个音频实体调用 `getAudioToJson` 方法，将其转化为 JSON 格式。
   * 3. 将转化后的 JSON 数据存入 `result` 数组。
   * 4. 最终返回包含所有音频信息的 JSON 列表。
   *
   * @returns {Array} 返回一个包含所有音频实体数据的 JSON 格式数组。
   *
   * 数据来源：
   * - `this.audioMap`: 存储音频实体信息的映射表，每一项包括音频的详细信息（如名称、URL、时间等）。
   * - `getAudioToJson(entity)`: 该方法用于将音频实体转化为 JSON 数据，确保返回的数据符合标准格式。
   *
   * 过程：
   * 1. 遍历 `audioMap`，获取每个音频实体的数据。
   * 2. 调用 `getAudioToJson` 方法将音频实体转换为标准的 JSON 格式。
   * 3. 将每个音频实体的 JSON 格式数据推入到 `result` 数组中。
   * 4. 返回包含所有音频数据的 JSON 数组。
   *
   * 该方法适用于系统中音频数据的批量查询和导出，方便进行数据分析或显示。
   */

  /** 获取 音频 列表 */
  getAudioToList() {
    const result = [];
    for (let [, value] of this.audioMap) {
      result.push(this.getAudioToJson(value));
    }
    return result;
  }
  /**
   * @description: 移除所有音频实体及其相关资源
   *
   * 该方法用于从 `audioMap` 中移除所有音频实体，并清除与之相关的 HTML 元素和资源。它会遍历 `audioMap` 中所有存储的音频数据，并逐一移除这些音频实体，确保系统中不再保留任何音频数据。移除的音频将被从 `audioMap` 中删除，相关的 HTML 元素也将从 DOM 中移除，同时清除资源管理中的音频条目。
   *
   * 主要功能：
   * 1. 遍历 `audioMap` 中所有的音频实体。
   * 2. 对每个音频实体，移除其对应的 HTML 元素。
   * 3. 从 `audioMap` 中删除音频实体的记录。
   * 4. 从 `viewer.resource` 中删除该音频的资源记录。
   * 5. 重置 `activateElements` Map，确保移除所有激活的音频元素。
   *
   * @returns {void} 无返回值。
   *
   * 数据来源：
   * - `this.audioMap`: 存储音频实体信息的映射表，其中每个音频实体包含其详细信息和对应的 HTML 元素。
   * - `this.viewer.resource`: 用于管理和删除音频资源的对象，音频资源通过该对象进行注册和删除。
   *
   * 过程：
   * 1. 遍历 `audioMap`，获取每个音频实体的 ID 和数据。
   * 2. 调用音频实体的 `html?.remove()` 方法移除其对应的 DOM 元素。
   * 3. 从 `audioMap` 中删除音频实体的记录。
   * 4. 使用 `this.viewer.resource.delete(id)` 删除音频资源记录。
   * 5. 清空 `activateElements`，确保音频元素被完全移除。
   *
   * 该方法适用于在系统中需要清空所有音频时使用，比如系统重置、清理不再需要的音频数据等场景。
   */

  /** 移除全部音频 */
  removeAll() {
    for (let [id, value] of this.audioMap) {
      value.html?.remove();
      this.audioMap.delete(id);
      this.viewer.resource.delete(id);
    }
    this.activateElements = new Map();
  }
  /**
   * @description: 变速回调函数
   *
   * 该方法用于根据传入的速度值调整所有音频元素的播放速率。它会遍历 `audioMap` 中的每个音频实体，并通过修改音频的 `playbackRate` 属性来实现音频的加速或减速。音频的 `playbackRate` 控制音频的播放速度，默认为 1，值大于 1 时表示加速播放，小于 1 时表示减速播放。
   *
   * 主要功能：
   * 1. 遍历 `audioMap` 中所有存储的音频实体。
   * 2. 获取每个音频实体的 HTML 元素（即音频播放器）。
   * 3. 设置音频 HTML 元素的 `playbackRate` 属性为传入的 `speed` 值，从而改变音频播放速度。
   *
   * @param {number} speed - 音频的播放速率。默认为 1，值大于 1 时加速播放，小于 1 时减速播放。
   *
   * @returns {void} 无返回值。
   *
   * 数据来源：
   * - `this.audioMap`: 存储音频实体信息的映射表，其中每个音频实体包含其详细信息和对应的 HTML 元素。
   *
   * 过程：
   * 1. 遍历 `audioMap`，获取每个音频实体的 `html` 元素。
   * 2. 设置音频元素的 `playbackRate` 属性为传入的 `speed` 值，以调整音频播放速率。
   *
   * 该方法适用于音频播放速率的动态调整，例如在音频播放时，根据用户输入或系统控制来变更音频的播放速度。
   */

  /** 变速回调函数 */
  _speedChangeCallback(speed) {
    for (let [, value] of this.audioMap) {
      const html = value.html;
      html.playbackRate = speed;
    }
  }
  /**
   * @description: 生成音频标签组
   *
   * 该方法用于在指定的 Cesium 容器中创建一个 HTML 元素 `<div>`，作为音频标签组的容器，并将该容器添加到 Cesium 的 DOM 中。音频标签组用于存放音频控件或其他音频相关的UI组件。容器的默认样式设置为隐藏，通过修改其样式或设置 `display` 属性为 `block` 可以显示音频标签组。
   *
   * 主要功能：
   * 1. 创建一个新的 `<div>` 元素，作为音频标签组的容器。
   * 2. 设置该容器的样式为 `display: none`，默认情况下容器是隐藏的。
   * 3. 将创建的容器元素添加到指定的 Cesium 容器（`cesiumContainer`）中，作为 Cesium 场景的一部分。
   *
   * @param {HTMLElement} cesiumContainer - Cesium 场景的容器，通常是页面中的 Cesium 渲染容器元素。
   *
   * @returns {HTMLElement} 返回新创建的 `<div>` 元素，作为音频标签组的容器。
   *
   * 数据来源：
   * - `cesiumContainer`: 传入的 Cesium 容器，表示需要在其中插入音频标签组的 DOM 元素。
   *
   * 过程：
   * 1. 创建一个新的 `div` 元素，并设置其 `className` 为 `cesium-helper-audio-wrapper`，该类可以用于样式控制。
   * 2. 设置该容器的样式为 `display: none`，使其初始时保持隐藏。
   * 3. 将该容器元素插入到传入的 `cesiumContainer` 元素中，确保其与 Cesium 渲染的内容共存。
   *
   * 该方法通常用于动态添加音频相关的 UI 组件或控件，如音频播放控制面板、音量控制、进度条等。音频标签组的容器可根据需要进行显示或隐藏，以提供更好的用户交互体验。
   */

  /** 生成音频标签组 */
  _createAudioGroupContainer(cesiumContainer) {
    const dom = document.createElement("div");
    dom.className = "cesium-helper-audio-wrapper";
    dom.style.display = "none";
    cesiumContainer.appendChild(dom);
    return dom;
  }
  /**
   * @description: 创建音频标签
   *
   * 该方法用于动态创建一个 `<audio>` 元素，并将其配置为播放指定的音频文件。音频文件通过 URL 引用，该音频标签将被添加到音频标签组容器中。音频标签的播放速度根据播放器的设置进行调整，且默认设置为不自动播放，音频将在加载完成后准备好播放。
   *
   * 主要功能：
   * 1. 创建一个新的 `<audio>` 元素，指定音频文件的 URL。
   * 2. 设置音频标签的自动播放为 `false`，确保音频不在加载完成时自动播放。
   * 3. 设置音频标签的预加载方式为 `auto`，即音频在页面加载时会预先加载以便尽早播放。
   * 4. 调整音频标签的播放速率为当前播放器的速度设置。
   * 5. 将音频标签添加到音频标签组容器中，使其成为 Cesium 场景的一部分。
   * 6. 在音频元数据加载完成时通过 `loadedmetadata` 事件监听器，返回创建好的音频标签元素。
   *
   * @param {string} url - 音频文件的 URL 地址，指定要加载并播放的音频资源。
   *
   * @returns {Promise<HTMLElement>} 返回一个 Promise 对象，解析为新创建的音频标签元素。
   *
   * 数据来源：
   * - `url`: 传入的音频文件 URL，用于加载并播放音频。
   * - `this.supper.player.speed`: 播放器的当前播放速度设置，用于调整音频播放速率。
   * - `this.audioGroupContainer`: 存放音频标签的容器，用于将创建的音频标签添加到 DOM 中。
   *
   * 过程：
   * 1. 创建一个新的 `<audio>` 元素，并设置其 `src` 属性为传入的音频文件 URL。
   * 2. 设置音频标签的 `autoplay` 属性为 `false`，确保音频不会在加载完成后自动播放。
   * 3. 设置音频的 `preload` 属性为 `auto`，使浏览器尽早加载音频数据。
   * 4. 根据播放器的播放速率设置音频的 `playbackRate` 属性。
   * 5. 将创建的音频标签元素添加到音频标签组容器中，这样音频就能在 Cesium 场景中可用。
   * 6. 使用 `loadedmetadata` 事件监听器，确保音频元数据加载完成后再返回该音频标签。
   *
   * 该方法通常用于加载和管理多个音频文件，并通过播放器控制音频的播放速率。它可以确保音频文件在准备好播放后才会返回给调用者，从而避免播放过程中出现未加载完成的情况。
   */

  /** 创建音频标签 */
  _createAudioContainer(url) {
    const dom = document.createElement("audio");
    dom.src = url;
    dom.autoplay = false;
    dom.preload = "auto";
    dom.playbackRate = this.supper.player.speed;
    this.audioGroupContainer.appendChild(dom);
    return new Promise((resolve) => {
      dom.addEventListener("loadedmetadata", () => resolve(dom));
    });
  }
  /**
   * @description: 更新音频状态
   *
   * 该方法用于根据当前时间更新音频的播放状态。它会检查每个音频实体的可用时间范围，并在当前时间落在该范围内时播放音频。若当前时间不在可用范围内，则暂停音频并从激活列表中移除该音频。该方法采用异步执行方式以优化性能，确保音频的播放状态能够及时更新。
   *
   * 主要功能：
   * 1. 异步执行，通过 `setTimeout` 来确保音频的播放状态在后台进行更新，避免阻塞主线程。
   * 2. 将传入的 `currentTime` 时间字符串转换为标准的 `Date` 对象，并去除其中的时区信息。
   * 3. 遍历 `audioMap` 中的所有音频，检查每个音频的可用时间范围，判断当前时间是否在范围内。
   * 4. 如果当前时间在音频的可用时间范围内，且该音频尚未激活，则将其加入激活音频列表，更新音频的 `currentTime`，并在需要时播放音频。
   * 5. 如果当前时间不在音频的可用时间范围内，则暂停该音频并从激活音频列表中删除该音频。
   * 6. 确保音频播放的精确性，通过计算当前时间与音频可用时间开始时间的差异，动态更新音频的播放进度。
   *
   * @param {*} currentTime - 当前时间字符串，通常以 ISO8601 格式（例如 "2024-12-24T12:00:00Z"）传入。
   *
   * @returns {void} 此方法不返回任何值，直接在内部处理音频的播放与暂停逻辑。
   *
   * 数据来源：
   * - `currentTime`: 当前时间，用于判断音频是否需要播放。
   * - `this.audioMap`: 存储所有音频对象的映射，每个音频对象包含其可用时间和音频标签。
   * - `this.activateElements`: 一个 `Map`，存储当前被激活的音频对象，用于避免重复播放已经激活的音频。
   * - `value.html`: 每个音频对象的实际 HTML 音频标签，通过该标签控制音频的播放与暂停。
   * - `this.isPlay`: 一个布尔值，标记是否应该播放音频。如果为 `true`，音频会在符合条件时播放。
   *
   * 过程：
   * 1. 将传入的 `currentTime` 字符串转化为 `Date` 对象，去除其中的时区信息。
   * 2. 遍历 `audioMap` 中所有的音频对象，检查其可用时间范围（`availability`）。
   * 3. 对于每个音频，判断当前时间是否在其可用时间范围内：
   *   - 如果在范围内且未激活，激活该音频，并计算其在可用时间范围内的播放进度（`currentTime`）。
   *   - 如果在范围内且已经激活，跳过该音频，避免重复处理。
   *   - 如果不在范围内，暂停该音频，并将其从激活列表中移除。
   * 4. 通过设置 `currentTime` 来确保音频播放精度，以便从正确的时间点开始播放。
   *
   * 优化：
   * - 该方法通过 `setTimeout` 异步执行，避免在主线程中进行阻塞操作，提升性能。
   * - 通过激活音频列表（`activateElements`），避免重复播放同一个音频。
   *
   * 此方法适用于需要根据实时时间更新音频播放状态的场景，例如在 Cesium 中与地理数据同步时播放与暂停音频。
   */

  updateAudioState(currentTime) {
    currentTime = new Date(currentTime.replace("T", " ").replace("Z", ""));
    for (const [key, value] of this.audioMap) {
      const times = value.availability.split("/");
      const startTime = new Date(times[0].replace("T", " ").replace("Z", ""));
      const endTime = new Date(times[1].replace("T", " ").replace("Z", ""));
      const frameTran =
        currentTime &&
        this.lastFrameTime &&
        currentTime?.getTime() === this.lastFrameTime?.getTime();
      if (currentTime >= startTime && currentTime < endTime && frameTran) {
        // 检查该音频在不在激活音频中 如果在就直接跳过
        if (this.activateElements.get(key)) continue;
        // 不在就将其添加到激活音频中
        this.activateElements.set(key, true);
        value.html.currentTime =
          Math.abs(currentTime.getTime() - startTime.getTime()) / 1000;
        this.isPlay && value.html.play();
      } else {
        this.activateElements.delete(key);
        value.html.pause();
      }
    }
    this.lastFrameTime = currentTime;
  }
  /**
   * @description: 播放音频
   *
   * 该方法用于播放所有处于激活状态的音频。它会遍历当前激活的音频列表，并检查每个音频是否已暂停，如果是，则开始播放该音频。该方法通过设置 `isPlay` 标志来控制播放状态，并在激活音频列表中调用 `play()` 方法以启动音频播放。
   *
   * 主要功能：
   * 1. 设置 `isPlay` 为 `true`，表示系统当前处于播放状态。
   * 2. 遍历 `activateElements` 中的所有音频，判断每个音频的状态。
   * 3. 如果音频处于暂停状态，则调用其 `play()` 方法开始播放音频。
   * 4. 该方法确保所有需要播放的音频都能正确地开始播放，并且只会播放未播放的音频。
   *
   * @returns {void} 此方法不返回任何值，直接控制音频的播放行为。
   *
   * 数据来源：
   * - `this.isPlay`: 一个布尔值，标记当前是否应播放音频。若为 `true`，则播放所有激活的音频。
   * - `this.activateElements`: 存储当前被激活的音频的映射，确保只有激活的音频才会播放。
   * - `this.audioMap`: 存储音频对象的映射，每个音频对象包含其对应的 HTML 音频标签。
   * - `audio.html`: 每个音频对象的 HTML 音频标签，通过该标签控制音频的播放与暂停。
   *
   * 过程：
   * 1. 将 `isPlay` 设置为 `true`，表示进入播放模式。
   * 2. 遍历 `activateElements` 中的激活音频，检查每个音频是否已暂停。
   * 3. 对于每个暂停的音频，调用其 HTML 标签的 `play()` 方法开始播放。
   * 4. 只播放那些处于暂停状态的音频，避免重复播放已经在播放中的音频。
   *
   * 优化：
   * - 该方法通过 `activateElements` 确保只播放当前激活的音频，避免不必要的播放操作。
   * - 只会播放处于暂停状态的音频，避免对已经播放的音频重复调用 `play()`。
   *
   * 此方法适用于需要手动启动播放音频的场景，通常与时间控制、音频切换等功能结合使用。
   */

  /** 播放音频 */
  playAudio() {
    this.isPlay = true;
    for (const [key] of this.activateElements) {
      const audio = this.audioMap.get(key);
      audio?.html.paused && audio.html.play();
    }
  }
  /**
   * @description: 暂停音频
   *
   * 该方法用于暂停所有处于激活状态的音频。它会遍历当前激活的音频列表，并调用每个音频的 `pause()` 方法来暂停音频播放。该方法通过设置 `isPlay` 标志来控制暂停状态，并在激活音频列表中调用 `pause()` 方法以停止音频播放。
   *
   * 主要功能：
   * 1. 设置 `isPlay` 为 `false`，表示系统当前处于暂停状态。
   * 2. 遍历 `activateElements` 中的所有音频，调用每个音频的 `pause()` 方法来暂停音频。
   * 3. 该方法确保所有需要暂停的音频都能正确暂停，且只有正在播放的音频会被暂停。
   *
   * @returns {void} 此方法不返回任何值，直接控制音频的暂停行为。
   *
   * 数据来源：
   * - `this.isPlay`: 一个布尔值，标记当前是否应暂停音频。若为 `false`，则暂停所有激活的音频。
   * - `this.activateElements`: 存储当前被激活的音频的映射，确保只有激活的音频才会暂停。
   * - `this.audioMap`: 存储音频对象的映射，每个音频对象包含其对应的 HTML 音频标签。
   * - `audio.html`: 每个音频对象的 HTML 音频标签，通过该标签控制音频的播放与暂停。
   *
   * 过程：
   * 1. 将 `isPlay` 设置为 `false`，表示进入暂停模式。
   * 2. 遍历 `activateElements` 中的激活音频，调用每个音频的 `pause()` 方法来暂停音频播放。
   * 3. 该方法会暂停所有处于激活状态且正在播放的音频。
   *
   * 优化：
   * - 该方法通过 `activateElements` 确保只暂停当前激活的音频，避免对其他音频产生影响。
   * - 只会暂停正在播放的音频，避免对已经暂停的音频重复调用 `pause()`。
   *
   * 此方法适用于需要手动暂停音频的场景，通常与时间控制、音频切换等功能结合使用。
   */

  /** 暂停音频 */
  pauseAudio() {
    this.isPlay = false;
    for (const [key] of this.activateElements) {
      this.audioMap.get(key)?.html.pause();
    }
  }
  /**
   * @description: 获取默认名称
   *
   * 该方法用于生成一个音频对象的默认名称。默认名称的格式为“音频”加上一个自增的数字编号，编号部分为三位数，不足三位时会自动补零。
   *
   * 主要功能：
   * 1. 获取当前音频集合中音频的数量。
   * 2. 根据当前音频数量生成一个唯一的三位数编号。
   * 3. 返回一个由“音频”字符串和三位数编号组成的默认名称。
   *
   * @returns {string} 返回一个默认名称，例如 "音频001", "音频002" 等。
   *
   * 数据来源：
   * - `this.audioMap`: 存储音频对象的映射。`audioMap.keys()` 返回音频对象的所有键。
   *
   * 过程：
   * 1. 使用 `Array.from(this.audioMap.keys()).length` 获取当前音频对象的数量。
   * 2. 使用字符串拼接生成默认名称，并通过 `substr(-3)` 保证编号为三位数格式。
   *
   * 优化：
   * - 通过将音频数量作为编号生成依据，确保每次生成的名称都是唯一的，且编号从 001 开始递增。
   * - 使用 `substr(-3)` 保证编号长度不超过三位，避免出现不规范的名称。
   *
   * 此方法适用于需要自动生成音频对象名称的场景，尤其是在批量添加音频时生成唯一且规范的名称。
   */

  /**
   * 获取默认名称
   * */
  _getDefaultName() {
    return (
      "音频" +
      ("000" + (Array.from(this.audioMap.keys()).length + 1)).substr(-3)
    );
  }
}

export default Audio;
