const Cesium = window.Cesium

/**
 * 经纬度转笛卡尔坐标系
 *
 * @param {*} latitudeAndLongitude 经纬度坐标 [经度, 纬度, 高度]，如果高度不存在，则使用默认高度
 * @param {boolean} autoHeight 是否使用自动高度，若为 true，则会根据地形数据自动获取高度
 * @returns {Cesium.Cartesian3} 返回笛卡尔坐标系坐标 [x, y, z]
 *
 * @description
 * 1. 使用 Cesium 的 `Cartesion3.fromDegrees` 方法将经纬度坐标转换为笛卡尔坐标系的坐标。
 * 2. 输入的经纬度坐标包括经度（lng）、纬度（lat）和高度（height）。如果没有提供高度，则根据 `autoHeight` 标志决定是否自动获取高度。
 * 3. 高度的默认值为0，或者可以从地形数据（通过 `getHeightAtPosition` 函数）自动获取。
 * 4. 返回值是 Cesium 的 `Cartesian3` 对象，包含三个坐标值：`x`, `y`, 和 `z`。
 */

export function latitudeAndLongitudeToDegrees(latitudeAndLongitude, autoHeight) {
    const lng = latitudeAndLongitude[0]
    const lat = latitudeAndLongitude[1]
    const height = latitudeAndLongitude.length > 2 ? latitudeAndLongitude[2] : autoHeight ? getHeightAtPosition : 0
    return Cesium.Cartesian3.fromDegrees(lng, lat, height);
}
/**
 * 获取经纬度所在地高度
 *
 * @param {Array} point 经纬度数组 [longitude, latitude]
 * @returns {Promise<number>} 返回高度的 Promise
 *
 * @description
 * 1. 此函数接收一个包含经度和纬度的数组 `point`，并通过 Cesium 的 `Cartographic.fromCartesian` 方法将其转换为 `Cartographic` 对象。
 * 2. 然后调用 `Cesium.sampleTerrainMostDetailed` 方法，传入地形提供者（`terrainProvider`）来获取该位置的详细地形数据。
 * 3. `sampleTerrainMostDetailed` 会返回一个包含地形高度信息的数组，取第一个元素的 `height` 属性即为目标地点的高度。
 * 4. 该方法返回一个 `Promise` 对象，异步获取并返回对应的高度值。
 * 5. 高度值单位为米。
 */

function getHeightAtPosition(point) {
    return new Promise(resolve => {
        const cartographic = Cesium.Cartographic.fromCartesian(latitudeAndLongitudeToDegrees(point));
        // 调用 sampleTerrain 方法获取高度信息
        Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, [cartographic]).then(function (updatedPositions) {
            // const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            // const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            const height = updatedPositions[0].height;
            resolve(height)
        });
    })
}
/**
 * 经纬度转笛卡尔坐标
 *
 * @param {Object} position - 包含经度、纬度和高度的对象 { x, y, z }
 * @returns {Object} Cartesian3 - 转换后的笛卡尔坐标
 *
 * @description
 * 1. 此函数接收一个包含经度（x）、纬度（y）和高度（z）的 `position` 对象。
 * 2. 利用 Cesium 的 `Cartesian3.fromDegrees` 方法将经纬度坐标转换为笛卡尔坐标系（`Cartesian3`）表示的坐标。
 * 3. `Cesium.Ellipsoid.WGS84` 指定使用 WGS84 地球椭球体模型进行坐标转换。
 * 4. 如果 `position` 为空，则返回 `Cesium.Cartesian3.ZERO`，即笛卡尔坐标系中的零点。
 * 5. 返回的笛卡尔坐标为 `Cesium.Cartesian3` 类型的对象，包含三个坐标值：`x`、`y` 和 `z`。
 */

export function transformWGS84ToCartesian(position) {
    return position
        ? Cesium.Cartesian3.fromDegrees(
            position.x,
            position.y,
            position.z,
            Cesium.Ellipsoid.WGS84
        )
        : Cesium.Cartesian3.ZERO;
}

