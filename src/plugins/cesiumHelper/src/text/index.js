import * as uuid from "../common/uuid";
import * as DateUtils from "../common/dateUtils";
import { julianDateToIso8602Times } from "../common/dateUtils";

/**
 * 文字（相对屏幕位置、浮动于屏幕之上）
 *
 * 包含文字编辑设置等相关方法
 * @author：tzx
 * @date：2024/06/14
 * */
class Text {
  /** 视图 */
  viewer = null;

  /** 父级 */
  supper = null;

  /** 文字展示栏 Dom */
  textContainer = null;

  /** 文字字典 */
  textMap = null;

  /** 激活字典 */
  activateElements = null;

  /** 构造方法 */
  constructor(viewer, cesiumContainer, supper) {
    /** 初始化变量 */
    this.viewer = viewer;
    this.supper = supper;
    this.textMap = new Map();
    this.activateElements = new Map();

    /** 创建 并将文字标签加入到容器中 */
    this._createTextGroupContainer(cesiumContainer);

    /** 设置 系统时间回调 */
    supper.player.addEventListener(
      "change",
      "updateText",
      this.updateText.bind(this)
    );
  }

  /** 添加文字 */
  addText(options) {
    options = options || {};
    return new Promise((resolve) => {
      options.id = options.id || uuid.uuid();
      options.position = options.position || [
        this.supper.cesiumContainer.clientWidth / 2 - 29.5,
        this.supper.cesiumContainer.clientHeight / 2 - 10.5,
      ];
      options.name = options.name || this._getDefaultName();
      options.show =
        options.show !== undefined && options.show != null
          ? options.show
          : true;
      options.material = {
        text: {
          italic: options.material?.text?.italic,
          family: options.material?.text?.family || "sans-serif",
          size: options.material?.text?.size || 18,
          color: options.material?.text?.color || "#FFFFFF",
          scale: options.scale || 1,
        },
        fill: {
          color: options.material?.fill?.color || "transparent",
        },
      };
      this._createTextDom(options).then((dom) => {
        const entity = {
          id: options.id,
          type: "text",
          groupId: this.viewer.root.id,
          name: options.name,
          data: options.data,
          sort: options.sort || 1,
          label: options.label || options.name,
          availability:
            options.availability ||
            julianDateToIso8602Times(this.viewer.clock.currentTime),
          position: options.position,
          material: options.material,
          scale: options.scale,
          show: options.show,
          memory: options.memory,
          angle: options.angle,
          html: dom,
        };
        this.textMap.set(entity.id, entity);
        this.viewer.resource.set(entity.id, this.getTextToJson(entity));
        const time = DateUtils.julianDateToIso8601(
          this.viewer.clock.currentTime
        );
        this.updateText(time, false);
        resolve(entity);
      });
    });
  }

  /** 加载文字 */
  async loadTextOption(options) {
    return new Promise((resolve) => {
      this._createTextDom(options).then((dom) => {
        const entity = {
          id: options.id,
          type: options.type,
          groupId: this.viewer.root.id,
          name: options.label,
          data: options.data,
          sort: options.sort || 1,
          label: options.label,
          availability:
            options.availability ||
            julianDateToIso8602Times(this.viewer.clock.currentTime),
          position: options.position,
          material: options.material,
          scale: options.scale,
          show: options.show,
          memory: options.memory,
          angle: options.angle,
          html: dom,
        };
        this.textMap.set(entity.id, entity);
        this.viewer.resource.set(entity.id, this.getTextToJson(entity));
        const time = DateUtils.julianDateToIso8601(
          this.viewer.clock.currentTime
        );
        this.updateText(time, false);
        resolve(entity);
      });
    });
  }

