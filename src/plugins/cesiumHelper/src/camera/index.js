import * as uuid from "../common/uuid"

const Cesium = window.Cesium

/**
 * 摄像头工具类
 *
 * 用于Cesium中实现摄像头移动、跳转、动作等方法
 * */
class Camera {

    /** 视图变量 */
    viewer = null

    /** 摄像头资源字典 */
    cameraMap = null

    /** 摄像头关键帧有序列表 */
    sortList = []

    /** 上一次激活相机数据 */
    preActiveData = null

    /** 构造方法 */
    constructor(viewer, supper) {
        this.viewer = viewer
        this.cameraMap = new Map()
        supper.player.addEventListener("change", "updateCamera", this.updateCamera.bind(this))
    }

    /**
     * @description: 添加摄像头
     *
     * 该方法用于添加一个新的摄像头对象到系统中。摄像头会根据当前的视角（位置和角度）进行初始化，并根据提供的选项设置相关属性。若有相同时间的关键帧，先删除已有的相机对象，再创建新的相机对象。
     *
     * 主要功能：
     * 1. 获取当前摄像头的姿态（位置和角度）。
     * 2. 检查是否有相同时刻的摄像头关键帧，如果有，则删除该相机对象。
     * 3. 创建并设置新的摄像头对象的相关属性，包括唯一ID、名称、排序等。
     * 4. 将新摄像头对象存储到 `cameraMap` 中，并将其转换为 JSON 格式存储在 `viewer.resource` 中。
     * 5. 对摄像头列表进行排序，确保顺序一致。
     *
     * @param {Object} options - 配置项对象，包含新摄像头的属性。
     * @param {string} options.id - 摄像头的唯一标识符，如果未提供则自动生成。
     * @param {string} options.availability - 摄像头的可用时间区间。
     * @param {Object} options.data - 摄像头的数据，具体内容由调用者提供。
     * @param {number} options.sort - 排序字段，控制摄像头的显示顺序。
     *
     * @returns {Object} 返回新添加的摄像头对象的相关信息，包括ID、名称、类型等。
     *
     * 数据来源：
     * - `this.viewer.root.id`: 用于设置摄像头的组ID，表示该摄像头隶属于哪个根节点。
     * - `this.getCurrentCameraAttitude()`: 获取当前视角的摄像头位置和角度。
     * - `this.cameraMap`: 存储所有摄像头对象的映射。
     *
     * 过程：
     * 1. 使用 `getCurrentCameraAttitude()` 获取当前摄像头的位置信息和角度。
     * 2. 使用 `_checkKeyframeTimeRepeat()` 检查是否有相同时间的关键帧，如果有则删除。
     * 3. 使用提供的选项（如 `availability`、`data`、`sort` 等）创建摄像头对象。
     * 4. 将新的摄像头对象加入到 `cameraMap` 中，并调用 `getCameraToJson()` 转换为 JSON 格式存储。
     * 5. 最后通过 `_sortSourceList()` 对摄像头列表进行排序，保持顺序一致。
     *
     * 优化：
     * - 自动生成ID，如果未提供 `id` 则通过 `uuid.uuid()` 生成一个唯一的ID。
     * - 在添加新摄像头前，先检查是否存在相同时间的摄像头对象，并进行删除，避免重复添加。
     *
     * 此方法适用于需要动态添加摄像头并确保摄像头列表顺序的场景，尤其在处理多个摄像头对象时，能够有效管理其状态和顺序。
     */

    /** 添加摄像头 */
    addCamera(options) {
        return new Promise((resolve, reject) => {
            const camera = this.getCurrentCameraAttitude()
            const id = options.id || uuid.uuid()
            /** 判断摄像头有无相同时刻的关键帧 */
            const same = this._checkKeyframeTimeRepeat(options.availability)
            if (same) reject("存在重复的关键帧")
            else {
                const temp = {
                    id: id,
                    name: this._getDefaultName(),
                    type: "camera",
                    groupId: this.viewer.root.id,
                    data: options.data,
                    sort: options.sort || 1,
                    show: true,
                    availability: options.availability,
                    position: camera.position,
                    angle: camera.angle
                }
                this.cameraMap.set(id, temp)
                this.viewer.resource.set(id, this.getCameraToJson(temp))
                /** 排序相机列表 */
                this._sortSourceList()
                this.preActiveData = null
                resolve(temp)
            }
        })
    }