/**
 * 笛卡尔坐标转经纬度坐标
 *
 * @param {Object} cartesian - 笛卡尔坐标系中的坐标 [x, y, z]
 * @returns {Array} 经度、纬度和高度的数组 [longitude, latitude, height]
 *
 * @description
 * 1. 此函数接收一个包含笛卡尔坐标系坐标的 `cartesian` 对象（形式为 [x, y, z]）。
 * 2. 使用 `Cesium.Cartographic.fromCartesian` 方法将笛卡尔坐标转换为 `Cartographic` 对象。
 * 3. `Cesium.Math.toDegrees` 方法将 `Cartographic` 对象中的经度和纬度从弧度转换为度数。
 * 4. 返回的结果是一个包含经度、纬度和高度的数组 `[longitude, latitude, height]`，其中 `longitude` 和 `latitude` 为角度，`height` 为高度。
 */

export function degreesToLatitudeAndLongitude(cartesian) {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;
    return [longitude, latitude, height]
}

/**
 * 笛卡尔坐标转经纬度
 *
 * @param {Cesium.Cartesian3} cartesian - 笛卡尔坐标系中的坐标 [x, y, z]
 * @returns {Object} - 返回经纬度坐标 { x, y, z }
 *
 * @description
 * 1. 此函数接收一个 `cartesian` 对象（类型为 `Cesium.Cartesian3`，包含笛卡尔坐标系中的坐标 [x, y, z]）。
 * 2. 使用 `Cesium.Ellipsoid.WGS84.cartesianToCartographic` 方法将笛卡尔坐标转换为 `Cartographic` 对象。
 * 3. 将 `Cartographic` 对象中的经度和纬度从弧度转换为度数，使用 `Cesium.Math.toDegrees` 方法。
 * 4. 返回一个对象，包含转换后的经度 (`x`)，纬度 (`y`) 和高度 (`z`)。
 */

export function transformCartesianToWGS84(cartesian) {
    let ellipsoid = Cesium.Ellipsoid.WGS84;
    let cartographic = ellipsoid.cartesianToCartographic(cartesian);
    const x = Cesium.Math.toDegrees(cartographic.longitude);
    const y = Cesium.Math.toDegrees(cartographic.latitude);
    const z = cartographic.height;
    return {x, y, z};
}

/**
 * 获取屏幕点的笛卡尔坐标
 *
 * @param {Cesium.Viewer} viewer - 三维场景viewer对象，用于获取场景中的信息
 * @param {Object} px - 屏幕像素点，包含 `x` 和 `y` 坐标
 * @returns {Cesium.Cartesian3 | null} - 返回与屏幕点对应的笛卡尔坐标，若无法获取则返回 `null`
 *
 * @description
 * 1. 使用 `viewer.scene.drillPick` 方法在给定的屏幕像素点 `px` 位置执行拾取操作，检查是否点击了 3D Tiles 或模型。
 * 2. 如果点击的是 3D Tiles 或模型，直接返回 `viewer.scene.pickPosition(px)` 获取该位置的笛卡尔坐标。
 * 3. 如果没有点击 3D Tiles 或模型且场景中有地形，则通过射线拾取（`viewer.scene.camera.getPickRay`）获取地形上的位置。
 * 4. 如果没有点击 3D Tiles、模型或地形，且场景为无地形模式，使用 `pickEllipsoid` 获取在地球椭球体上的笛卡尔坐标。
 * 5. 返回计算得到的笛卡尔坐标或 `null`（如果没有有效的拾取结果）。
 */

export function getCatesian3FromPX(viewer, px) {
    let cartesian = null;
    let isOn3dtiles = false;
    let isOnTerrain = false;

    // 深度拾取方式
    let picks = viewer.scene.drillPick(px);

    for (let pick of picks) {
        if (pick) {
            if (pick.primitive instanceof Cesium.Cesium3DTileFeature) {
                // 处理3D Tiles的拾取
                isOn3dtiles = true;
                return viewer.scene.pickPosition(px);
            } else if (pick.primitive instanceof Cesium.Model) {
                // 处理模型的拾取
                isOn3dtiles = true;
                return viewer.scene.pickPosition(px);
            }
            // 可以继续添加其他类型的拾取判断
        }
    }

    let noTerrain =
        viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider; // 判断是否有地形

    // 在地形上拾取位置点
    if (!isOn3dtiles && !noTerrain) {
        let ray = viewer.scene.camera.getPickRay(px);
        if (!ray) return null;
        isOnTerrain = true;
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    }

    // 在普通地球上拾取位置点
    if (!isOn3dtiles && !isOnTerrain && noTerrain) {
        cartesian = viewer.scene.camera.pickEllipsoid(
            px,
            viewer.scene.globe.ellipsoid
        );
    }

    return cartesian;
}