  /** 编辑字幕 */
  editText(id, options) {
    const entity = this.textMap.get(id);
    "name" in options && (entity.name = options.name);
    "data" in options && (entity.data = options.data);
    "sort" in options && (entity.sort = options.sort);
    "groupId" in options && (entity.groupId = options.groupId);
    "availability" in options && (entity.availability = options.availability);
    if ("label" in options) {
      entity.label = options.label;
      entity.html.innerText = options.label;
    }
    // 修改样式
    if ("material" in options) {
      const material = options.material;
      // 文字样式
      if (material.text) {
        const text = material.text;
        if (text.color) {
          entity.html.style.color = text.color;
          entity.material.text.color = text.color;
        }
        if (text.size) {
          entity.html.style.fontSize = text.size + "px";
          entity.material.text.size = text.size;
        }
        if (text.family) {
          entity.html.style.fontFamily = text.family;
          entity.material.text.family = text.family;
        }
        if (text.outline) {
          entity.html.style.textShadow =
            "0 0 3px " +
            options.material.text.outline +
            ",0 0 3px " +
            options.material.text.outline +
            ",0 0 3px " +
            options.material.text.outline +
            ",0 0 3px " +
            options.material.text.outline;
          entity.material.text.outline = text.outline;
        }
        if (text.italic !== undefined && text.italic !== null) {
          entity.html.style.fontStyle = text.italic ? "italic" : "unset";
          entity.material.text.italic = text.italic;
        }
      }
      // 文字填充色
      if (material.fill) {
        const fill = material.fill;
        if (fill.color) {
          entity.html.style.backgroundColor = fill.color;
          entity.material.fill.color = fill.color;
        }
      }
    }
    // 修改位置
    if ("position" in options) {
      entity.html.style.left = options.position[0] + "px";
      entity.html.style.top = options.position[1] + "px";
      entity.position = [...options.position];
    }
    "show" in options && (entity.show = options.show);
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime);
    this.viewer.resource.set(id, this.getTextToJson(entity));
    this.updateText(time);
  }

  /**
   * 复制
   * */
  copy(entity) {
    return new Promise((resolve, reject) => {
      const data = JSON.parse(JSON.stringify(this.getTextToJson(entity)));
      const rect = entity.html.getBoundingClientRect();
      data.id = uuid.uuid();
      const left = data.position[0] + rect.width;
      const top = data.position[1] + rect.height;
      data.position = [left, top, 0];
      this.loadTextOption(data)
        .then((ent) => resolve(ent))
        .catch((err) => reject(err));
    });
  }

  /** 移除字幕 */
  removeById(id) {
    const entity = this.textMap.get(id);
    entity.html?.remove();
    this.textMap.delete(id);
    this.viewer.resource.delete(id);
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime);
    this.updateText(time);
  }

  /** 移除所有字幕 */
  removeAll() {
    for (const [key] of this.textMap) {
      const entity = this.textMap.get(key);
      entity.html?.remove();
      this.viewer.resource.delete(key);
    }
    this.textMap.clear();
    const time = DateUtils.julianDateToIso8601(this.viewer.clock.currentTime);
    this.updateText(time);
  }

  /** 根据 id 获取字幕 */
  getTextById(id) {
    return this.textMap.get(id);
  }

  /** 获取 字幕 Json */
  getTextToJson(entity) {
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
      label: entity.label,
      data: entity.data || null,
      sort: entity.sort || 1,
      groupId: entity.groupId,
      type: "text",
      startTime: startTime,
      endTime: endTime,
      show: entity.show,
      position: entity.position,
      material: entity.material,
      scale: entity.scale,
      memory: entity.memory,
      angle: entity.angle,
    };
  }

  /** 获取 字幕 列表 */
  getTextToList() {
    const result = [];
    for (let [, value] of this.textMap) {
      result.push(this.getTextToJson(value));
    }
    return result;
  }

  /** 更新文字内容 */
  updateText(currentTime) {
    currentTime = new Date(currentTime.replace("T", " ").replace("Z", ""));
    for (const [key, value] of this.textMap) {
      const times = value.availability.split("/");
      const startTime = new Date(times[0].replace("T", " ").replace("Z", ""));
      const endTime = new Date(times[1].replace("T", " ").replace("Z", ""));
      if (currentTime >= startTime && currentTime < endTime) {
        if (this.activateElements.get(key)) continue;
        value.html.style.display = "block";
        this.activateElements.set(key, true);
      } else {
        this.activateElements.delete(key);
        value.html.style.display = "none";
      }
    }
  }

  /** 创建文字标签 - 二维文本框 dom */
  _createTextDom(options) {
    return new Promise((resolve) => {
      const dom = document.createElement("span");

      dom.className = "cesium-helper-text";
      dom.setAttribute("data-id", options.id);

      dom.innerText = options.label || options.name;
      dom.style.position = "absolute";
      dom.style.cursor = "pointer";
      dom.style.zIndex = "2";
      dom.style.userSelect = "none";
      dom.style["-webkit-user-select"] = "none";
      dom.style["-moz-user-select"] = "none";
      dom.style["-ms-user-select"] = "none";

      dom.style.fontStyle = options?.material?.text?.italic
        ? "italic"
        : "unset";
      options?.material?.text?.family &&
        (dom.style.fontFamily = options.material.text.family);
      options?.material?.text?.size &&
        (dom.style.fontSize = options.material.text.size + "px");
      options?.material?.text?.color &&
        (dom.style.color = options.material.text.color);
      options?.material?.fill?.color &&
        (dom.style.backgroundColor = options.material.fill.color);
      options?.material?.text?.outline &&
        (dom.style.textShadow =
          "0 0 2px " +
          options.material.text.outline +
          ",0 0 2px " +
          options.material.text.outline +
          ",0 0 2px " +
          options.material.text.outline +
          ",0 0 2px " +
          options.material.text.outline);
      options?.scale && (dom.style.scale = options.scale);
      options?.position && (dom.style.left = options.position[0] + "px");
      options?.position && (dom.style.top = options.position[1] + "px");
      this.textContainer.appendChild(dom);
      resolve(dom);
    });
  }

  /** 生成文字标签组 - 二维文本框容器 */
  _createTextGroupContainer(cesiumContainer) {
    const dom = document.createElement("div");
    dom.className = "cesium-helper-text-wrapper";
    cesiumContainer.appendChild(dom);
    this.textContainer = dom;
    return dom;
  }

  _getDefaultName() {
    return "文本" + ("000" + (Array.from(this.textMap).length + 1)).substr(-3);
  }
}

export default Text;