    /**
     * @description: 编辑摄像头
     *
     * 该方法用于编辑已存在的摄像头对象的属性。通过传入摄像头ID和一个包含新属性的选项对象，更新摄像头的相关信息，并在更新后对摄像头列表进行排序。
     *
     * 主要功能：
     * 1. 根据给定的摄像头ID查找对应的摄像头对象。
     * 2. 根据传入的选项更新摄像头的属性，支持更新名称、数据、排序、组ID、位置、可用时间区间以及角度。
     * 3. 如果可用时间（`availability`）或角度（`angle`）发生变化，调用 `_sortSourceList()` 对摄像头列表进行排序。
     * 4. 更新后，摄像头的最新信息将以 JSON 格式存储在 `viewer.resource` 中。
     *
     * @param {string} id - 要编辑的摄像头的唯一标识符。
     * @param {Object} options - 配置项对象，包含更新的摄像头属性。
     * @param {string} [options.name] - 摄像头的名称。
     * @param {Object} [options.data] - 摄像头的数据，具体内容由调用者提供。
     * @param {number} [options.sort] - 排序字段，控制摄像头的显示顺序。
     * @param {string} [options.groupId] - 摄像头所属组的ID。
     * @param {Object} [options.position] - 摄像头的位置，包含经纬度等信息。
     * @param {string} [options.availability] - 摄像头的可用时间区间。
     * @param {Object} [options.angle] - 摄像头的角度，包含俯仰角、航向角等信息。
     *
     * @returns {void} 无返回值，但会修改传入摄像头的属性并进行更新。
     *
     * 数据来源：
     * - `this.cameraMap`: 存储所有摄像头对象的映射，通过ID查找对应的摄像头对象。
     * - `this.getCameraToJson()`: 将更新后的摄像头对象转换为 JSON 格式，便于存储。
     *
     * 过程：
     * 1. 根据给定的 `id` 查找对应的摄像头对象。
     * 2. 使用选项对象中的属性更新摄像头对象，如果 `availability` 或 `angle` 属性发生变化，调用 `_sortSourceList()` 排序摄像头列表。
     * 3. 最终通过 `viewer.resource.set()` 更新摄像头对象的状态。
     *
     * 优化：
     * - 如果传入的选项中包含属性，则只更新这些属性，避免不必要的修改。
     * - 通过 `this._sortSourceList()` 确保每次修改后，摄像头列表都能够保持正确的顺序。
     *
     * 此方法适用于动态编辑摄像头属性的场景，尤其是在需要根据实时数据调整摄像头状态的应用中非常有用。
     */
    editCamera(id, options) {
        const camera = this.cameraMap.get(id)
        "name" in options && (camera.name = options.name)
        "data" in options && (camera.data = options.data)
        "sort" in options && (camera.sort = options.sort)
        "groupId" in options && (camera.groupId = options.groupId)
        "position" in options && (camera.position = options.position)
        if ("availability" in options) {
            camera.availability = options.availability
            this._sortSourceList()
        }

        if ("angle" in options) {
            camera.angle = options.angle
            this._sortSourceList()
        }

        this.preActiveData = null
        this.viewer.resource.set(id, this.getCameraToJson(camera))
    }

    /**
     * @description: 设置摄像头移动路径
     *
     * 该方法用于根据当前时间更新摄像头的状态，并在合适的时机触发摄像头的过渡效果。
     * 它会检查摄像头的可用时间区间，并在当前时间处于某个摄像头的时间区间内时，执行相应的过渡动画或操作。
     * 该方法通过异步执行来提高性能，避免在多个摄像头实体存在时出现卡顿现象。
     *
     * 主要功能：
     * 1. 根据传入的 `currentTime` 来更新当前激活的摄像头。
     * 2. 判断当前时间是否处于某个摄像头的可用时间区间内，若是，则触发摄像头的过渡。
     * 3. 优化性能，当摄像头数量过多时，避免遍历所有摄像头，通过记录上一次激活的摄像头实体来减少无效判断。
     * 4. 如果当前时间在某个摄像头的时间段内，更新 `preActiveData` 为当前激活的摄像头信息，并调用 `transitionCameraByNow` 进行过渡。
     *
     * @param {string} currentTime - 当前的时间，ISO8601格式的时间字符串（例如：`"2024-12-24T10:00:00Z"`）。
     *
     * @returns {void} 无返回值，但会更新摄像头的状态并触发过渡效果。
     *
     * 数据来源：
     * - `this.sortList`: 存储摄像头按时间排序后的列表，摄像头对象包含可用时间（`availability`）。
     * - `this.preActiveData`: 存储上一次激活的摄像头及其时间段，用于性能优化，避免多次遍历所有摄像头。
     *
     * 过程：
     * 1. 将 `currentTime` 转换为 `Cesium.JulianDate` 对象，用于与摄像头的可用时间进行比较。
     * 2. 判断当前时间是否超过了最后一个摄像头的时间段，若超过则跳过更新。
     * 3. 如果存在激活的摄像头数据（`preActiveData`），检查是否在激活时间段内，若是，则跳转到当前摄像头。
     * 4. 遍历所有摄像头列表，检查当前时间是否在某个摄像头的可用时间段内，若是，则更新 `preActiveData` 并调用 `transitionCameraByNow` 执行过渡。
     *
     * 优化：
     * - 通过 `preActiveData` 缓存上一次激活的摄像头，避免重复遍历所有摄像头，提高性能。
     * - 采用 `setTimeout` 来实现异步执行，避免阻塞主线程，提高性能。
     *
     * 适用场景：
     * - 用于动态调整和过渡摄像头路径，适用于需要根据时间控制摄像头切换的应用场景。
     * - 当摄像头数量较多时，通过优化减少不必要的遍历操作，提升性能。
     */
    updateCamera(currentTime) {
        // 处于性能考虑，异步执行
        setTimeout(() => {
            currentTime = Cesium.JulianDate.fromIso8601(currentTime)
            // 获取镜头中最后一个镜头 判断镜头最大时间
            if (this.sortList.length === 0) return;
            const lastCamera = this.sortList[this.sortList.length - 1]
            const endTime = Cesium.JulianDate.fromIso8601(lastCamera.availability);
            if (Cesium.JulianDate.compare(currentTime, endTime) > 0) return;
            // 该方法当摄像头变多时会导致视角延迟（遍历太多）
            // 可以每次记录激活摄像头实体 每次先判断激活实体是否处于当前时间
            // 如果在就跳转 不在就遍历
            if (this.preActiveData) {
                const camera = this.preActiveData.camera
                const pCamera = this.preActiveData.preCamera
                const index = this.preActiveData.index
                const times = camera.availability;
                const startTime = Cesium.JulianDate.fromIso8601(pCamera.availability);
                const endTime = Cesium.JulianDate.fromIso8601(times);
                if (Cesium.JulianDate.compare(currentTime, endTime) <= 0 && Cesium.JulianDate.compare(currentTime, startTime) > 0) {
                    this.transitionCameraByNow(pCamera, camera, currentTime, index)
                    return
                }
            }
            for (let i = 0; i < this.sortList.length; i++) {
                const camera = this.sortList[i];
                const pCamera = this._getPreKeyFrameCamera(i)
                const times = camera.availability;
                const startTime = Cesium.JulianDate.fromIso8601(pCamera.availability);
                const endTime = Cesium.JulianDate.fromIso8601(times);
                // 如果当前时间在这一段事件内
                if (Cesium.JulianDate.compare(currentTime, endTime) < 0 && Cesium.JulianDate.compare(currentTime, startTime) >= 0) {
                    this.preActiveData = {
                        preCamera: pCamera,
                        camera: camera,
                        index: i
                    }
                    this.transitionCameraByNow(pCamera, camera, currentTime, i)
                    return
                }
            }
            this.preActiveData = null
        }, 0)
    }

