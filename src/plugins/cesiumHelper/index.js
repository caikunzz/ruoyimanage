import Group from "./src/group";
import Animation from "./src/animation";
import Audio from "./src/audio";
import Captions from "./src/captions";
import Plotting from "./src/plotting";
import Infobox from "./src/infobox";
import Measure from "./src/measure";
import Camera from "./src/camera";
import Player from "./src/player";
import Video from "./src/video";
import Text from "./src/text";
import * as dateUtils from "./src/common/dateUtils";
import * as plottingUtils from "./src/common/plottingUtils";
import "./lib/graphical/material/PointGlowMaterialProperty";

const Cesium = window.Cesium;
const Xt3d = window.xt3d;

/**
 * Cesium 工具对象
 *
 * 包含 Cesium 初始化、 绘制图形 等功能
 * @author TZX
 * @Date 2023/06/27
 * */
class CesiumHelper {
  // Cesium 查看器
  viewer = null;

  // 配置信息
  setting = null;

  // Cesium 容器
  cesiumContainer = null;

  // 当前激活元素
  activeElement = null;

  // 资源字典
  resource = null;

  // 分屏
  viewerSplit = null;
  sync2DListener = null;

  // 分组插件
  group = null;
  // 标会插件
  plotting = null;
  // 动画插件
  animation = null;
  // 字幕
  captions = null;
  // 音频
  audio = null;
  // 视频
  video = null;
  // 文字
  text = null;
  // 信息框
  infobox = null;
  // 摄像头
  camera = null;
  // 播放器
  player = null;
  //测量工具
  measure = null;
  // 实体激活事件字典
  activateEntityEventMap = null;

  //瓦片缓存
  mapTiles = null;

  // 右键菜单事件
  contextmenuEvent = () => {};

