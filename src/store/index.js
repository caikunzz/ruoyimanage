import Vue from "vue";
import Vuex from "vuex";
import getters from "./getters";
import cesium from "./modules/cesium";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    cesium,
  },
  getters,
});

export default store;