    /**
     * @description: 摄像头过渡到当前时间
     *
     * 该方法用于根据当前时间对摄像头进行过渡，并判断采用默认过渡方式或绕点旋转过渡方式。
     *
     * 两种过渡方式：
     * 1. **默认过渡**：从上一关键帧平滑过渡到下一点位，适用于常规的摄像头切换。
     * 2. **绕点旋转**：根据摄像头的当前姿态（`angle.look`）绕指定点位旋转，适用于需要环绕某个目标或点位旋转的场景。
     *
     * 方法首先判断摄像头是否具备 `lookAt` 属性来决定是采用哪种过渡方式，并根据当前时间计算出需要更新的摄像头属性。
     *
     * @param {object} pCamera - 上一个关键帧的摄像头数据，包含位置、角度等信息。
     * @param {object} camera - 当前需要过渡到的摄像头数据，包含位置、角度等信息。
     * @param {Cesium.JulianDate} currentTime - 当前的时间，`Cesium.JulianDate` 类型，用于判断是否处于某个时间区间。
     * @param {number} index - 当前摄像头在排序列表中的索引，用于判断是否为第一个关键帧。
     *
     * @returns {void} 无返回值，但会更新摄像头的视角和状态。
     *
     * 功能：
     * 1. **绕点旋转**：
     *    - 如果摄像头数据中存在 `lookAt` 属性，则说明摄像头需要绕指定点旋转。
     *    - 调用 `_rotatingByPoint` 方法计算摄像头的绕点旋转参数，并通过 `viewer.camera.lookAt` 设置新的视角。
     *    - 通过 `lookAtTransform` 重置摄像头的变换矩阵，避免影响其他操作。
     *
     * 2. **默认过渡**：
     *    - 如果当前是第一个关键帧，则使用 `viewer.camera.setView` 直接设置摄像头视角。
     *    - 否则，调用 `_defaultTransition` 方法计算默认过渡的参数，并使用 `setView` 方法平滑过渡到新的摄像头位置。
     *
     * 数据来源：
     * - `pCamera`: 上一个关键帧的摄像头数据，包含位置和角度。
     * - `camera`: 当前关键帧的摄像头数据。
     * - `currentTime`: 当前时间，用于判断是否需要过渡到当前时间对应的摄像头。
     *
     * 过程：
     * 1. 判断 `camera.angle.look` 是否存在，以决定使用绕点旋转还是默认过渡。
     * 2. 若存在 `lookAt`，调用 `_rotatingByPoint` 进行绕点旋转。
     * 3. 若不存在 `lookAt`，判断是否为第一个关键帧，若是，则直接设置视角；否则，通过 `setView` 进行默认过渡。
     *
     * 优化：
     * - 通过区分绕点旋转与默认过渡，支持更加灵活的摄像头动画效果。
     * - 通过 `setView` 和 `lookAt` 方法的适当使用，确保过渡过程平滑、准确。
     *
     * 适用场景：
     * - 用于动态控制摄像头路径，适用于需要根据时间过渡的摄像头动画效果。
     * - 适用于复杂的场景，例如需要根据时间或其他条件切换视角的动画。
     */

