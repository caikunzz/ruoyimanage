const { defineConfig } = require("@vue/cli-service");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const port = process.env.port || process.env.npm_config_port || 100; // 端口

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  productionSourceMap: false,
  devServer: {
    host: "0.0.0.0",
    port: port,
    proxy: {
      // detail: https://cli.vuejs.org/config/#devserver-proxy
      [process.env.VUE_APP_BASE_API]: {
        ws: true, // 开启 websocket
        target: `http://127.0.0.1:8080`,
        changeOrigin: true,
        pathRewrite: {
          ["^" + process.env.VUE_APP_BASE_API]: "",
        },
      },
      [process.env.VUE_APP_PYTHON_API]: {
        target: `http://127.0.0.1:9800`,
        changeOrigin: true,
        pathRewrite: {
          ["^" + process.env.VUE_APP_PYTHON_API]: "",
        },
      },
      [process.env.VUE_APP_MAP_API]: {
        target: `http://127.0.0.1:5000`,
        pathRewrite: {
          ["^" + process.env.VUE_APP_MAP_API]: "",
        },
      },
      // 静态资源
      "/local/statics": {
        target: `http://127.0.0.1:8080/file/local/statics`,
        pathRewrite: {
          ["^" + "/local/statics"]: "",
        },
      },
      // 静态资源
      "/netdisk/statics": {
        target: `http://127.0.0.1:8080/file/netdisk/statics`,
        pathRewrite: {
          ["^" + "/netdisk/statics"]: "",
        },
      },
    },
  },
  configureWebpack: {
    plugins: [new NodePolyfillPlugin()],
    module: {
      rules: [
        {
          test: /.js$/,
          use: {
            loader: "@open-wc/webpack-import-meta-loader",
          },
        },
      ],
    },
  },
});
