/* Cesium 中实体资源 */
import Vue from "vue";

const cesium = {
  state: {
    /* 实体资源字典 */
    dictionary: {},
    /* 实体资源列表 */
    entities: [],
    /* 当前选中实体 */
    activateEntity: null,
    /* 当前战例总时长 */
    availability: "2000-01-01T00:00:00Z/2000-01-01T10:00:00Z",
    /* 系统当前时间 */
    currentTime: "2000-01-01T00:00:00Z",
    /* 模式 */
    mode: "standalone", // standalone: 单机， coordination：协同

    /** 图标字典 */
    iconMap: new Map([
      ["video", "icon-shipin1"],
      ["audio", "icon-icon_yinpin"],
      ["image", "icon-charutupian"],
      ["captions", "icon-zimu"],
      ["model", "icon-biaohuiguanli"],
      ["place", "icon-zuobiao"],
      ["boundary", "icon-xuxian1"],
      ["particle", "icon-texiao"],
      ["situation", "icon-erweibiaohuimianban"],
      ["text", "icon-wenbenkuang"],
      ["camera", "icon-shipin"],
      ["river", "icon-a-leixingfogxiantiao400"],
      ["road", "icon-daolu"],
      ["router", "icon-icon-lujingguanli"],
      ["root", "icon-folder"],
      ["group", "icon-folder"],
    ]),
  },

  mutations: {
    /** 添加实体资源 */
    ADD_ENTITY_SOURCE(state, source) {
      // 如果传入数组则批量添加
      if (source instanceof Array) {
        state.entities.push(...source);
        source.forEach((item) => (state.dictionary[item.id] = item));
      } else {
        state.entities.push(source);
        state.dictionary[source.id] = source;

        if (state.mode === "coordination") {
          Vue.prototype.$websocketHelper.sendMessage({
            code: "200",
            signal: "plot_insert",
            data: source,
          });
        }
      }
    },
    /** 更新实体资源 */
    UPDATE_ENTITY_SOURCE(state, source) {
      // 如果传入数组则线批量删除再批量插入
      if (source instanceof Array) {
        const ids = source.map((item) => item.id);
        state.entities = state.entities.filter((p) => ids.indexOf(p.id) < 0);
        state.entities.push(...source);
        source.forEach((item) => (state.dictionary[item.id] = item));
      } else {
        state.dictionary[source.id] = source;
        const entitiesIndex = state.entities.findIndex(
          (item) => item.id === source.id
        );
        Vue.set(state.entities, entitiesIndex, source);

        if (state.mode === "coordination") {
          Vue.prototype.$websocketHelper.sendMessage({
            code: "200",
            signal: "plot_update",
            data: source,
          });
        }
      }
    },

    /** 移除实体资源 */
    REMOVE_ENTITY_SOURCE(state, id) {
      const entitiesIndex = state.entities.findIndex((item) => item.id === id);
      if (entitiesIndex === -1) return;
      state.entities.splice(entitiesIndex, 1);
      if (state.activateEntity && id === state.activateEntity.id)
        state.activateEntity = null;
      delete state.dictionary[id];

      if (state.mode === "coordination") {
        Vue.prototype.$websocketHelper.sendMessage({
          code: "200",
          signal: "plot_remove",
          data: { id: id },
        });
      }
    },

    /** 清空实体资源 */
    REMOVE_ALL_SOURCE(state) {
      // 保留根目录
      state.entities = state.entities.filter((p) => p.type === "root");
      const root = state.entities[0];
      state.dictionary = {};
      state.dictionary[root.id] = root;
      state.activateEntity = null;

      if (state.mode === "coordination") {
        Vue.prototype.$websocketHelper.sendMessage({
          code: "200",
          signal: "plot_remove_all",
        });
      }
    },

    /** 设置选中实体 */
    SET_ACTIVATE_ENTITY(state, entity) {
      Vue.set(state, "activateEntity", entity);
    },

    /** 设置系统当前时间 */
    SET_CURRENT_TIME(state, iso8601) {
      state.currentTime = iso8601;
    },

    /** 设置标绘模式 */
    SET_MODE(state, mode) {
      state.mode = mode;
    },
  },

  actions: {
    /** 添加实体资源 */
    addEntitySource({ commit }, source) {
      commit("ADD_ENTITY_SOURCE", source);
    },
    /** 更新实体资源 */
    updateEntitySource({ commit }, source) {
      commit("UPDATE_ENTITY_SOURCE", source);
    },
    /** 移除实体资源 */
    removeEntitySource({ commit }, id) {
      commit("REMOVE_ENTITY_SOURCE", id);
    },
    /** 清空实体资源 */
    removeAllSource({ commit }) {
      commit("REMOVE_ALL_SOURCE");
    },

    /** 设置选中实体 */
    setActivateEntity({ commit }, entity) {
      commit("SET_ACTIVATE_ENTITY", entity);
    },

    /** 设置系统当前时间 */
    setCurrentTime({ commit }, iso8601) {
      commit("SET_CURRENT_TIME", iso8601);
    },

    /** 设置标绘模式 */
    setMode({ commit }, mode) {
      commit("SET_MODE", mode);
    },
  },
};

export default cesium;