    /**
     * 摄像头过渡到当前时间
     *
     * 摄像头过渡方式应分为两种
     * 1. 默认过渡 即从上一默认点平滑过渡到下一点位
     * 2. 绕点旋转 即根据摄像头当前姿态 ，环绕点位来进行绕点旋转
     *
     * 所以应在逻辑中做出判断 如果摄像头是否具备 lookAt属性
     * */
    transitionCameraByNow(pCamera, camera, currentTime, index) {
        // 如果当前摄像头姿态中存在 look 属性
        // 如果存在，则说明摄像头是绕点旋转，反之则是默认过渡
        if (camera.angle.look) {
            // 获取绕点旋转对应点位
            const cameraAttr = this._rotatingByPoint(pCamera, camera, currentTime)
            // 摄像头朝向
            this.viewer.camera.lookAt(cameraAttr.position, cameraAttr.offset);
            // 重置摄像头朝向
            this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
        } else {
            // 计算第一个关键帧的摄像机姿态
            if (index === 0) {
                this.viewer.camera.setView({
                    destination: Cesium.Cartesian3.fromDegrees(...camera.position),
                    orientation: {
                        heading: camera.angle.head,
                        pitch: camera.angle.pitch,
                        roll: camera.angle.roll
                    }
                });
                return;
            }
            // 获取默认过渡的点位
            const cameraAttr = this._defaultTransition(pCamera, camera, currentTime)
            // 然后使用这些向量来设置相机的 orientation
            this.viewer.camera.setView(cameraAttr);
        }
    }

    /**
     * @description: 获取上一关键帧时的摄像机信息
     *
     * 该方法用于根据当前关键帧的索引，获取上一关键帧的摄像机信息。摄像机信息包括位置和角度。
     *
     * 如果当前关键帧是第一个关键帧，则返回初始时间（"2000-01-01T00:00:00Z"）和当前摄像机的姿态（位置和角度）。
     * 如果不是第一个关键帧，则返回排序列表中当前索引前一个位置的摄像机信息。
     *
     * @param {number} index - 当前关键帧的索引，用于确定上一关键帧的位置。
     *
     * @returns {object} 返回一个包含以下字段的对象：
     *   - `availability`: 当前关键帧的可用时间，如果是第一帧，则返回 "2000-01-01T00:00:00Z"。
     *   - `position`: 摄像头的当前位置。
     *   - `angle`: 摄像头的角度信息（包括朝向、俯仰、滚转角度）。
     *
     * 功能：
     * - 该方法通过索引判断当前是否为第一个关键帧，若是，则返回初始的时间和摄像机姿态；若不是，则返回前一个关键帧的摄像机信息。
     *
     * 适用场景：
     * - 用于动态更新摄像机路径，确保摄像机的过渡是基于正确的前一个关键帧。
     * - 适用于需要通过摄像头历史信息进行平滑过渡的动画效果。
     */

    /**
     * 获取上一关键帧时的摄像机信息
     *
     * @param index 当前关键帧索引
     * */
    _getPreKeyFrameCamera(index) {
        // 如果当前为第一帧  则获取项目开始时间以及当前摄像机姿态
        if (index === 0) {
            const attr = this.getCurrentCameraAttitude();
            return {
                availability: "2000-01-01T00:00:00Z",
                position: attr.position,
                angle: attr.angle
            }
        }
        return this.sortList[index - 1]
    }

    /**
     * @description: 默认过渡
     *
     * 该方法实现从上一关键帧的位置平滑过渡到下一关键帧的位置，适用于需要平滑过渡摄像机视角的场景。
     *
     * 通过插值计算当前位置和角度，以确保摄像机在关键帧之间的过渡是平滑的。
     * - 计算当前位置的插值，根据系统当前时间确定过渡进度。
     * - 插值方向，通过四元数（Quaternion）计算过渡过程中的旋转，保证摄像机角度的平滑变化。
     *
     * @param {object} preCamera - 上一关键帧摄像机的数据（包括位置和角度）。
     * @param {object} camera - 当前关键帧摄像机的数据（包括位置和角度）。
     * @param {Cesium.JulianDate} time - 当前系统时间，用于计算过渡的时间进度。
     *
     * @returns {object} 返回一个包含以下字段的对象：
     *   - `destination`: 过渡后的位置。
     *   - `orientation`: 过渡后的旋转姿态，包括朝向、俯仰和滚转。
     *
     * 功能：
     * - 通过 `Cesium.JulianDate.secondsDifference` 计算当前时间在两帧时间段中的插值进度。
     * - 计算当前位置和角度的插值，确保过渡过程中摄像机位置和角度的平滑变化。
     * - 使用 `Cesium.Quaternion.slerp` 进行平滑的角度插值，避免角度跳变。
     *
     * 适用场景：
     * - 用于动态过渡场景中的摄像机视角，确保摄像机在关键帧之间的自然移动。
     * - 适用于需要平滑过渡摄像头视角，避免突兀的视角变化。
     */

