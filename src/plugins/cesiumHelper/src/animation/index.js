const Cesium = window.Cesium;
import * as plottingUtils from "../common/plottingUtils";

class Animation {
  viewer = null;

  supper = null;

  // 闪烁实体id数组
  flickerEntity = {};
  // 旋转实体id数组
  rotateEntity = {};
  // 缩放实体id数组
  scaleEntity = {};

  constructor(viewer, supper) {
    this.viewer = viewer;
    this.supper = supper;
    this.viewer.animations = new Map([
      ["flicker", new Map()],
      ["rotate", new Map()],
      ["scale", new Map()],
      ["autoRotate", new Map()],
      ["targetLine", new Map()],
      ["trackLine", new Map()],
      ["growthLine", new Map()],
      /** 其他动画在这里进行初始化 */
    ]);

    supper.player.addEventListener(
      "change",
      "updateTime",
      this.updateTime.bind(this)
    );
  }

  /**
   * @description: 系统时间变化时执行相关动画或逻辑处理
   *
   * 该方法会根据系统时间 `currentTime` 更新与时间相关的动画效果。它会检查所有动画类型（如闪烁、旋转、缩放、自动旋转、目标线、轨迹线和生长线），并根据时间判断是否执行相应的动画。
   *
   * 主要流程：
   * 1. 将传入的 `currentTime` 转换为 `Cesium.JulianDate` 对象。
   * 2. 异步执行更新逻辑，以优化性能。
   * 3. 遍历所有动画类型，根据当前时间判断该动画是否需要执行，执行相应的动画操作。
   * 4. 对于每种动画，判断是否满足 `availability` 范围内的时间，并根据条件执行动画或移除动画。
   * 5. 特别处理一些动态属性（如生长线的动态更新），确保其按需更新或静态化。
   *
   * 详细说明：
   * - `currentTime`：当前系统时间，ISO8601 格式字符串。用来判断每个动画是否在其可用时间内。
   * - 使用 `Cesium.JulianDate` 对象来处理时间，确保时间计算精度。
   * - `flickerAnimation`、`rotateAnimation`、`scaleAnimation`、`autoRotateAnimation` 等方法是具体的动画处理函数，根据动画类型执行相应的效果。
   *
   * 方法执行后，会根据时间动态控制动画的开启与关闭。
   *
   * 示例：
   * ```javascript
   * updateTime("2024-12-24T12:00:00Z");
   * ```
   * 上述代码会根据传入的时间更新相关的动画。
   *
   * @param {string} currentTime 当前时间，ISO8601 格式的时间字符串。
   */
  /** 系统时间改变 执行相关逻辑*/
  updateTime(currentTime) {
    currentTime = Cesium.JulianDate.fromIso8601(currentTime);
    for (const [, item] of Array.from(this.viewer.animations.get("flicker"))) {
      const flickerT = item.animation.flicker;
      if (!item || !flickerT) continue;
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        if (!this.flickerEntity[item.id]) {
          this.flickerEntity[item.id] = true;
          this.flickerAnimation(item, flickerT * 1000);
        }
      } else {
        delete this.flickerEntity[item.id];
      }
    }
    for (const [, item] of Array.from(this.viewer.animations.get("rotate"))) {
      const rotateT = item.animation.rotate;
      if (!item || !rotateT) continue;
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        if (!this.rotateEntity[item.id]) {
          this.rotateEntity[item.id] = true;
          this.rotateAnimation(item, rotateT * 1000);
        }
      } else {
        delete this.rotateEntity[item.id];
      }
    }
    for (const [, item] of Array.from(this.viewer.animations.get("scale"))) {
      const scaleT = item.animation.scale;
      if (!item || !scaleT) continue;
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        if (!this.scaleEntity[item.id]) {
          this.scaleEntity[item.id] = true;
          this.scaleAnimation(item, scaleT * 1000);
        }
      } else {
        delete this.scaleEntity[item.id];
      }
    }
    for (const [, item] of Array.from(
      this.viewer.animations.get("autoRotate")
    )) {
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        this.autoRotateAnimation(item);
      }
    }
    for (const [, item] of Array.from(
      this.viewer.animations.get("targetLine")
    )) {
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        this.targetLineAnimation(item);
      } else {
        if (!item.targetLine) return;
        this.viewer.entities.removeById(item.targetLine.id);
        delete item.targetLine;
      }
    }
    for (const [, item] of Array.from(
      this.viewer.animations.get("trackLine")
    )) {
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        this.trackLineAnimation(item);
      } else {
        if (!item.trackLine) return;
        this.viewer.entities.removeById(item.trackLine.id);
        delete item.trackLine;
      }
    }
    for (const [, item] of Array.from(
      this.viewer.animations.get("growthLine")
    )) {
      if (
        item.availability &&
        Cesium.TimeInterval.contains(item.availability, currentTime)
      ) {
        this.setGrowthLineDuration(item);
      } else {
        if (!(item.polyline.positions instanceof Cesium.CallbackProperty))
          return;
        item.polyline.positions = item.polyline.positions.getValue(
          Cesium.JulianDate.now()
        ); //将动态值改为静态
      }
    }
  }

  /**
   * @description: 实现实体的闪烁动画
   *
   * 该方法通过定时器周期性地切换实体的显示状态，从而实现实体的闪烁效果。闪烁的持续时间由 `flickerTime` 参数控制，单位为毫秒。闪烁结束后，实体恢复到初始显示状态。该功能常用于高亮显示或者警告提示等视觉效果。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型的对象，用于进行闪烁动画的实体。
   * @param {number} flickerTime 实体闪烁的持续时间，单位为毫秒，通常为 1000 毫秒 (1 秒)。闪烁效果将在 `flickerTime` 毫秒后结束并恢复到实体的初始显示状态。
   *
   * 数据来源：
   * - 实体的 `show` 属性来自 `Cesium.Entity` 对象，用于控制实体在场景中的可见性。实体的初始可见性状态为 `true` 或 `false`。
   * - `setInterval` 和 `setTimeout` 用于控制闪烁的时间和周期。
   *
   * 实现步骤：
   * 1. 获取实体的当前显示状态 `show`，以便在闪烁动画结束后恢复显示。
   * 2. 使用 `setInterval` 定时器每 200 毫秒切换一次实体的显示状态（即显示和隐藏交替）。
   * 3. 在 `flickerTime` 毫秒后，使用 `setTimeout` 停止定时器，恢复实体的初始显示状态。
   *
   * 闪烁动画的实际效果通过定时改变实体的 `show` 属性来实现，这样可以控制实体的显隐切换。
   */
  /**
   * 闪烁动画
   *
   * @param {*} entity  实体id
   * @param {*} flickerTime  实体闪烁持续时间 1000毫秒
   */
  flickerAnimation(entity, flickerTime) {
    const show = entity.show;
    entity["animation_flicker"] = setInterval(() => {
      entity.show = !entity.show;
    }, 200);
    setTimeout(() => {
      clearInterval(entity["animation_flicker"]);
      delete entity["animation_flicker"];
      entity.show = show;
    }, Math.abs(flickerTime));
  }

  /**
   * @description: 实现实体的旋转动画
   *
   * 该方法通过定时器实现实体的旋转效果，旋转的持续时间由 `rotateTime` 参数控制，单位为毫秒。旋转动画会在指定时间内自动执行并且循环，直到结束。旋转动画结束后，实体将恢复到初始状态。该功能常用于动态展示、旋转标识或者模型旋转等视觉效果。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型的对象，旋转动画将作用于该实体。
   * @param {number} rotateTime 旋转的持续时间，单位为毫秒，通常为 1000 毫秒 (1 秒)。旋转效果将在 `rotateTime` 毫秒后结束，并恢复实体到初始角度。
   *
   * 数据来源：
   * - 实体的 `billboard` 属性来自 `Cesium.Entity` 对象，`billboard` 用于定义实体的图标、图像和旋转状态。
   * - 旋转角度通过 `Cesium.Math.toRadians()` 转换角度到弧度。
   * - `setInterval` 定时器用于按一定时间间隔逐渐增加旋转角度。
   * - `setTimeout` 定时器用于在指定时间后停止旋转并恢复原始状态。
   *
   * 实现步骤：
   * 1. 检查实体的类型，只有 `image` 类型的实体会执行旋转动画。如果实体类型不符合要求，返回。
   * 2. 使用 `setInterval` 定时器每 10 毫秒增加一定的旋转角度，控制旋转速度。
   * 3. 如果实体的 `billboard` 存在，更新其 `rotation` 属性，逐步旋转实体。
   * 4. 在 `rotateTime` 毫秒后，使用 `setTimeout` 停止旋转，恢复实体的初始旋转角度为 0。
   *
   * 旋转动画的实际效果是通过定时更新 `billboard.rotation` 属性实现的，控制实体在指定的时间内平滑旋转。
   */
  /**
   * 旋转动画
   *
   * @param {*} entity  实体id
   * @param {*} rotateTime  实体旋转持续时间 1000毫秒
   */
  rotateAnimation(entity, rotateTime) {
    const allow = ["image"];
    if (allow.indexOf(entity.type) === -1) return;
    let angle = 0;
    entity["animation_rotate"] = setInterval(() => {
      // 旋转逻辑
      angle += (360 * 10) / 500;
      if (entity.billboard)
        entity.billboard.rotation = Cesium.Math.toRadians(angle);
    }, 10);
    setTimeout(() => {
      clearInterval(entity["animation_rotate"]);
      delete entity["animation_rotate"];
      if (entity.billboard)
        entity.billboard.rotation = Cesium.Math.toRadians(0);
    }, rotateTime);
  }

  /**
   * @description: 实现实体的缩放动画
   *
   * 该方法通过定时器实现实体的缩放效果，缩放动画的持续时间由 `scaleTime` 参数控制，单位为毫秒。缩放动画将在指定的时间内执行，并且会周期性地缩放实体，直到动画结束。结束后，实体会恢复到初始大小（即原始缩放比例为 1）。此功能常用于实现物体的动态放大或缩小效果，适用于视觉交互中的动态展示或动画效果。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型的对象，缩放动画将作用于该实体。
   * @param {number} scaleTime 缩放的持续时间，单位为毫秒，通常为 1000 毫秒（即 1 秒）。缩放效果将在 `scaleTime` 毫秒后结束，并恢复实体到初始缩放比例。
   *
   * 数据来源：
   * - 实体的 `billboard` 属性来自 `Cesium.Entity` 对象，`billboard` 用于定义实体的图标、图像以及缩放状态。
   * - `setInterval` 定时器用于在一定时间间隔内动态计算缩放比例。
   * - `setTimeout` 定时器用于在指定时间后停止缩放并恢复实体到初始缩放值。
   *
   * 实现步骤：
   * 1. 检查实体的类型，只有 `image` 类型的实体会执行缩放动画。如果实体类型不符合要求，则直接返回。
   * 2. 使用 `setInterval` 定时器每 10 毫秒计算一个新的缩放比例，计算公式为：`1 + Math.abs(Math.sin(count * Math.PI / (500 / 10)))`，该公式会生成一个平滑的、周期性的缩放效果。
   * 3. 如果实体的 `billboard` 存在，更新其 `scale` 属性，从而实现实体的缩放动画。
   * 4. 在 `scaleTime` 毫秒后，使用 `setTimeout` 停止缩放动画，并将实体的 `scale` 恢复到默认值 `1`，即原始大小。
   *
   * 缩放动画的实际效果是通过定时更新 `billboard.scale` 属性实现的，控制实体在指定时间内进行平滑的缩放过渡。
   */
  /**
   * 缩放动画
   *
   * @param {*} entity  实体id
   * @param {*} scaleTime  实体缩放持续时间 1000毫秒
   */
  scaleAnimation(entity, scaleTime) {
    const allow = ["image"];
    if (allow.indexOf(entity.type) === -1) return;
    let count = 0;
    entity["animation_scale"] = setInterval(() => {
      // 旋转逻辑
      const scale = 1 + Math.abs(Math.sin((count * Math.PI) / (500 / 10)));
      count++;
      if (entity.billboard) entity.billboard.scale = scale;
    }, 10);
    setTimeout(() => {
      clearInterval(entity["animation_scale"]);
      delete entity["animation_scale"];
      if (entity.billboard) entity.billboard.scale = 1;
    }, scaleTime);
  }

  /**
   * @description: 实现实体的自动旋转动画
   *
   * 该方法通过实时获取实体的位置变化来计算实体的旋转角度，并自动更新实体的旋转角度以实现旋转动画。动画的旋转角度基于实体当前位置与下一位置的经纬度差异来计算。通过此方法，可以使得实体根据其运动方向自动旋转，常用于动态物体（如车辆、飞机等）的视觉展示，使其朝向当前运动的方向。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型的对象，旋转动画将作用于该实体。实体需要具有 `position` 属性（一个 `Cesium.SampledPositionProperty` 类型的对象），以及 `billboard` 属性（用于显示实体的图标）。
   *
   * 数据来源：
   * - `entity.position.getValue(currentTime)` 用于获取当前时间点的实体位置，`position` 属性是一个 `Cesium.SampledPositionProperty` 类型的对象，可以返回基于时间的动态位置。
   * - `Cesium.JulianDate.addSeconds` 用于计算下一时刻的位置，通过当前时间 `currentTime` 和时间间隔（此处为 1 秒）获得。
   * - `Cesium.Cartographic.fromCartesian` 将笛卡尔坐标（`Cartesian3`）转换为经纬度坐标（`Cartographic`），用于计算经纬度差异。
   * - `Math.atan2` 用于计算从当前位置到下一位置的方向角度，得到旋转所需的角度。
   *
   * 实现步骤：
   * 1. 获取当前时间点和下一时间点的位置（`currentPos` 和 `nextPos`）。通过 `Cesium.JulianDate.addSeconds` 来获取 1 秒后的时间点。
   * 2. 如果当前位置或下一位置为空，停止动画。
   * 3. 将当前位置和下一位置的笛卡尔坐标转换为经纬度（`fromCartographic` 和 `toCartographic`）。
   * 4. 计算经度和纬度的差异，使用 `Math.atan2` 来计算方向角度（即从当前位置到下一位置的方向）。
   * 5. 计算出旋转角度，并确保角度在 0 到 2π 之间（通过 `(angle + 2 * Math.PI) % (2 * Math.PI)`）。
   * 6. 如果实体存在 `billboard` 属性，更新其 `rotation` 属性，使实体朝向运动方向。
   *
   * 自动旋转动画的效果通过定时更新实体的旋转角度来实现，使得实体能够始终面朝其移动方向。
   */
  /**
   * 自动旋转动画
   * */

  autoRotateAnimation(entity) {
    const currentTime = this.viewer.clock.currentTime;
    const currentPos = entity.position.getValue(currentTime);
    const nextPos = entity.position.getValue(
      Cesium.JulianDate.addSeconds(currentTime, 1, new Cesium.JulianDate())
    );
    if (!currentPos || !nextPos) return;
    const fromCartographic = Cesium.Cartographic.fromCartesian(currentPos);
    const toCartographic = Cesium.Cartographic.fromCartesian(nextPos);
    const longitudeDifference =
      toCartographic.longitude - fromCartographic.longitude;
    const latitudeDifference =
      toCartographic.latitude - fromCartographic.latitude;
    const angleInRadians = Math.atan2(longitudeDifference, latitudeDifference);
    const heading = (angleInRadians + 2 * Math.PI) % (2 * Math.PI);
    if ("billboard" in entity) entity.billboard.rotation = -heading;
  }

  /**
   * @description: 设置生长线的动态效果
   *
   * 该方法为指定的实体设置一个“生长线”动画效果，通过动态显示一条折线的逐步生长。折线的点会根据动画的进度逐渐被显示出来，直到动画结束时，所有点都会被渲染。此效果常用于需要展示线路逐渐生成的场景，例如路径规划、轨迹绘制等场景。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型的对象，表示需要进行生长线效果的实体。实体需要具有 `polyline` 属性（包含路径点的 `positions`）以及 `availability` 属性（定义该实体的时间区间）。
   *
   * 数据来源：
   * - `entity.animation.growthLine` 提供动画的持续时间（生长时间），即生长线从开始到完全显示的时长。
   * - `entity.polyline.positions.getValue(Cesium.JulianDate.now())` 获取生长线完整的点集，`positions` 是一个 `Cesium.CallbackProperty` 类型的对象，包含生长线的所有点。
   * - `entity.availability.start` 获取实体动画的起始时间。
   * - `Cesium.JulianDate.secondsDifference(time, startTime)` 计算当前时间与动画起始时间之间的时间差，用于控制生长进度。
   * - `Math.min` 和 `Math.max` 确保进度值在 0 到 1 之间，避免出现不合理的进度值。
   *
   * 实现步骤：
   * 1. 获取 `growthLine` 动画时长，用于控制生长线的动画速度。
   * 2. 获取生长线的完整点集 `cartesianPositions`，即所有的路径点。
   * 3. 获取实体的 `availability` 属性，判断其是否包含有效的起始时间 `startTime`，如果没有有效的起始时间，则不执行动画。
   * 4. 使用 `Cesium.CallbackProperty` 创建动态更新 `positions` 的属性。这个属性根据当前时间（`time`）和 `startTime` 计算生长进度。
   * 5. 计算自动画开始时间起，已经过去的秒数，并根据动画时长 `growthDuration` 来计算生长进度 `progress`。
   * 6. 通过 `progress` 控制显示的点集数量，随着进度的增加，显示更多的折线点，直到所有点都显示完成。
   *
   * 动画的效果通过动态改变 `positions` 的值来实现，使得生长线逐步呈现出来，达到视觉上的“生长”效果。
   */

  /**
   * 设置生长线
   * @param entity 生长线实体
   */
  setGrowthLineDuration(entity) {
    const growthDuration = entity.animation.growthLine; // 动画时长
    const cartesianPositions = entity.polyline.positions.getValue(
      Cesium.JulianDate.now()
    ); // 获取完整的点集
    // 检查 availability 和 startTime 是否有效
    const startTime = entity.availability ? entity.availability.start : null;
    if (!startTime) return;
    // 使用 CallbackProperty 实现动态效果
    entity.polyline.positions = new Cesium.CallbackProperty((time) => {
      if (!time) return cartesianPositions; // 返回完整的点集，避免空值导致的渲染错误
      // 计算从开始时间起经过的秒数
      const elapsedSeconds = Cesium.JulianDate.secondsDifference(
        time,
        startTime
      );
      // 动画进度（确保在 [0, 1] 范围内）
      const progress = Math.min(
        1,
        Math.max(0, elapsedSeconds / growthDuration)
      );
      // 根据进度截取当前可见点
      const currentPositions = cartesianPositions.slice(
        0,
        Math.ceil(progress * cartesianPositions.length)
      );
      return currentPositions;
    }, false);
  }

  /**
   * @description: 目标线连接动画
   *
   * 该方法用于在 Cesium 中动态创建并更新一条目标线。目标线的起点是指定实体的当前位置，终点根据目标类型不同可为指定的点或其他实体的位置。目标线通过动画进行实时更新，确保目标线的起点和终点始终反映实体或目标点的位置变化。目标线通常用于表示动态跟踪路径或连接两个重要位置的轨迹。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型，表示需要进行目标线动画的实体。实体应具有 `position` 属性（表示当前位置），并且在 `animation.targetLine` 中指定目标线的相关动画配置。
   *
   * 数据来源：
   * - `entity.position.getValue(this.viewer.clock.currentTime)` 获取当前实体的位置（起点）。
   * - `entity.material.targetLine` 包含目标线的相关配置，如线宽、颜色等。
   * - `entity.animation.targetLine.type` 指定目标线的目标类型，可以是 `"point"` 或 `"entity"`。
   * - `entity.animation.targetLine.value` 用于指定目标点的经纬度（当目标类型为 `"point"` 时）或者目标实体的 ID（当目标类型为 `"entity"` 时）。
   * - `this.viewer.entities.getById(entity.animation.targetLine.value)?.position?.getValue(this.viewer.clock.currentTime)` 根据目标实体的 ID 获取目标实体的位置。
   *
   * 实现步骤：
   * 1. 获取实体当前位置 `currentPoint`。
   * 2. 根据目标线的配置判断目标线类型：
   *    - 如果目标类型是 `"entity"`，则获取目标实体的当前位置。
   *    - 如果目标类型是 `"point"`，则使用经纬度转换方法将目标点的经纬度转换为笛卡尔坐标。
   * 3. 如果目标线已经存在，更新其连接点（起点和终点）的位置。
   * 4. 如果目标线不存在，则创建目标线：
   *    - 创建一个新的 `Cesium.Entity`，并设置 `polyline` 属性，使用 `Cesium.CallbackProperty` 动态更新目标线的位置。
   *    - 设置目标线的材质（使用箭头材质）和宽度。
   * 5. 将目标线添加到场景中。
   *
   * 该动画的效果是不断更新目标线的起点和终点，从而动态展示两个位置之间的连接。通过此方法，可以实现动态跟踪路径或连接目标点的效果，适用于实时位置更新和追踪任务。
   */

  /**
   * 目标线连接
   * */
  targetLineAnimation(entity) {
    const currentPoint = entity.position.getValue(
      this.viewer.clock.currentTime
    );
    const targetLine = entity.material.targetLine;
    if (entity.targetLine) {
      entity.targetLine.connect[0] = currentPoint;
      // 如果目标为实体 则修改目标点位置
      if (entity.animation.targetLine.type === "entity") {
        entity.targetLine.connect[1] = this.viewer.entities
          .getById(entity.animation.targetLine.value)
          ?.position?.getValue(this.viewer.clock.currentTime);
      }
    } else {
      // 根据目标类型获取目标点
      const targetPoint =
        entity.animation.targetLine.type === "point"
          ? plottingUtils.latitudeAndLongitudeToDegrees(
              entity.animation.targetLine.value,
              false
            )
          : this.viewer.entities
              .getById(entity.animation.targetLine.value)
              ?.position?.getValue(this.viewer.clock.currentTime);
      const connectPoints = [currentPoint, targetPoint];
      // 定义目标线对象
      entity.targetLine = this.viewer.entities.add({
        connect: connectPoints,
        polyline: {
          positions: new Cesium.CallbackProperty(function () {
            return connectPoints;
          }, false),
          width: targetLine.width,
          // 设置轨迹线的弧度类型为直线
          arcType: Cesium.ArcType.NONE,
          material: new Cesium.PolylineArrowMaterialProperty(
            Cesium.Color.fromCssColorString(targetLine.color)
          ),
        },
      });
    }
  }

  /**
   * @description: 航迹线动画
   *
   * 该方法用于在 Cesium 中为实体动态创建并更新一条航迹线。航迹线的起点和终点将实时反映实体的位置信息，通过不断更新实体的当前位置来生成航迹。航迹线常用于表示实体的路径、移动轨迹或历史位置。
   *
   * @param {object} entity 实体对象，通常是 `Cesium.Entity` 类型，表示需要进行航迹线动画的实体。实体应具有 `position` 属性（表示当前位置）以及 `material.trackLine` 属性（定义航迹线的样式）。
   *
   * 数据来源：
   * - `entity.position.getValue(time, result)` 获取实体在特定时间点的位置信息。
   * - `pathPosition.addSample(time, position)` 将采样时间点和对应位置添加到 `SampledPositionProperty` 中。
   * - `pathPosition._property._values` 和 `pathPosition._property._times` 分别存储了采样点的坐标值和时间戳。
   * - `trackLine.width` 和 `trackLine.style` 定义航迹线的宽度和样式。
   * - `this._createLineStyle(trackLine.style, trackLine.color)` 用于设置航迹线的材质样式，通常为线条样式或颜色配置。
   *
   * 实现步骤：
   * 1. 检查实体是否已经存在航迹线。如果已存在，返回 `null`，不再进行处理。
   * 2. 创建一个 `Cesium.SampledPositionProperty` 对象，用于存储和管理实体位置信息的采样数据。
   * 3. 定义航迹线对象，设置 `polyline` 属性：
   *    - 使用 `Cesium.CallbackProperty` 动态计算和更新航迹线的位置，根据实体的位置随时间变化来更新路径。
   *    - 对于每个时间点，通过 `entity.position.getValue(time)` 获取实体当前位置，并将该位置添加到 `SampledPositionProperty` 中。
   *    - 获取并整理所有有效的采样点，生成航迹线的路径点。
   * 4. 设置航迹线的样式，包括线条的宽度、弧度类型（设置为直线）和材质样式（如颜色、类型等）。
   * 5. 将航迹线添加到场景中，确保实体的移动轨迹能够实时显示。
   *
   * 该方法实现了一个动态更新的航迹线，能够在 Cesium 中展示实体随时间变化的移动轨迹。通过此方法，可以实现实时的路径跟踪或历史轨迹展示效果。
   */

  /**
   * 航迹线
   * */
  trackLineAnimation(entity) {
    const trackLine = entity.material.trackLine;
    if (entity.trackLine) {
      return null;
    } else {
      // 创建采样位置属性对象，用于存储实体位置信息随时间变化的采样数据
      let pathPosition = new Cesium.SampledPositionProperty();
      // 定义轨迹线对象
      entity.trackLine = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty((time, result) => {
            if (!result) return;

            // 获取实体在给定时间的位置信息
            const position = entity.position.getValue(time, result);
            if (!position) return;

            // 将实体的位置信息添加到采样位置属性对象中
            pathPosition.addSample(time, position);

            // 获取采样数据
            const samples = pathPosition._property._values;
            const times = pathPosition._property._times;
            const pathPositions = [];

            // 将有效的采样点添加到路径位置数组中
            for (let i = 0; i < times.length; i++) {
              if (Cesium.JulianDate.compare(times[i], time) <= 0) {
                pathPositions.push(
                  new Cesium.Cartesian3(
                    samples[i * 3],
                    samples[i * 3 + 1],
                    samples[i * 3 + 2]
                  )
                );
              }
            }
            return pathPositions;
          }, false),
          width: trackLine.width,
          // 设置轨迹线的弧度类型为直线
          arcType: Cesium.ArcType.NONE,
          material: this._createLineStyle(trackLine.style, trackLine.color),
        },
      });
    }
  }

  /**
   * @description: 创建边框或线样式的材质
   *
   * 该方法用于根据不同的类型创建不同样式的线条或边框材质，支持实线、虚线和发光线等样式。通过传入不同的 `type`（线条类型）和 `color`（颜色）参数，用户可以灵活配置线条的外观。
   *
   * 支持的线条类型：
   * - 实线（solid）：简单的实线效果，颜色为传入的 `color` 值。
   * - 虚线（dashed）：由一系列虚线段组成，可以通过 `dashLength` 和 `dashPattern` 来控制虚线段的长度和模式。
   * - 发光线（glow）：具有发光效果的线条，发光强度可以通过 `glowPower` 属性调整，颜色由传入的 `color` 设置。
   *
   * @param {string} type 线条样式类型。支持的类型包括：
   * - "solid"：表示实线。
   * - "dashed"：表示虚线。
   * - "glow"：表示发光线。
   *
   * @param {string} color 颜色值，格式为 CSS 颜色字符串（如 `#FF0000` 或 `rgba(255,0,0,1)`）。
   *
   * @returns {Cesium.MaterialProperty|null} 返回相应的材质类型，适用于 `Cesium.Polyline` 或 `Cesium.Entity` 中的 `polyline.material` 属性。如果 `type` 参数不匹配任何已知类型，返回 `null`。
   *
   * 数据来源：
   * - `Cesium.Color.fromCssColorString(color)`：用于从 CSS 颜色字符串创建 `Cesium.Color` 对象，用于设置颜色。
   * - `Cesium.PolylineDashMaterialProperty`：用于创建虚线材质，提供 `color`、`dashLength` 和 `dashPattern` 等属性来控制虚线样式。
   * - `Cesium.PolylineGlowMaterialProperty`：用于创建发光材质，提供 `glowPower` 和 `color` 属性来控制发光效果和颜色。
   *
   * 实现步骤：
   * 1. 根据传入的 `type` 参数判断需要创建哪种类型的材质。
   * 2. 如果 `type` 为 "solid"，则返回一个实线的颜色材质。
   * 3. 如果 `type` 为 "dashed"，则创建并返回一个虚线材质，虚线的长度和模式可以通过 `dashLength` 和 `dashPattern` 参数进行配置。
   * 4. 如果 `type` 为 "glow"，则创建并返回一个发光线材质，发光强度通过 `glowPower` 设置，颜色通过 `color` 设置。
   * 5. 如果 `type` 不匹配上述类型，返回 `null`。
   *
   * 该方法可以应用于多种场景，例如绘制路径、边框或轨迹线等，并能够根据需求调整线条样式，使得线条具有不同的视觉效果。
   */

  /**
   * 创建边框或线样式 材质
   *
   * 实线、虚线、发光线
   * */
  _createLineStyle(type, color) {
    if (type === "solid") {
      return Cesium.Color.fromCssColorString(color);
    } else if (type === "dashed") {
      return new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString(color), // 设置虚线的颜色
        // gapColor:Cesium.Color.YELLOW,   //间隙颜色
        dashLength: 30.0, // 设置虚线段的长度
        dashPattern: 255.0, // 设置虚线的模式，这里使用一个8位二进制数来表示虚线和间隙
      });
    } else if (type === "glow") {
      return new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.fromCssColorString(color),
      });
    } else {
      return null;
    }
  }
}

export default Animation;