  /**
   * 实例化 Cesium
   *
   * @param {*} setting 相关配置
   * */
  constructor(setting) {
    /* 存储 Cesium 容器 */
    this.cesiumContainer = document.getElementById(setting.container);
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZjI0Njg3Mi02N2UyLTQ3ZGUtODI5MC0wNWEzMGIxYTNmM2QiLCJpZCI6MTIyNzM0LCJpYXQiOjE2OTI5NDM5MDZ9.VJXePGUbUwfN33NHCKP-IQIA16JieiJ7QN_7IZJqxyE";
    this.viewer = new Cesium.Viewer(setting.container, {
      imageryProvider: setting.imageryLayers ? false : undefined,
      fullscreenButton: setting.showFullscreenButton || false,
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestWaterMask: !setting.enableTerrain || false,
      }), //开启地形
      baseLayerPicker: setting.showBaseLayerPicker || false, //切换底图
      geocoder: setting.showGeocoder || false, //搜索框
      homeButton: setting.showHomeButton || false, //将相机视角跳转到默认视角
      sceneModePicker: setting.showSceneModePicker || false, //切换2D3D
      navigationHelpButton: setting.showNavigationHelpButton || false, //帮助提示
      sceneMode: Cesium.SceneMode.SCENE3D,
      infoBox: false,
      selectionIndicator: false, // 单击选中
      screenSpaceCameraController: {
        minimumZoomDistance: 500,
      },
      contextOptions: {
        //将把cesium退回到WebGL1 否则流光线材质报错
        requestWebgl1: true,
      },
    });

    // 初始化导航控件
    new Xt3d["SceneControl"].Navigation(this.viewer, {
      // defaultResetView: Cesium.Rectangle.fromDegrees(80, 22, 130, 50),
      enableCompass: setting.showCompass || false,
      enableZoomControls: setting.showZoomControls || false,
      enableDistanceLegend: setting.showDistanceLegend || false,
      enableCompassOuterRing: setting.showCompassOuterRing || false,
    });

    // 初始化鼠标位置信息
    if (setting.showPositionInfo) {
      new Xt3d["SceneControl"].PositionInfoStatusBar(this.viewer);
    }

    this.viewer.scene.globe.terrainExaggeration = 1.3;
    this.viewer.scene.globe.enableLighting = setting.enableLighting || false; // 启动光照
    this.viewer.scene.highDynamicRange = setting.highDynamicRange || false; // 启用HDR效果
    this.viewer.scene.globe.enableLighting = false; // 启动光照
    this.viewer.scene.debugShowFramesPerSecond =
      setting.showFramesPerSecond || false; // 显示帧率
    this.viewer.canvas.willReadFrequently = true;
    this.viewer.scene.globe.depthTestAgainstTerrain =
      setting.depthTestAgainstTerrain || false; //禁用深度写入
    this.viewer.cesiumWidget.creditContainer.style.display = "none"; //隐藏logo
    this.viewer.animation.container.style.visibility = setting.showClock
      ? "visible"
      : "hidden"; //隐藏时钟
    this.viewer.timeline.container.style.display = setting.showTimeline
      ? "block"
      : "none"; //隐藏时间线
    this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    // 用户自定义信息
    this.viewer._userData = setting.userData || {};
    // 读取用户配置
    this.setting = setting;
    // 本地影像加载
    if (setting.imageryLayers) {
      this.viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: setting.imageryLayers,
          fileExtension:
            setting.imageryLayers.split(".")[
              setting.imageryLayers.split(".").length - 1
            ],
        })
      );
      console.log("已加载：【本地影像】");
    }
    // 本地地形加载
    if (setting.terrainProvider) {
      Cesium.CesiumTerrainProvider.fromUrl(setting.terrainProvider)
        .then((terrainProvider) => {
          this.viewer.terrainProvider = terrainProvider;
          console.log("已加载：【本地地形】");
        })
        .catch((err) => console.log(err));
    }
    // 是否支持图像渲染像素化处理
    if (Cesium.FeatureDetection.supportsImageRenderingPixelated())
      this.viewer.resolutionScale = window.devicePixelRatio;
    // 开启抗锯齿
    this.viewer.scene.postProcessStages.fxaa.enabled =
      setting.enableFxaa || false;
    // 关闭预加载渲染图块的祖先。将此设置为true可优化缩小体验，并在平移时新暴露的区域。缺点是需要加载更多的图块。
    this.viewer.scene.globe.preloadAncestors = true;
    // 全局资源列表
    this.viewer.resource = new Map();
    // 全局实体点击事件
    this.activateEntityEventMap = new Map();

    // 初始化动画播放器插件
    this.player = new Player(this.viewer, {
      startTime: setting.clock.startTime,
      endTime: setting.clock.endTime,
      currentTime: setting.clock.currentTime,
    });

    // 初始化分组
    this.group = new Group(this.viewer, this);
    // 初始化标绘插件
    this.plotting = new Plotting(this.viewer, this);
    /* 初始化摄像头插件 */
    this.camera = new Camera(this.viewer, this);
    /* 初始化文字 */
    this.text = new Text(this.viewer, this.cesiumContainer, this);
    /* 初始化字幕 */
    this.captions = new Captions(this.viewer, this.cesiumContainer, this);
    /* 初始化音频 */
    this.audio = new Audio(this.viewer, this.cesiumContainer, this);
    /* 初始化视频 */
    this.video = new Video(this.viewer, this.cesiumContainer, this);
    /* 挂载信息框工具 */
    this.infobox = new Infobox(this.viewer, this.cesiumContainer, this);
    /* 三维测量工具 */
    this.measure = new Measure(this.viewer, this.cesiumContainer, this);
    /* 挂载动画插件 */
    this.animation = new Animation(this.viewer, this);
    /* 绑定全局事件 */
    this._clickEvent();
    this._moveEvent();
    this._contextmenuEvent();
  }

  /**
   * 切换地图源
   *
   * 该方法用于切换 Cesium 地图的图像源，通过传入一个新的 URL 来更新地图的底图。
   * 使用 `UrlTemplateImageryProvider` 提供的 URL 模板来加载新的地图图层。
   *
   * 功能说明：
   * 1. 通过传入的 `url` 参数，构造一个新的 `UrlTemplateImageryProvider` 实例。
   * 2. 使用该实例替换当前的地图图像源，实现底图的切换。
   * 3. 图像文件类型默认为 `png`，通过 `fileExtension` 参数指定。
   *
   * 注意：
   * - `UrlTemplateImageryProvider` 可以通过模板 URL 来请求不同的地图切片数据。
   * - 该方法在需要动态更换地图源或更新地图样式时非常有用。
   *
   * 数据来源：12138
   */
  changeMapSource(url) {
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: url,
      fileExtension: "png",
    });
    this.mapTiles =
      this.viewer.imageryLayers.addImageryProvider(imageryProvider);
  }

  /**
   * 恢复默认地图源
   *
   * 该方法用于将 Cesium 地图恢复为默认的图像源。通过移除当前的自定义图层，恢复至默认地图底图。
   *
   * 功能说明：
   * 1. 移除当前的地图图层（即自定义的 `mapTiles`）。
   * 2. 恢复至 Cesium 默认的地图底图，通常是由 `ImageryLayerCollection` 管理的默认图层。
   *
   * 注意：
   * - 使用此方法时，会移除当前图层并恢复至原始的地图源设置。
   * - 如果需要切换至不同的地图图层或源，可以使用 `changeMapSource` 方法。
   *
   * 数据来源：12138
   */
  restoresDefaultSource() {
    this.viewer.imageryLayers.remove(this.mapTiles);
  }

  /**
   * 加载本地2D地图
   *
   * 该方法用于加载一个指定的 2D 地图源并切换到 2D 视图模式。
   *
   * 功能说明：
   * 1. 调用 `changeMapSource` 方法，加载指定的 2D 地图源 URL。
   * 2. 切换到 2D 视图模式，使用 `viewer.scene.morphTo2D(0)` 方法。
   *
   * 详细说明：
   * - `changeMapSource` 方法用于加载地图源，地图源的 URL 是高德地图的 2D 瓦片服务。
   * - `viewer.scene.morphTo2D(0)` 切换当前视图为 2D 模式，确保地图以二维形式呈现。
   *
   * 数据来源：12138
   */
  loadingLocalityMap2d() {
    console.log(this.setting.splitLayers);
    this.changeMapSource(this.setting.splitLayers);
    // 切换到2D视图
    this.viewer.scene.morphTo2D(0);
  }

  /**
   * 移除本地2D地图并恢复默认地图源
   *
   * 该方法用于移除当前加载的 2D 地图源并恢复到默认地图源，同时切换回 3D 视图模式。
   *
   * 功能说明：
   * 1. 调用 `restoresDefaultSource` 方法，移除当前加载的 2D 地图源，并恢复为默认地图源。
   * 2. 切换到 3D 视图模式，使用 `viewer.scene.morphTo3D(0)` 方法。
   *
   * 详细说明：
   * - `restoresDefaultSource` 方法用于移除当前的地图层，并恢复到默认的地图源。
   * - `viewer.scene.morphTo3D(0)` 切换当前视图为 3D 模式，确保地图以三维形式呈现。
   *
   * 数据来源：12138
   */
  removeLocalityMap2d() {
    this.restoresDefaultSource();
    // 切换到3D视图
    this.viewer.scene.morphTo3D(0);
  }

  /**
   * 是否固定当前动画，用户将无法通过鼠标拖动、滚轮缩放等方式来改变相机的位置和姿态
   *
   * 该方法用于控制是否固定当前动画，阻止用户通过鼠标操作改变相机位置和视角。
   *
   * 功能说明：
   * 1. 如果参数 `fixed` 为 `true`，则禁用所有鼠标输入，用户无法通过鼠标拖动、滚轮缩放等方式操作视角。
   * 2. 如果参数 `fixed` 为 `false`，则恢复默认的输入控制，允许用户操作视角。
   *
   * 详细说明：
   * - `this.viewer.scene.screenSpaceCameraController.enableInputs` 属性控制相机的输入事件。当值为 `false` 时，禁用用户对相机的输入；当值为 `true` 时，允许用户操作。
   *
   * 数据来源：12138
   */
  isFixedScreen(fixed) {
    fixed = !fixed;
    this.viewer.scene.screenSpaceCameraController.enableInputs = fixed; //户将无法通过鼠标拖动、滚轮缩放等方式来改变相机的位置和姿态
  }

  /**
   * 开启场景分屏
   *
   * 该方法用于开启场景分屏功能，创建一个新的 Cesium Viewer 实例并将其配置为分屏显示。
   *
   * 功能说明：
   * 1. 创建一个新的 Viewer 实例（`viewerSplit`），并设置其为 2D 模式。
   * 2. 加载本地影像层和本地地形数据（如果配置了 `splitLayers` 和 `terrainProvider`）。
   * 3. 配置地图容器的布局，使两个 Cesium 视图并排显示。
   * 4. 同步 2D 视图与 3D 视图的位置变化。
   *
   * 详细说明：
   * - `viewerSplit` 创建后，用户可以在分屏的左侧和右侧查看不同的地图内容。
   * - 本地影像和地形数据（如果配置）会在新的分屏视图中加载，提供定制化的地图显示。
   * - `sync2DListener` 监听 3D 视图的相机变化并同步更新 2D 视图。
   *
   * 数据来源：12138
   */
  startSplitScreen() {
    if (!this.viewerSplit) {
      // 创建分屏容器
      this.viewerSplit = new Cesium.Viewer("cesiumContainer-split", {
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        // 关闭点选出现的提示框
        selectionIndicator: false,
        infoBox: false,
        sceneMode: Cesium.SceneMode.SCENE2D,
      });
      // 本地影像加载
      if (this.setting.splitLayers) {
        this.viewerSplit.imageryLayers.addImageryProvider(
          new Cesium.UrlTemplateImageryProvider({
            url: this.setting.splitLayers,
            fileExtension:
              this.setting.splitLayers.split(".")[
                this.setting.splitLayers.split(".").length - 1
              ],
          })
        );
        console.log("已加载：【分屏本地影像】");
      }
      // 本地地形加载
      if (this.setting.terrainProvider) {
        Cesium.CesiumTerrainProvider.fromUrl(this.setting.terrainProvider)
          .then((terrainProvider) => {
            this.viewer.terrainProvider = terrainProvider;
            console.log("已加载：【本地地形】");
          })
          .catch((err) => console.log(err));
      }
    }
    // 更新界面布局
    const container1 = document.getElementById("cesiumContainer");
    const container2 = document.getElementById("cesiumContainer-split");
    container1.style.display = "inline-block";
    container1.style.width = "50%";
    container1.style.height = "100%";

    container2.style.display = "inline-block";
    container2.style.width = "50%";
    container2.style.height = "100%";

    // 监听三维地图变化
    this.sync2DListener = () => this.sync2D();
    this.viewer.camera.percentageChanged = 0.01;
    this.viewer.camera.changed.addEventListener(this.sync2DListener);
  }

  /**
   * 关闭二三维分屏
   *
   * 该方法用于关闭场景的二三维分屏功能，恢复原始的全屏视图布局，并清除分屏相关的资源。
   *
   * 功能说明：
   * 1. 恢复主视图容器（`cesiumContainer`）为 100% 宽高显示，取消分屏显示。
   * 2. 将分屏容器（`cesiumContainer-split`）的宽度和高度设置为 0% 以隐藏分屏视图。
   * 3. 移除 3D 视图与 2D 视图的同步监听器。
   * 4. 销毁 `viewerSplit` 实例，清除分屏资源。
   *
   * 详细说明：
   * - 在关闭分屏后，所有视图设置恢复为单一视图模式，原始的 3D 地图视图将占用全屏显示。
   * - 该方法会清除与分屏相关的所有设置，避免不必要的资源占用。
   *
   * 数据来源：12139
   */
  endSplitScreen() {
    // 更新界面布局
    const container1 = document.getElementById("cesiumContainer");
    const container2 = document.getElementById("cesiumContainer-split");
    container1.style.width = "100%";
    container1.style.height = "100%";
    container1.style.display = "block";

    container2.style.display = "block";
    container2.style.width = "0%";
    container2.style.height = "0%";

    // 移除监听器
    this.viewer.camera.changed.removeEventListener(this.sync2DListener);
    // 清除分屏地球对象
    if (this.viewerSplit) {
      this.viewerSplit.destroy();
      this.viewerSplit = null;
    }
  }

  /**
   * @description: 将二维地图的视图与三维同步
   *
   * 该方法用于同步当前的三维视图和分屏中的二维视图，确保当三维视图发生变化时，二维视图能够正确地跟随和展示相应的位置。
   *
   * 功能说明：
   * 1. 获取当前三维视图中心点的屏幕坐标。
   * 2. 将屏幕坐标转换为地球表面的世界坐标系中的位置。
   * 3. 判断该位置是否有效，确保中心点在椭球体表面。
   * 4. 计算三维视图中的相机与地球表面之间的距离。
   * 5. 在二维视图中调整相机的位置和视角，使其与三维视图保持同步。
   *
   * 详细说明：
   * - 该方法会实时同步三维视图的变化到二维视图，确保用户在操作三维视图时，二维视图的显示位置与视角保持一致。
   * - `viewer` 和 `viewerSplit` 分别表示主视图和分屏视图的 Cesium 实例。
   *
   * 数据来源：12138
   */
  sync2D() {
    // 三维地图中心点
    let center = new Cesium.Cartesian2(
      Math.floor(this.viewer.canvas.clientWidth / 2),
      Math.floor(this.viewer.canvas.clientHeight / 2)
    );
    // 转为世界坐标系
    let position = this.viewer.scene.camera.pickEllipsoid(center);
    // 判断中心点是否在椭球体上
    if (Cesium.defined(position)) {
      // 获取三维地图中心点与相机之间的距离
      let distance = Cesium.Cartesian3.distance(
        position,
        this.viewer.scene.camera.positionWC
      );
      // 更新二维地图
      this.viewerSplit.scene.camera.lookAt(
        position,
        new Cesium.Cartesian3(0.0, 0.0, distance)
      );
    }
  }

  /**
   * @description: 摄像头移动
   *
   * 该方法用于控制摄像头平滑地移动到指定的经度、纬度和高度位置。常用于视角切换或者聚焦特定位置。
   *
   * 功能说明：
   * 1. 接收经度、纬度和高度作为输入参数。
   * 2. 使用 `Cesium.Cartesian3.fromDegrees` 方法将经纬度和高度转换为 Cesium 世界坐标系中的位置。
   * 3. 调用 `viewer.camera.flyTo` 方法将摄像头平滑地移动到该位置。
   *
   * 详细说明：
   * - `lat`（经度）：目标位置的经度值，范围为 -180 到 180。
   * - `lng`（纬度）：目标位置的纬度值，范围为 -90 到 90。
   * - `height`（高度）：目标位置的高度值，单位为米，相对于地球表面。
   *
   * 示例：
   * ```javascript
   * cameraFlyTo(102.2288610889242, 29.866724668422627, 3747.085283456273);
   * ```
   * 该示例会将摄像头移动到经度 `102.2288610889242`，纬度 `29.866724668422627`，并设置高度为 `3747.085283456273` 米的位置。
   */
  cameraFlyTo(lat, lng, height) {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lat, lng, height),
    });
  }

  /** 实体对象相关 */

  /**
   * @description: 根据实体 id 获取对应的实体对象
   *
   * 该方法用于根据提供的实体 ID 获取不同类型的实体对象。根据实体的类型（如 river、boundary、route 等），调用不同的获取方法。
   *
   * 功能说明：
   * 1. 通过 `viewer.resource.get(id)` 获取资源对象，如果资源对象存在，则根据类型返回不同的实体对象。
   * 2. 如果实体类型是 "river"、"boundary"、"route"、"road" 等，会调用对应的绘制类方法。
   * 3. 如果实体类型是 "image"、"model"、"situation" 等，则直接从 `viewer.entities` 中获取实体。
   * 4. 对于一些特殊类型如 "captions"、"audio"、"video" 等，则分别从对应的对象中获取。
   * 5. 如果无法直接获取，递归查找关联的 `entityId`。
   *
   * 详细说明：
   * - `id`：实体的唯一标识符，用于查找对应的实体。
   *
   * 示例：
   * ```javascript
   * const entity = getEntityById('entityId123');
   * ```
   * 上述代码会根据提供的 `entityId123` 查找对应的实体。
   *
   * @param {string} id 实体的唯一标识符。
   * @return {Object|null} 返回对应的实体对象，如果未找到实体，则返回 `null`。
   */

  getEntityById(id) {
    const resource = this.viewer.resource.get(id);
    if (resource) {
      switch (resource.type) {
        case "river":
          return this.plotting.riverPlotting.getRiverById(id);
        case "boundary":
          return this.plotting.boundaryPlotting.getBoundaryById(id);
        case "route":
          return this.plotting.routePlotting.getRouteById(id);
        case "road":
          return this.plotting.roadPlotting.getRoadById(id);
        case "image":
        case "model":
        case "situation":
        case "place":
        case "particle":
        case "tag":
          return this.viewer.entities.getById(id);
        case "captions":
          return this.captions.getCaptionById(id);
        case "audio":
          return this.audio.getAudioById(id);
        case "video":
          return this.video.getVideoById(id);
        case "text":
          return this.text.getTextById(id);
        case "camera":
          return this.camera.getCameraById(id);
        case "root":
        case "group":
          return this.group.getGroupById(id);
        default:
          return null;
      }
    } else {
      const entity = this.viewer.entities.getById(id);
      if (entity?.entityId) return this.getEntityById(entity.entityId);
      return null;
    }
  }

  /**
   * 拷贝实体
   *
   * 该函数根据给定的实体 ID 获取实体，并根据实体的类型调用不同的拷贝方法实现实体的拷贝。
   *
   * @param {string} id - 实体的唯一标识符。
   * @returns {Object|null} - 返回拷贝后的实体对象，如果实体不存在或类型不匹配则返回 null。
   *
   * 功能说明：
   * 1. 调用 `this.getEntityById(id)` 获取实体对象。
   * 2. 判断实体类型，根据以下类型执行对应的拷贝逻辑：
   *    - `river`: 河流类型的实体
   *    - `boundary`: 边界类型的实体
   *    - `route`: 路径类型的实体
   *    - `road`: 道路类型的实体
   *    - `image`: 图像类型的实体
   *    - `model`: 模型类型的实体
   *    - `situation`: 情景类型的实体
   *    - `place`: 地点类型的实体
   *    - `particle`: 粒子类型的实体
   *    - `tag`: 标签类型的实体
   *    - `text`: 文本类型的实体
   * 3. 对于 `river`、`boundary` 等类型，调用 `this.plotting.copy(entity)` 进行拷贝。
   * 4. 对于 `text` 类型，调用 `this.text.copy(entity)` 进行拷贝。
   * 5. 如果实体的类型不在支持的范围内，返回 `null`。
   * 6. 注释来源：12138
   */
  copyById(id) {
    const entity = this.getEntityById(id) || this.viewer.entities.getById(id);
    if (entity) {
      switch (entity.type) {
        case "river":
        case "boundary":
        case "route":
        case "road":
        case "image":
        case "model":
        case "situation":
        case "place":
        case "particle":
        case "tag":
          return this.plotting.copy(entity);
        case "text":
          return this.text.copy(entity);
        default:
          return Promise.reject("此类型实体不支持复制");
      }
    }
  }

  /**
   * 根据实体 ID 和属性信息更新实体
   *
   * 该函数根据提供的实体 ID 获取实体对象，并根据实体的类型调用相应的方法更新实体的属性。
   *
   * @param {string} id - 实体的唯一标识符。
   * @param {*} options - 用于更新实体的属性对象。
   *
   * 功能说明：
   * 1. 调用 `this.getEntityById(id)` 获取实体对象。
   * 2. 如果实体存在，根据实体的类型调用对应的更新方法：
   *    - `captions`: 调用 `this.captions.editCaptions(id, options)` 更新字幕属性。
   *    - `audio`: 调用 `this.audio.editAudio(id, options)` 更新音频属性。
   *    - `video`: 调用 `this.video.editVideo(id, options)` 更新视频属性。
   *    - `text`: 调用 `this.text.editText(id, options)` 更新文本属性。
   *    - `camera`: 调用 `this.camera.editCamera(id, options)` 更新相机属性。
   *    - `root` 或 `group`: 调用 `this.group.editGroup(entity, options)` 更新分组属性。
   *    - 其他类型：调用 `this.plotting.updatePlotting(entity, options)` 更新通用绘图属性。
   * 3. 如果实体不存在，输出 "该实体不存在" 的提示信息到控制台。
   * 4  注释来源：12138
   * 注意：
   * - 不同实体类型的更新逻辑需要在对应的子模块中实现。
   * - `options` 参数格式应与具体实体的更新方法要求一致。
   */

  updateObjById(id, options) {
    const entity = this.getEntityById(id) || this.viewer.entities.getById(id);
    if (entity) {
      switch (entity.type) {
        case "captions":
          this.captions.editCaptions(id, options);
          break;
        case "audio":
          this.audio.editAudio(id, options);
          break;
        case "video":
          this.video.editVideo(id, options);
          break;
        case "text":
          this.text.editText(id, options);
          break;
        case "camera":
          this.camera.editCamera(id, options);
          break;
        case "root":
        case "group":
          this.group.editGroup(entity, options);
          break;
        case "image":
        case "model":
        case "situation":
        case "river":
        case "route":
        case "road":
        case "tag":
        case "place":
        case "boundary":
        case "particle":
          this.plotting.updatePlotting(entity, options);
          break;
        default:
          return null;
      }
    } else {
      console.log("该实体不存在");
    }
  }

  /**
   * 根据实体 ID 删除对象
   *
   * 该函数根据提供的实体 ID 获取实体对象，并根据实体的类型调用相应的方法删除该实体。
   *
   * @param {*} id - 实体的唯一标识符。
   *
   * 功能说明：
   * 1. 调用 `this.getEntityById(id)` 获取实体对象。
   * 2. 如果实体存在，根据实体的类型调用对应的删除方法：
   *    - 以下类型调用 `this.plotting.removePlotting(entity)` 删除绘图相关的实体：
   *      - `image`: 图像实体
   *      - `model`: 模型实体
   *      - `situation`: 情景实体
   *      - `river`: 河流实体
   *      - `boundary`: 边界实体
   *      - `route`: 路径实体
   *      - `road`: 道路实体
   *      - `place`: 地点实体
   *      - `particle`: 粒子实体
   *      - `tag`: 标签实体
   *    - `captions`: 调用 `this.captions.removeById(id)` 删除字幕实体。
   *    - `audio`: 调用 `this.audio.removeById(id)` 删除音频实体。
   *    - `video`: 调用 `this.video.removeById(id)` 删除视频实体。
   *    - `text`: 调用 `this.text.removeById(id)` 删除文本实体。
   *    - `camera`: 调用 `this.camera.removeById(id)` 删除相机实体。
   *    - `root` 或 `group`: 调用 `this.group.removeById(id)` 删除分组实体。
   * 3. 如果实体不存在，输出 "该实体不存在" 的提示信息到控制台。
   * 4.  注释来源：12138
   * 注意：
   * - 每种类型的删除逻辑应在对应模块中具体实现。
   * - 删除前请确保实体不再被其他对象依赖。
   */
  deleteObjById(id) {
    const entity = this.getEntityById(id);
    if (entity) {
      switch (entity.type) {
        case "image":
        case "model":
        case "situation":
        case "river":
        case "boundary":
        case "route":
        case "road":
        case "place":
        case "particle":
        case "tag":
          this.plotting.removePlotting(entity);
          break;
        case "captions":
          this.captions.removeById(id);
          break;
        case "audio":
          this.audio.removeById(id);
          break;
        case "video":
          this.video.removeById(id);
          break;
        case "text":
          this.text.removeById(id);
          break;
        case "camera":
          this.camera.removeById(id);
          break;
        case "root":
        case "group":
          this.group.removeById(id);
          break;
        default:
          return null;
      }
    } else {
      const entity = this.viewer.entities.getById(id);
      if (entity && entity.name === "_measure") {
        //删除测量工具实体
        entity.idContainer.forEach((id) => {
          this.viewer.entities.removeById(id);
        });
      }
    }
  }

  /**
   * 设置激活实体
   *
   * 该函数用于设置当前激活的实体。可以通过直接传入实体对象或实体 ID 来指定需要激活的实体。
   *
   * @param {Cesium.Entity | string} value - 激活的目标实体，支持以下两种形式：
   *    - 实体对象（Cesium.Entity 类型）。
   *    - 实体的唯一标识符（string 类型）。
   *
   * 功能说明：
   * 1. 如果参数 `value` 为 `null` 或 `undefined`，将 `this.activeElement` 设置为 `null`，表示没有激活的实体。
   * 2. 如果参数 `value` 是一个对象（即实体对象），直接将其赋值给 `this.activeElement`。
   * 3. 如果参数 `value` 是一个字符串（即实体 ID），调用 `this.getEntityById(value)` 获取对应的实体，并将其赋值给 `this.activeElement`。
   * 4.  注释来源：12138
   * 注意：
   * - 确保 `value` 是有效的实体对象或实体 ID。
   * - 激活的实体通常在应用程序中被高亮显示或被赋予某些特殊的交互行为。
   */
  setActiveEntity(value) {
    if (!value) {
      this.activeElement = null;
    } else {
      this.activeElement =
        value instanceof Object ? value : this.getEntityById(value);
    }
  }

  /**
   * 设置系统时间
   *
   * 该函数用于更新系统的当前时间，以指定的 ISO8601 格式时间字符串为参数。
   *
   * @param {string} iso8601 - 系统所需的时间字符串，格式为 ISO8601，例如：`2023-01-01T08:02:00Z`。
   *
   * 功能说明：
   * 1. 接收一个符合 ISO8601 标准的时间字符串作为输入。
   * 2. 调用 `this.player.updateTime(iso8601)` 更新系统时间。
   * 3. 时间更新后，系统的相关模块将同步到新的时间。
   * 4.  注释来源：12138
   * 注意：
   * - 输入的时间字符串必须符合 ISO8601 格式。
   * - 时间更新可能触发依赖时间的其他模块或功能的同步更新。
   * - 调用该函数前，确保 `this.player` 对象已正确初始化。
   */

  setCurrentTime(iso8601) {
    this.player.updateTime(iso8601);
  }

  /**
   * 获取实体信息
   *
   * 该函数用于根据实体对象或实体 ID 获取对应实体的信息，并将其转换为 JSON 格式。
   *
   * @param {*} value - 可以是实体对象或实体的唯一标识符（ID）。
   * @returns {Object|null} - 返回实体的 JSON 格式信息，如果实体不存在则返回 null。
   *
   * 功能说明：
   * 1. 如果 `value` 是对象，则直接作为实体处理；如果是 ID，则通过 `this.getEntityById(value)` 获取实体。
   * 2. 如果实体存在，根据其类型调用不同的方法获取 JSON 格式信息：
   *    - 以下类型调用 `this.plotting.getPlottingToJson(entity)` 获取绘图相关实体的信息：
   *      - `image`: 图像实体
   *      - `model`: 模型实体
   *      - `situation`: 情景实体
   *      - `river`: 河流实体
   *      - `route`: 路径实体
   *      - `road`: 道路实体
   *      - `tag`: 标签实体
   *      - `place`: 地点实体
   *      - `boundary`: 边界实体
   *      - `particle`: 粒子实体
   *    - `captions`: 调用 `this.captions.getCaptionToJson(entity)` 获取字幕实体信息。
   *    - `audio`: 调用 `this.audio.getAudioToJson(entity)` 获取音频实体信息。
   *    - `video`: 调用 `this.video.getVideoToJson(entity)` 获取视频实体信息。
   *    - `text`: 调用 `this.text.getTextToJson(entity)` 获取文本实体信息。
   *    - `camera`: 调用 `this.camera.getCameraToJson(entity)` 获取相机实体信息。
   *    - `root` 或 `group`: 调用 `this.group.getGroupToJson(entity)` 获取分组实体信息。
   * 3. 如果实体类型不匹配或实体不存在，返回 `null`。
   *
   * 数据来源：12138
   */
  getEntityInfo(value) {
    let entity = value instanceof Object ? value : this.getEntityById(value);
    if (entity) {
      switch (entity.type) {
        case "image":
        case "model":
        case "situation":
        case "river":
        case "route":
        case "road":
        case "tag":
        case "place":
        case "boundary":
        case "particle":
          return this.plotting.getPlottingToJson(entity);
        case "captions":
          return this.captions.getCaptionToJson(entity);
        case "audio":
          return this.audio.getAudioToJson(entity);
        case "video":
          return this.video.getVideoToJson(entity);
        case "text":
          return this.text.getTextToJson(entity);
        case "camera":
          return this.camera.getCameraToJson(entity);
        case "root":
        case "group":
          return this.group.getGroupToJson(entity);
        default:
          return null;
      }
    }
    return null;
  }

  /**
   * 移除当前全部实体
   *
   * 该函数用于移除系统中的所有实体对象，并重置相关模块。
   *
   * 功能说明：
   * 1. 调用 `this.plotting.removeAll()` 移除所有绘图相关的实体。
   * 2. 调用 `this.captions.removeAll()` 移除所有字幕实体。
   * 3. 调用 `this.audio.removeAll()` 移除所有音频实体。
   * 4. 调用 `this.camera.removeAll()` 重置摄像头模块。
   * 5. 调用 `this.group.removeAll()` 重置所有分组实体。
   * 6. 调用 `this.video.removeAll()` 移除所有视频实体。
   * 7. 调用 `this.text.removeAll()` 移除所有文字实体。
   * 8. 调用 `this.viewer.entities.removeAll()` 清空所有缓存中的实体对象。
   *
   * 数据来源：12138
   */
  removeAll() {
    /* 移除标绘 */
    this.plotting.removeAll();
    /* 移除字幕 */
    this.captions.removeAll();
    /* 移除音频 */
    this.audio.removeAll();
    /* 重置摄像头 */
    this.camera.removeAll();
    /* 重置分组 */
    this.group.removeAll();
    /* 移除视频 */
    this.video.removeAll();
    /* 移除文字 */
    this.text.removeAll();
    /* 清空缓存 */
    this.viewer.entities.removeAll();
  }

  /**
   * 添加实体激活事件
   *
   * 该函数用于为指定的实体添加激活事件，当实体被激活时触发相应的回调函数。
   *
   * @param {string} id - 实体的唯一标识符。
   * @param {Function} func - 当实体被激活时调用的回调函数。
   *
   * 功能说明：
   * 1. 调用 `this.activateEntityEventMap.set(id, func)` 将实体 ID 和对应的回调函数存储到激活事件映射表中。
   * 2. 当实体被激活时，会根据实体 ID 查找并执行对应的回调函数。
   *
   * 注意：
   * - 回调函数 `func` 应具有适当的签名，以便正确处理实体激活事件。
   * - 确保 `id` 和 `func` 的有效性，以避免存储无效的事件映射。
   *
   * 数据来源：12138
   */
  addEntityActivateEvent(id, func) {
    this.activateEntityEventMap.set(id, func);
  }

  /**
   * 移除实体激活事件
   *
   * 该函数用于移除指定实体的激活事件，防止其激活时触发回调函数。
   *
   * @param {string} id - 实体的唯一标识符。
   *
   * 功能说明：
   * 1. 调用 `this.activateEntityEventMap.delete(id)` 从激活事件映射表中删除与指定实体 ID 相关的回调函数。
   * 2. 删除后，当该实体被激活时，不会再触发任何回调函数。
   *
   * 注意：
   * - 如果指定的 `id` 不存在于映射表中，调用此函数不会产生任何影响。
   * - 确保在移除事件前，确认该实体不再需要激活事件回调。
   *
   * 数据来源：12138
   */
  removeEntityActivateEvent(id) {
    this.activateEntityEventMap.delete(id);
  }

  /**
   * 绑定实体右键菜单事件
   *
   * 该函数用于为实体绑定右键菜单事件，当用户在实体上触发右键操作时，调用指定的回调函数。
   *
   * @param {Function} func - 当实体右键被触发时调用的回调函数。
   *
   * 功能说明：
   * 1. 将传入的回调函数 `func` 赋值给 `this.contextmenuEvent`，以处理右键菜单事件。
   * 2. 当实体触发右键操作时，绑定的回调函数将被调用。
   *
   * 注意：
   * - 回调函数 `func` 应具有适当的签名，以处理右键菜单逻辑，例如显示菜单或执行特定操作。
   * - 确保在调用该函数前，传入了有效的回调函数。
   *
   * 数据来源：12138
   */
  bindContextmenu(func) {
    this.contextmenuEvent = func;
  }

  /**
   * Cesium 脚本资源导出
   *
   * 该函数用于导出指定节点或所有节点的 Cesium 资源脚本，包括各类实体和动画数据。
   * 生成的脚本可用于其他场景或应用中重建实体和动画效果。
   *
   * @param {string} nodeId - 要导出的节点 ID。如果为 `null`，将导出所有节点。
   * @returns {Object} - 包含导出数据的动画对象，包含资源可用性、时间范围、子节点等信息。
   *
   * 功能说明：
   * 1. 如果 `nodeId` 为 `null`，将会导出所有类型的实体，包括绘图、字幕、音频、视频、相机、文本和分组等。
   * 2. 如果 `nodeId` 指定了一个具体的实体 ID，将根据实体类型选择不同的处理方式：
   *    - 如果实体是 `group` 或 `root` 类型，将调用 `this.group.export(nodeId)` 导出该分组下的所有节点。
   *    - 对于其他类型的实体，将调用 `this.getEntityInfo(entity)` 导出该实体的信息。
   * 3. 处理资源的可用性（`availability`），并根据时间范围调整动画的开始和结束时间。如果没有可用性信息，则默认使用 `2000-01-01`。
   * 4. 构造动画对象 `animation`，包括节点的数量、子节点数据、版本信息等。
   * 5. 返回包含导出数据的动画对象，该对象可以被其他应用或系统使用。
   *
   * 数据来源：12138
   */
  export(nodeId) {
    let nodes = [];
    if (nodeId == null) {
      const plottingList = this.plotting.getPlottingToList();
      const captionList = this.captions.getCaptionToList();
      const audioList = this.audio.getAudioToList();
      const videoList = this.video.getVideoToList();
      const cameraList = this.camera.getCameraList();
      const groupList = this.group.getGroupToList();
      const textList = this.text.getTextToList();
      nodes = [
        ...plottingList,
        ...captionList,
        ...audioList,
        ...videoList,
        ...cameraList,
        ...textList,
        ...groupList,
      ];
    } else {
      const entity = this.getEntityById(nodeId);
      if (entity == null) {
        nodes = [];
      } else if (entity.type === "group" || entity.type === "root") {
        nodes = this.group.export(nodeId);
      } else {
        nodes = [this.getEntityInfo(entity)];
      }
    }

    const availability = this._getResourceAvailability();
    const animation = this.viewer._userData;
    if (availability == null) {
      animation.startTime = "2000-01-01 00:00:00";
      animation.endTime = "2000-01-01 00:00:00";
    } else {
      const split = availability.split("/");
      animation.startTime = split[0].replace("T", " ").replace("Z", "");
      animation.endTime = split[1].replace("T", " ").replace("Z", "");
    }
    animation.count = nodes.length;
    animation.children = nodes;

    animation.version = "2.0.0";
    animation.remark = "CesiumHelper Export File";
    animation.date = dateUtils.parseDateToString(
      "yyyy-MM-dd HH:mm:ss",
      new Date()
    );
    return animation;
  }

  /**
   * 加载实体
   *
   * 该函数根据传入的实体数据加载不同类型的实体，并返回一个 Promise，指示加载操作的异步执行。
   * 它支持加载图像、模型、河流、地点、边界、情景、粒子、道路、字幕、音频、视频、文本、相机、分组等实体类型。
   *
   * @param {Object} item - 包含实体数据的对象，包括类型、时间范围等信息。
   * @returns {Promise} - 返回一个 Promise，当加载完成时解决对应的实体加载操作。
   *
   * 功能说明：
   * 1. 设置实体的 `availability` 属性，格式化 `startTime` 和 `endTime` 为 ISO 8601 格式。
   * 2. 为 `groupId` 属性设置默认值，如果没有传入 `groupId`，则使用根实体的 ID 作为默认值。
   * 3. 根据 `item.type` 的不同类型，调用不同的加载方法：
   *    - `image`, `model`, `river`, `place`, `boundary`, `situation`, `particle`, `road`：调用 `this.plotting.showPlottingForData(item)` 加载绘图相关实体。
   *    - `captions`：调用 `this.captions.loadCaptions(item)` 加载字幕。
   *    - `audio`：调用 `this.audio.loadAudioOption(item)` 加载音频。
   *    - `video`：调用 `this.video.loadVideoOption(item)` 加载视频。
   *    - `text`：调用 `this.text.loadTextOption(item)` 加载文本。
   *    - `camera`：调用 `this.camera.loadCameraOption(item)` 加载相机设置。
   *    - `root`, `group`：调用 `this.group.loadGroupForData(item)` 加载分组实体。
   * 4. 如果类型不匹配，返回一个拒绝的 Promise。
   *
   * 数据来源：12138
   */
  loadEntity(item) {
    item.availability =
      dateUtils.parseDateToString(
        "yyyy-MM-ddTHH:mm:ssZ",
        new Date(item.startTime)
      ) +
      "/" +
      dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", item.endTime);
    item.groupId = item.groupId || this.viewer.root.id;
    switch (item.type) {
      case "image":
      case "model":
      case "river":
      case "place":
      case "boundary":
      case "situation":
      case "particle":
      case "road":
        return new Promise((resolve) =>
          resolve(this.plotting.showPlottingForData(item))
        );
      case "captions":
        return new Promise((resolve) =>
          resolve(this.captions.loadCaptions(item))
        );
      case "audio":
        return new Promise((resolve) =>
          resolve(this.audio.loadAudioOption(item))
        );
      case "video":
        return new Promise((resolve) =>
          resolve(this.video.loadVideoOption(item))
        );
      case "text":
        return new Promise((resolve) =>
          resolve(this.text.loadTextOption(item))
        );
      case "camera":
        return new Promise((resolve) =>
          resolve(this.camera.loadCameraOption(item))
        );
      case "root":
      case "group":
        return new Promise((resolve) =>
          resolve(this.group.loadGroupForData(item))
        );
      default:
        return new Promise((reject) => reject(null));
    }
  }

  /**
   * 渲染资源信息 根据 Json
   *
   * 该函数根据传入的 JSON 格式的动画数据，渲染并加载资源信息，包括所有子节点和动画设置。
   * 它支持兼容处理数组和对象的导入，并加载与资源相关的实体。
   *
   * @param {Object | Array} animation - 动画信息的 JSON 数据，可以是单个对象或对象数组。
   * @returns {Promise} - 返回一个 Promise，当所有资源加载完成后解决。
   *
   * 功能说明：
   * 1. 检查 `animation` 是对象还是数组，确保可以正确处理。
   * 2. 如果 `animation` 是对象，提取其 `children` 属性，并更新 `this.viewer._userData` 中的相关数据。
   * 3. 将 `animationNodes` 数组中过滤掉 `root` 类型的节点，并根据每个节点的 `groupId` 关联其父节点。
   * 4. 为每个有效节点调用 `this.loadEntity(value)` 加载实体，并将所有的 Promise 存储在 `promiseList` 中。
   * 5. 使用 `Promise.all()` 等待所有加载操作完成，完成后更新资源的时间信息，并通过 `resolve()` 返回加载结果。
   * 6. 如果加载失败，捕获错误并通过 `reject()` 返回错误。
   *
   * 数据来源：12138
   */
  loadSourceFromJson(animation) {
    let animationNodes = [];
    // 兼容数组和对象导入
    if (animation instanceof Array) {
      animationNodes = animation;
    } else {
      animationNodes = animation.children;
      delete animation["children"];
      Object.assign(this.viewer._userData, animation);
    }

    const promiseList = [];
    const filter = animationNodes.filter((p) => p.type !== "root");
    const eMap = new Map(filter.map((item) => [item.id, item]));
    for (const [, value] of eMap) {
      const parent = eMap.get(value.groupId);
      value.groupId = parent ? value.groupId : this.viewer.root.id;
      promiseList.push(this.loadEntity(value));
    }
    return new Promise((resolve, reject) => {
      Promise.all(promiseList)
        .then((list) => {
          /** 更新资源 */
          this.setCurrentTime(
            dateUtils.julianDateToIso8601(this.viewer.clock.currentTime)
          );
          /** 标记要改 */
          resolve(list);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  /**
   * 场景导出为 blob 流
   *
   * 该函数将当前场景的画布内容导出为一个 Blob 流格式的 PNG 图片，便于下载或保存。
   * 它通过将画布转换为数据 URL，并将其转化为 Blob 流，以实现下载操作。
   *
   * @returns {Blob} - 返回包含场景图像数据的 Blob 对象，可以用于下载或进一步处理。
   *
   * 功能说明：
   * 1. 调用 `viewer.render()` 确保当前场景已渲染完成。
   * 2. 获取渲染后的画布对象，使用 `canvas.toDataURL()` 将其转换为 PNG 格式的图片数据 URL。
   * 3. 将数据 URL 转换为 Blob 流：
   *    - 通过 `atob()` 解码 base64 编码的图像数据。
   *    - 将解码后的字节数据存储在 `Uint8Array` 中。
   * 4. 创建一个 `Blob` 对象，指定 MIME 类型，并返回该 Blob 对象。
   * 5. 该 Blob 对象可以直接用于下载或其他需要图像数据的操作。
   *
   * 数据来源：12138
   */
  save2blob() {
    const _viewer = this.viewer;
    // 不写会导出为黑图
    _viewer.render();
    let canvas = _viewer.scene.canvas;
    let image = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    let arr = image.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {
      type: mime,
    });
  }

  /**
   * 获取所有资源总时间范围
   *
   * 该函数获取当前场景中所有资源的时间范围（从开始时间到结束时间），并返回一个格式化的时间区间。
   * 它筛选出有效资源并计算它们的最早和最晚的时间，最终返回一个 ISO 8601 格式的时间范围。
   *
   * @returns {string | null} - 返回一个字符串，表示资源的时间范围，如 "2023-01-01T00:00:00Z/2023-12-31T23:59:59Z"，如果没有有效资源则返回 `null`。
   *
   * 功能说明：
   * 1. 从 `viewer.resource` 获取所有资源，过滤掉 `group` 和 `root` 类型的实体。
   * 2. 如果没有有效资源，则返回 `null`。
   * 3. 使用 `reduce()` 方法分别计算资源的最早和最晚时间。
   * 4. 格式化 `startTime` 和 `endTime` 为 ISO 8601 时间格式，并返回以 `/` 分隔的时间区间。
   *
   * 数据来源：12138
   */
  _getResourceAvailability() {
    const list = Array.from(this.viewer.resource.values()).filter(
      (p) => p.type !== "group" && p.type !== "root"
    );
    if (list.length === 0) return null;
    const start = list.reduce((pre, cur) =>
      new Date(pre.startTime).getTime() > new Date(cur.startTime).getTime()
        ? cur
        : pre
    );
    const end = list.reduce((pre, cur) =>
      new Date(pre.endTime).getTime() > new Date(cur.endTime).getTime()
        ? pre
        : cur
    );
    return (
      start.startTime.replace(" ", "T") +
      "Z/" +
      end.endTime.replace(" ", "T") +
      "Z"
    );
  }

  /**
   * 实体拖动事件
   *
   * 该函数实现了在场景中通过鼠标拖动实体的功能。通过监听鼠标事件，能够拖动选中的实体，并更新其位置。
   * 它利用 `Cesium.ScreenSpaceEventHandler` 来处理鼠标点击、拖动和释放事件，确保实体可以在场景中交互式地移动。
   *
   * 功能说明：
   * 1. 当鼠标左键按下时，通过 `viewer.scene.pick()` 获取当前鼠标位置处的实体。
   * 2. 如果选中的实体是有效的，并且是 `Cesium.Entity` 类型，禁用场景的输入事件，使得用户无法同时操作场景视图。
   * 3. 在鼠标移动时，如果选中了实体，则根据鼠标位置更新实体的位置。实体的位置会更新到鼠标指向的地理位置。
   * 4. 当鼠标左键释放时，重新启用场景的输入事件，并结束实体的拖动操作。
   *
   * 注意：
   * - 该事件支持拖动 `model`、`billboard` 和 `label` 类型的实体，不支持 `polyline` 和 `polygon` 类型。
   * - 该功能会暂时禁用相机控制器输入，以确保用户在拖动实体时不会干扰相机视角。
   *
   * 数据来源：12138
   */
  _moveEvent() {
    const handler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );

    // 初始化 pickedObject
    let pickedObject = null;

    // 当鼠标左键按下时，获取当前鼠标位置处的对象
    handler.setInputAction((click) => {
      pickedObject = this.viewer.scene.pick(click.position);
      if (
        Cesium.defined(pickedObject) &&
        pickedObject.id instanceof Cesium.Entity
      ) {
        // 禁用场景的输入事件
        this.viewer.scene.screenSpaceCameraController.enableInputs = false;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 当鼠标移动时，拖动选中的实体
    handler.setInputAction((movement) => {
      if (
        Cesium.defined(pickedObject) &&
        pickedObject.id instanceof Cesium.Entity
      ) {
        const move = pickedObject ? pickedObject.id.move : false;
        if (
          move &&
          (pickedObject.id.model ||
            pickedObject.id.billboard ||
            pickedObject.id.label) &&
          !pickedObject.id.polyline &&
          !pickedObject.id.polygon
        ) {
          const windowPosition = new Cesium.Cartesian2(
            movement.endPosition.x,
            movement.endPosition.y
          );
          const pickRay = this.viewer.camera.getPickRay(windowPosition);
          const cartesian = this.viewer.scene.globe.pick(
            pickRay,
            this.viewer.scene
          );
          pickedObject.id.position.setValue(cartesian);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 当鼠标左键释放时，停止拖动
    handler.setInputAction(() => {
      if (
        Cesium.defined(pickedObject) &&
        pickedObject.id instanceof Cesium.Entity
      ) {
        // 启用场景的输入事件
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;
        pickedObject = null;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  /**
   * 跳转到实体所在位置
   */
  jumpToEntity(info) {
    if (
      info.type === "image" ||
      info.type === "model" ||
      info.type === "tag" ||
      info.type === "particle" ||
      info.type === "place"
    ) {
      this.flyToEntity(info.position);
    } else if (info.type === "situation") {
      if (info.geoType === "TextBox" || info.geoType === "Flag") {
        this.flyToEntity(info.position);
        return;
      }
      const entity = this.getEntityById(info.id);
      let positions = [];
      // 处理线实体：只获取 polyline 的顶点
      if (entity.polyline)
        positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
      // 处理面实体：同时获取 polygon 的顶点
      if (entity.polygon)
        positions = entity.polygon.hierarchy.getValue(
          Cesium.JulianDate.now()
        ).positions;
      this.flyToEntity(positions);
    } else if (
      info.type === "river" ||
      info.type === "boundary" ||
      info.type === "road"
    ) {
      const Container = [];
      const entitys = this.getEntityById(info.id);
      //获取分段实体并添加到集合中
      entitys.children.forEach((item) => {
        let line = item.polyline?.positions.getValue(Cesium.JulianDate.now());
        if (!line) {
          line = item.polygon.hierarchy.getValue(
            Cesium.JulianDate.now()
          ).positions;
        }
        Container.push(line);
      });
      this.flyToEntity(Container.flat());
    } else {
      console.log("该实体不支持跳转");
    }
  }

  /**
   * fly到实体所在位置
   */
  flyToEntity(positions) {
    if (!(typeof positions[0] === "object")) {
      positions[2] = 100000; //设置摄像机默认高度
      this.viewer.camera.flyTo({
        destination: plottingUtils.latitudeAndLongitudeToDegrees(positions), // 设置飞行目标为实体位置
        duration: 3, // 设置飞行时长为 2 秒
        easingFunction: Cesium.EasingFunction.LINEAR, // 线性过渡
      });
    } else {
      // 获取实体的包围球
      const boundingBox = this.calculateBoundingBox(positions);
      // 计算包围盒的中心点和半径
      const center = Cesium.Cartesian3.midpoint(
        boundingBox.minimum,
        boundingBox.maximum,
        new Cesium.Cartesian3()
      );
      const radius =
        Cesium.Cartesian3.distance(boundingBox.minimum, boundingBox.maximum) /
        2;
      // 使用 flyToBoundingSphere 调整相机视角
      this.viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(center, radius),
        {
          duration: 2, // 飞行时长，单位为秒
          offset: new Cesium.HeadingPitchRange(
            0.0,
            -Cesium.Math.PI_OVER_TWO,
            radius * 2.5
          ), // 调整相机偏移量
        }
      );
    }
  }

  /**
   * 计算线面包围盒
   */
  calculateBoundingBox(positions) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    positions.forEach((position) => {
      const x = position.x;
      const y = position.y;
      const z = position.z;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    });

    return {
      minimum: new Cesium.Cartesian3(minX, minY, minZ),
      maximum: new Cesium.Cartesian3(maxX, maxY, maxZ),
    };
  }

  /**
   * 绑定单击事件
   *
   * 该函数用于绑定鼠标左键单击事件，通过 `Cesium.ScreenSpaceEventHandler` 监听鼠标点击事件。
   * 当用户点击场景中的某个对象时，触发一系列操作，包括设置当前激活的实体和触发对应的实体激活事件。
   *
   * 功能说明：
   * 1. 当鼠标左键点击时，使用 `viewer.scene.pick()` 获取当前点击位置的实体对象。
   * 2. 如果点击的对象是一个有效的实体，调用 `setActiveEntity` 方法更新当前激活的实体。
   * 3. 遍历存储的激活事件函数 `activateEntityEventMap`，并为每个函数传递点击事件和当前选中的实体对象，触发实体激活事件。
   *
   * 注意：
   * - 该方法会绑定到鼠标左键单击事件，当用户点击场景中的对象时，激活该对象并触发相关事件。
   * - 激活事件的处理函数可以自定义，允许用户对不同类型的实体进行不同的响应。
   *
   * 数据来源：12138
   */
  _clickEvent() {
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((click) => {
      let pickedObject = this.viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject)) {
        // 触发实体激活状态改变事件
        this.setActiveEntity(pickedObject.id);
        Array.from(this.activateEntityEventMap.values()).forEach((func) =>
          func(click, pickedObject.id)
        );
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * 绑定右键菜单事件
   *
   * 该函数用于绑定鼠标右键菜单事件，通过 `Cesium.ScreenSpaceEventHandler` 监听右键点击事件。
   * 当用户右键点击场景中的实体时，会触发一个自定义的右键菜单事件处理函数。
   * 另外，还会对某些特定的 DOM 元素（如文本或视频元素）绑定自定义右键菜单。
   *
   * 功能说明：
   * 1. 使用 `Cesium.ScreenSpaceEventHandler` 监听右键点击事件，并调用 `viewer.scene.pick()` 获取点击位置的实体。
   * 2. 如果点击位置有效，调用 `contextmenuEvent` 函数处理右键菜单事件，传递点击事件和实体对象。
   * 3. 对于特定的 DOM 元素（如类名为 `cesium-helper-text` 或 `cesium-helper-video` 的元素），
   *    通过监听浏览器的 `contextmenu` 事件，防止默认右键菜单，触发自定义右键菜单事件。
   *
   * 注意：
   * - 该方法为右键点击绑定事件处理函数，使得用户可以在点击场景中的实体时打开自定义右键菜单。
   * - 还会处理特定元素的右键菜单行为，允许自定义操作。
   *
   * 数据来源：12138
   */
  _contextmenuEvent() {
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((click) => {
      let pickedObject = this.viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject)) {
        // 触发实体激活状态改变事件
        this.contextmenuEvent(click, pickedObject.id);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    document.addEventListener("contextmenu", (event) => {
      const target = event.target;
      if (
        target.className !== "" &&
        (target.className === "cesium-helper-text" ||
          target.className === "cesium-helper-video")
      ) {
        event.preventDefault();
        const entity = this.getEntityById(target.dataset.id);
        if (entity != null)
          this.contextmenuEvent(
            { position: { x: event.x, y: event.y } },
            entity
          );
      }
    });
  }

  /** 工具内置通用方法 */

  /**
   * 屏幕坐标转经纬度
   *
   * 该方法用于将屏幕上的鼠标点击位置（屏幕坐标）转换为经纬度（笛卡尔坐标系）。
   * 通过使用 Cesium 的 `globe.pick()` 方法和相机的拾取射线，将鼠标位置映射到全球坐标系中，
   * 然后进一步转换为经纬度和高度信息。
   *
   * 功能说明：
   * 1. 通过传入的 `event` 参数，计算鼠标相对于 Cesium 容器的坐标。
   * 2. 将屏幕坐标转换为世界坐标系中的位置，获取经纬度和高度。
   * 3. 返回一个 Promise，异步返回经纬度和高度数组。
   *
   * 返回值：
   * - 一个包含经度、纬度和高度的数组 [longitude, latitude, height]。
   *
   * 注意：
   * - 该方法是通过 Cesium 的 `camera.getPickRay()` 和 `globe.pick()` 方法实现的坐标转换。
   * - 此功能通常用于获取用户点击的屏幕位置的地理信息，广泛用于地图交互功能中。
   *
   * 数据来源：12138
   */
  windowLocationToLatitudeAndLongitude(event) {
    return new Promise((resolve) => {
      const containerRect = this.cesiumContainer.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      const mouseY = event.clientY - containerRect.top;
      const windowPosition = new Cesium.Cartesian2(mouseX, mouseY);
      // 屏幕坐标转换为世界坐标
      const worldPosition = this.viewer.scene.globe.pick(
        this.viewer.camera.getPickRay(windowPosition),
        this.viewer.scene
      );
      if (Cesium.defined(worldPosition)) {
        // 获取经纬度和高度
        const cartographic =
          this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
            worldPosition
          );
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;
        resolve([longitude, latitude, height]);
      }
    });
  }
}

/** 导出 Cesium 工具类 */
export default CesiumHelper;