    /**
     * 默认过渡
     *
     * 从上一默认点平滑过渡到下一点位
     * @param preCamera {*} 上一点位相机 json数据
     * @param camera {*} 当前点位相机 json数据
     * @param time {Cesium.JulianDate} 当前系统时间
     * @return {destination, orientation} 摄像机姿态和位置
     * */
    _defaultTransition(preCamera, camera, time) {
        const startTime = Cesium.JulianDate.fromIso8601(preCamera.availability);
        const endTime = Cesium.JulianDate.fromIso8601(camera.availability);
        // 计算时间在时间段中的插值比
        const timeFraction = Cesium.JulianDate.secondsDifference(time, startTime) / Cesium.JulianDate.secondsDifference(endTime, startTime);

        // 插值位置
        const startPosition = Cesium.Cartesian3.fromDegrees(...preCamera.position);
        const endPosition = Cesium.Cartesian3.fromDegrees(...camera.position);
        const position = Cesium.Cartesian3.lerp(startPosition, endPosition, timeFraction, new Cesium.Cartesian3());

        // 插值方向
        const startHPR = new Cesium.HeadingPitchRoll(preCamera.angle.head, preCamera.angle.pitch, preCamera.angle.roll);
        const endHPR = new Cesium.HeadingPitchRoll(camera.angle.head, camera.angle.pitch, camera.angle.roll);

        const startOrientation = Cesium.Quaternion.fromHeadingPitchRoll(startHPR, new Cesium.Quaternion());
        const endOrientation = Cesium.Quaternion.fromHeadingPitchRoll(endHPR, new Cesium.Quaternion());

        // 四元组
        const slerpedOrientation = Cesium.Quaternion.slerp(startOrientation, endOrientation, timeFraction, new Cesium.Quaternion());
        // HeadingPitchRoll标题
        const finallyHeadingPitch = Cesium.HeadingPitchRoll.fromQuaternion(slerpedOrientation)

        return {
            destination: position,
            orientation: {
                heading: finallyHeadingPitch.heading,
                pitch: finallyHeadingPitch.pitch,
                roll: finallyHeadingPitch.roll
            }
        }
    }

    /**
     * @description: 绕点旋转
     *
     * 该方法实现摄像机绕指定中心点进行旋转，通过计算摄像机与目标点之间的偏移量，实现绕点旋转的效果。
     * 旋转过程是通过计算摄像机相对于中心点的角度和位置，并基于时间来平滑旋转。
     *
     * @param {object} preCamera - 上一关键帧摄像机的数据（包括位置和角度）。
     * @param {object} camera - 当前关键帧摄像机的数据（包括位置和角度）。
     * @param {Cesium.JulianDate} time - 当前系统时间，用于计算旋转进度。
     *
     * @returns {object} 返回一个包含以下字段的对象：
     *   - `position`: 旋转中心的位置（`Cesium.Cartesian3` 类型）。
     *   - `offset`: 摄像机的偏移量（`Cesium.HeadingPitchRange` 类型），包括摄像机的朝向、俯仰角度以及与中心点的距离。
     *
     * 功能：
     * - 计算摄像机与旋转中心点的距离，并根据摄像机的角度计算其位置。
     * - 根据当前时间的进度（相对于摄像机的可用时间段），计算摄像机旋转的角度。
     * - 使用 `Cesium.HeadingPitchRange` 来设置摄像机的朝向、俯仰角度和距离。
     *
     * 适用场景：
     * - 用于摄像机绕着某个点进行旋转，通常应用于观察一个目标或景物。
     * - 适用于需要实现平滑环绕旋转效果的场景，比如展示物体的 360 度视图。
     */

    /**
     * 绕点旋转
     *
     * 根据摄像头当前姿态，环绕点位来进行绕点旋转
     * @param preCamera {*} 上一点位相机 json 数据
     * @param camera {*} 当前点位相机 json 数据
     * @param time {*} 当前系统时间
     * @return result {position: Cesium.Cartesian3, offset: Cesium.HeadingPitchRange} 中心点和偏转位置
     */
    _rotatingByPoint(preCamera, camera, time) {

        const startTime = Cesium.JulianDate.fromIso8601(preCamera.availability);
        const endTime = Cesium.JulianDate.fromIso8601(camera.availability);

        // 定义中心点
        const center = camera.angle.look;

        // 计算摄像头到中心点平面距离
        let centerPosition = Cesium.Cartesian3.fromDegrees(center[0], center[1]);
        const cameraPosition = Cesium.Cartesian3.fromDegrees(...camera.position);
        const distance = Cesium.Cartesian2.distance(Cesium.Cartesian2.fromCartesian3(cameraPosition), Cesium.Cartesian2.fromCartesian3(centerPosition));

        // 计算摄像头当前角度与中心点 Z轴 交线距离
        const deg = 180 * camera.angle.pitch / Math.PI + 90
        const radius = distance / Math.sin(deg * Math.PI / 180)
        const tempH = radius * Math.cos(deg * Math.PI / 180)
        centerPosition = Cesium.Cartesian3.fromDegrees(center[0], center[1], camera.position[2] - tempH);

        // 定义旋转速度（每秒完成的旋转角度）
        const rotationSpeed = Cesium.Math.toRadians(360); // 例如，每秒旋转10度

        // 根据当前时间计算相机经度位置以实现匀速旋转
        const elapsedTime = Cesium.JulianDate.secondsDifference(time, startTime) / Cesium.JulianDate.secondsDifference(endTime, startTime);
        const rotationAngle = rotationSpeed * elapsedTime;

        const heading = camera.angle.head + rotationAngle
        const pitch = camera.angle.pitch

        // 计算新的摄像机位置
        let offset = new Cesium.HeadingPitchRange(heading, pitch, radius);

        return {
            position: centerPosition,
            offset: offset
        }
    }

    /**
     * @description: 获取上一个镜头实体
     *
     * 该方法用于返回当前镜头（`currentCamera`）之前的一个镜头实体。
     * 它通过查找当前镜头在镜头列表中的位置，然后返回其前一个镜头实体。
     * 如果当前镜头是第一个镜头或不存在前一个镜头，则返回 `null`。
     *
     * @param {object} currentCamera - 当前镜头实体对象，通常包含 `id` 等标识信息。
     *
     * @returns {object|null} 返回当前镜头前一个镜头实体对象。如果没有前一个镜头，返回 `null`。
     *
     * 功能：
     * - 查找镜头列表中的当前镜头。
     * - 返回其前一个镜头实体，或者返回 `null` 如果没有前一个镜头。
     *
     * 适用场景：
     * - 用于镜头播放或过渡的场景中，在播放当前镜头的基础上，快速访问前一个镜头。
     * - 适用于需要倒退或回放镜头的场景。
     */

    /** 获取上一个镜头实体 */
    getPreviousCamera(currentCamera) {
        const index = this.sortList.findIndex(item => item.id === currentCamera.id)
        if (index <= 0) return null
        return this.sortList[index - 1]
    }

    /**
     * @description: 根据 id 获取相机
     *
     * 该方法用于通过相机的唯一标识符（`id`）从 `cameraMap` 中获取相应的相机实体。
     * 如果 `cameraMap` 中存在该 `id` 对应的相机，则返回该相机实体；如果不存在，则返回 `undefined`。
     *
     * @param {string} id - 相机的唯一标识符，通常是字符串类型，用于在 `cameraMap` 中查找对应的相机。
     *
     * @returns {object|undefined} 返回与 `id` 对应的相机实体对象。如果没有找到对应的相机，返回 `undefined`。
     *
     * 功能：
     * - 查找并返回对应 `id` 的相机实体。
     * - 用于根据相机的唯一标识符在相机映射（`cameraMap`）中获取相机的详细信息。
     *
     * 适用场景：
     * - 用于根据相机的 `id` 查找并操作特定的相机实例。
     * - 在涉及相机切换、修改或获取特定相机数据的场景中，尤其在动态管理多个相机时非常有用。
     */

    /** 根据 id 获取相机 */
    getCameraById(id) {
        return this.cameraMap.get(id)
    }

    /**
     * @description: 根据 id 移除摄像头
     *
     * 该方法用于通过相机的唯一标识符（`id`）从 `cameraMap` 中移除对应的相机，并删除相关的资源。
     * 它还会在删除相机后重新排序相机列表，确保相机的顺序保持正确。
     *
     * @param {string} id - 相机的唯一标识符，用于在 `cameraMap` 中查找并删除对应的相机。
     *
     * @returns {void} 此方法不返回任何值。
     *
     * 功能：
     * - 从 `cameraMap` 中删除指定 `id` 的相机实体。
     * - 从 `viewer.resource` 中删除与该相机关联的资源。
     * - 调用 `_sortSourceList` 方法对相机列表进行排序，确保剩余的相机顺序正确。
     *
     * 适用场景：
     * - 用于动态删除某个特定的相机，通常在需要移除不再使用的相机时调用。
     * - 在管理多个相机的情况下，需要删除相机并保持相机顺序时使用。
     */

    /** 根据 id 移除摄像头 */
    removeById(id) {
        this.cameraMap.delete(id)
        this.viewer.resource.delete(id)
        this._sortSourceList()
    }

    /**
     * @description: 移除全部摄像头
     *
     * 该方法会从 `cameraMap` 中删除所有摄像头，并且清空与之相关的资源。
     * 它还会清空 `sortList`，以确保移除操作完成后相机列表没有任何剩余数据。
     *
     * @returns {void} 此方法不返回任何值。
     *
     * 功能：
     * - 遍历 `cameraMap` 中所有的相机，并逐一删除。
     * - 删除与每个相机对应的资源。
     * - 清空 `sortList` 数组，确保相机列表被完全移除。
     *
     * 适用场景：
     * - 当需要彻底清除所有摄像头时，可以使用此方法。
     * - 在场景重置或者重载过程中，移除所有相机并清理资源。
     */

    /** 移除全部摄像头 */
    removeAll() {
        for (let [id,] of this.cameraMap) {
            this.cameraMap.delete(id)
            this.viewer.resource.delete(id)
        }
        this.sortList = []
    }

    /**
     * @description: 将相机实体转换为 JSON 对象
     *
     * 该方法将一个相机实体对象转换为一个标准化的 JSON 格式，用于存储或传输。
     * 其中包括相机的基本信息，如 ID、名称、位置、角度等，且时间格式将被统一转换为字符串格式。
     *
     * @param {Object} entity - 相机实体对象，包含摄像头的各类信息。
     * @returns {Object} 返回一个包含相机数据的 JSON 对象。
     *
     * 具体字段：
     * - `id`: 相机的唯一标识符。
     * - `name`: 相机的名称。
     * - `type`: 固定值 "camera"，表示该实体是一个相机。
     * - `data`: 相机的附加数据（例如视角配置等）。
     * - `sort`: 相机的排序权重，用于控制显示顺序。
     * - `groupId`: 相机所属组的 ID。
     * - `position`: 相机的位置，以经纬度坐标表示。
     * - `startTime`: 相机有效时间段的开始时间，格式为字符串（替换为合适的时间格式）。
     * - `endTime`: 相机有效时间段的结束时间，格式为字符串（替换为合适的时间格式）。
     * - `show`: 布尔值，表示相机是否显示。
     * - `angle`: 包含相机角度（如航向、俯仰、滚转等）的对象。
     */

    getCameraToJson(entity) {
        const startTime = entity.availability.replace("T", " ").replace("Z", "")
        const endTime = entity.availability.replace("T", " ").replace("Z", "")

        return {
            id: entity.id,
            name: entity.name,
            type: "camera",
            data: entity.data,
            sort: entity.sort,
            groupId: entity.groupId,
            position: entity.position,
            startTime: startTime,
            endTime: endTime,
            show: entity.show,
            angle: entity.angle
        }
    }

    /**
     * @description: 获取所有相机的列表
     *
     * 该方法从 `cameraMap` 中提取所有相机数据，并将每个相机的数据通过 `getCameraToJson` 方法转换为标准化的 JSON 格式，最终返回一个包含所有相机数据的数组。
     *
     * @returns {Array} 返回一个包含所有相机的 JSON 对象的数组。
     *
     * 每个 JSON 对象包括以下字段：
     * - `id`: 相机的唯一标识符。
     * - `name`: 相机的名称。
     * - `type`: 固定值 "camera"，表示该实体是一个相机。
     * - `data`: 相机的附加数据（例如视角配置等）。
     * - `sort`: 相机的排序权重，用于控制显示顺序。
     * - `groupId`: 相机所属组的 ID。
     * - `position`: 相机的位置，以经纬度坐标表示。
     * - `startTime`: 相机有效时间段的开始时间，格式为字符串（替换为合适的时间格式）。
     * - `endTime`: 相机有效时间段的结束时间，格式为字符串（替换为合适的时间格式）。
     * - `show`: 布尔值，表示相机是否显示。
     * - `angle`: 包含相机角度（如航向、俯仰、滚转等）的对象。
     */

    getCameraList() {
        const result = []
        for (let [, value] of this.cameraMap) {
            result.push(this.getCameraToJson(value))
        }
        return result
    }

    /**
     * @description: 加载摄像头选项
     *
     * 该方法接收一个 `options` 对象作为参数，并将其转化为相机配置对象，随后将其添加到 `cameraMap` 中，并更新 `viewer.resource` 和相机列表的排序。
     * 该方法返回一个 `Promise`，在操作完成后解析为加载的相机对象。
     *
     * @param {Object} options - 包含相机配置的选项对象，包含以下字段：
     * - `id`: 相机的唯一标识符。
     * - `name`: 相机的名称。
     * - `data`: 可选，附加的自定义数据。
     * - `sort`: 可选，相机的排序权重，默认值为 `1`。
     * - `groupId`: 相机所属组的 ID。
     * - `availability`: 相机的可用时间段（格式：`"startTime/endTime"`）。
     * - `position`: 相机的位置（例如经纬度）。
     * - `angle`: 包含相机角度（例如航向、俯仰、滚转）的对象。
     *
     * @returns {Promise} 返回一个 `Promise`，解析为加载并处理后的相机配置对象。
     *
     * @example
     * loadCameraOption({
     *   id: 'camera1',
     *   name: 'Camera 1',
     *   availability: '2024-01-01/2024-12-31',
     *   position: [0, 0, 0],
     *   angle: { head: 0, pitch: 0, roll: 0 }
     * }).then(camera => {
     *   console.log('Loaded camera:', camera);
     * });
     */

    loadCameraOption(options) {
        return new Promise(resolve => {
            const availability = options.availability.split("/")[1]
            const temp = {
                id: options.id,
                name: options.name,
                type: "camera",
                show: true,
                data: options.data || null,
                sort: options.sort || 1,
                groupId: options.groupId,
                availability: availability,
                position: options.position,
                angle: options.angle
            }
            this.cameraMap.set(options.id, temp)
            this.viewer.resource.set(options.id, this.getCameraToJson(temp))
            this._sortSourceList()
            resolve(temp)
        })
    }

    /**
     * @description: 摄像头资源排序
     *
     * 该方法用于对 `cameraMap` 中的相机资源进行排序，排序依据是相机的 `availability` 时间。排序的目的是确保相机资源按照时间顺序排列，方便后续处理。
     *
     * @private
     * @method _sortSourceList
     *
     * @example
     * // 假设有多个相机资源在 cameraMap 中，此方法会对它们进行时间排序
     * this._sortSourceList();
     */

    /** 摄像头资源排序 */
    _sortSourceList() {
        const cameraList = Array.from(this.cameraMap.values())
        cameraList.sort((a, b) => {
            return Cesium.JulianDate.compare(Cesium.JulianDate.fromIso8601(a.availability), Cesium.JulianDate.fromIso8601(b.availability))
        })
        this.sortList = cameraList;
    }

    /**
     * @description: 判断是否有相同时间段的摄像头资源
     *
     * 该方法用于检查 `sortList` 中是否已经存在与传入的 `keyframeTime` 时间相同的相机资源。如果存在，返回该相机资源；否则返回 `false`。
     *
     * @private
     * @method _checkKeyframeTimeRepeat
     * @param {string} keyframeTime - 需要检查的时间段，ISO 8601 格式的时间字符串。
     * @returns {Object|boolean} 如果找到了相同时间段的摄像头资源，则返回该相机对象，否则返回 `false`。
     *
     * @example
     * // 假设需要检查是否已有该时间段的摄像头资源
     * const camera = this._checkKeyframeTimeRepeat('2024-12-24T12:00:00Z');
     * if (camera) {
     *   console.log('找到了相同时间段的摄像头资源:', camera);
     * } else {
     *   console.log('没有找到该时间段的摄像头资源');
     * }
     */

    /** 判断有无该时间段的 摄像头资源 */
    _checkKeyframeTimeRepeat(keyframeTime) {
        for (const value of this.sortList) {
            const temp1 = Cesium.JulianDate.fromIso8601(value.availability)
            const temp2 = Cesium.JulianDate.fromIso8601(keyframeTime)
            if (Cesium.JulianDate.compare(temp1, temp2) === 0) {
                return value
            }
        }
        return false
    }

    /** 在资源中 获取一时间点的上一个点 */
    // _getKeyframeTimeLastTime(keyframeTime) {
    //     let lastTime = "2000-01-01T00:00:00Z"
    //     for (let i = 0; i < this.sortList.length; i++) {
    //         const value = this.sortList[i]
    //         const temp1 = Cesium.JulianDate.fromIso8601(value.availability)
    //         const temp2 = Cesium.JulianDate.fromIso8601(keyframeTime)
    //         if (Cesium.JulianDate.compare(temp1, temp2) < 0) {
    //             lastTime = dateUtils.julianDateToIso8601(temp1)
    //         } else {
    //             break
    //         }
    //     }
    //     return lastTime.substring(0, 19)
    // }
    /**
     * @description: 获取当前摄像头的姿态信息和位置
     *
     * 该方法返回当前摄像头的位置和姿态信息，包括：
     * - 摄像头的位置（经度、纬度、高度）
     * - 摄像头的朝向（航向角 `heading`、俯仰角 `pitch`、滚转角 `roll`）
     *
     * 这些信息可以用于记录当前相机的状态，或者在动态过渡、回放等应用中使用。
     *
     * @method getCurrentCameraAttitude
     * @returns {Object} 包含位置和角度信息的对象：
     *   - `position`: 摄像头的地理位置，包括经度、纬度和高度
     *   - `angle`: 摄像头的姿态，包括航向角、俯仰角和滚转角
     *
     * @example
     * // 获取当前摄像头姿态和位置
     * const cameraAttitude = this.getCurrentCameraAttitude();
     * console.log('位置:', cameraAttitude.position); // [经度, 纬度, 高度]
     * console.log('角度:', cameraAttitude.angle);   // { head: 航向, pitch: 俯仰, roll: 滚转 }
     */

    /**
     * 获取摄像头当前姿态
     * */
    getCurrentCameraAttitude() {

        // 获取 相机姿态信息
        const head = this.viewer.scene.camera.heading;
        const pitch = this.viewer.scene.camera.pitch;
        const roll = this.viewer.scene.camera.roll;

        // 获取位置 wgs84的地心坐标系，x,y坐标值以弧度来表示
        const position = this.viewer.scene.camera.positionCartographic //with longitude and latitude expressed in radians and height in meters.
        const longitude = Cesium.Math.toDegrees(position.longitude).toFixed(6)
        const latitude = Cesium.Math.toDegrees(position.latitude).toFixed(6)
        const height = position.height

        return {
            position: [parseFloat(longitude), parseFloat(latitude), height],  // 经纬度
            angle: {'head': head, 'pitch': pitch, 'roll': roll}
        }
    }

    /**
     * @description: 获取默认摄像头名称
     *
     * 该方法生成一个默认的摄像头名称，格式为 "摄像头" + 序号，其中序号是根据当前摄像头列表的长度自动生成的。
     *
     * 例如，如果当前已有3个摄像头，则生成的名称为 "摄像头004"。
     *
     * @method _getDefaultName
     * @returns {string} 返回默认的摄像头名称
     *
     * @example
     * // 获取默认摄像头名称
     * const defaultName = this._getDefaultName();
     * console.log(defaultName); // "摄像头004"
     */

    /**
     * 获取默认名称
     * */
    _getDefaultName() {
        return "摄像头" + ("000" + (this.sortList.length + 1)).substr(-3);
    }
}


export default Camera
