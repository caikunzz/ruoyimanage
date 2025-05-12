import toolTips from "../../cesiumHelper/src/common/reminderTip";
; if (typeof Cesium !== 'undefined')
    /**

    * @author zhangti
    * @param viewer  {object} 三维对象
    * @param options {object} 初始化参数
    * @constructor
    */
    Cesium.Measure = (function (Cesium) {

        /**
         * 绘制对象
         * @param viewer
         * @param options
         * @constructor
         */
        function _(viewer, options = {}) {

            if (viewer && viewer instanceof Cesium.Viewer) {

                this._drawLayer = new Cesium.CustomDataSource('measureLayer')

                viewer && viewer.dataSources.add(this._drawLayer)

                this._basePath = options.basePath || ''
                this.idContainer = []
                this._viewer = viewer
            }
        }
        _.prototype = {
            /***
             * 坐标转换 84转笛卡尔
             *
             * @param {Object} {lng,lat,alt} 地理坐标
             *
             * @return {Object} Cartesian3 三维位置坐标
             */
            transformWGS84ToCartesian: function (position, alt) {
                if (this._viewer) {
                    return position
                        ? Cesium.Cartesian3.fromDegrees(
                            position.lng || position.lon,
                            position.lat,
                            position.alt = alt || position.alt,
                            Cesium.Ellipsoid.WGS84
                        )
                        : Cesium.Cartesian3.ZERO
                }
            },
            /***
            * 坐标数组转换 笛卡尔转84
            *
            * @param {Array} WSG84Arr {lng,lat,alt} 地理坐标数组
            * @param {Number} alt 拔高
            * @return {Array} Cartesian3 三维位置坐标数组
            */
            transformWGS84ArrayToCartesianArray: function (WSG84Arr, alt) {
                if (this._viewer && WSG84Arr) {
                    var $this = this
                    return WSG84Arr
                        ? WSG84Arr.map(function (item) { return $this.transformWGS84ToCartesian(item, alt) })
                        : []
                }
            },
            /***
             * 坐标转换 笛卡尔转84
             *
             * @param {Object} Cartesian3 三维位置坐标
             *
             * @return {Object} {lng,lat,alt} 地理坐标
             */
            transformCartesianToWGS84: function (cartesian) {
                if (this._viewer && cartesian) {
                    var ellipsoid = Cesium.Ellipsoid.WGS84
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian)
                    return {
                        lng: Cesium.Math.toDegrees(cartographic.longitude),
                        lat: Cesium.Math.toDegrees(cartographic.latitude),
                        alt: cartographic.height
                    }
                }
            },
            /***
            * 坐标数组转换 笛卡尔转86
            *
            * @param {Array} cartesianArr 三维位置坐标数组
            *
            * @return {Array} {lng,lat,alt} 地理坐标数组
            */
            transformCartesianArrayToWGS84Array: function (cartesianArr) {
                if (this._viewer) {
                    var $this = this
                    return cartesianArr
                        ? cartesianArr.map(function (item) { return $this.transformCartesianToWGS84(item) })
                        : []
                }
            },
            /**
             * 84坐标转弧度坐标
             * @param {Object} position wgs84
             * @return {Object} Cartographic 弧度坐标
             *
             */
            transformWGS84ToCartographic: function (position) {
                return position
                    ? Cesium.Cartographic.fromDegrees(
                        position.lng || position.lon,
                        position.lat,
                        position.alt
                    )
                    : Cesium.Cartographic.ZERO
            },
            /**
           * 拾取位置点
           *
           * @param {Object} px 屏幕坐标
           *
           * @return {Object} Cartesian3 三维坐标
           */
            getCatesian3FromPX: function (px) {

                if (this._viewer && px) {
                    var picks = this._viewer.scene.drillPick(px)
                    var cartesian = null;
                    var isOn3dtiles = false, isOnTerrain = false;
                    // drillPick
                    for (let i in picks) {
                        let pick = picks[i]

                        if (pick &&
                            pick.primitive instanceof Cesium.Cesium3DTileFeature
                            || pick && pick.primitive instanceof Cesium.Cesium3DTileset
                            || pick && pick.primitive instanceof Cesium.Model) { //模型上拾取
                            isOn3dtiles = true;
                        }
                        // 3dtilset
                        if (isOn3dtiles) {
                            this._viewer.scene.pick(px) // pick
                            cartesian = this._viewer.scene.pickPosition(px);
                            if (cartesian) {
                                let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                                if (cartographic.height < 0) cartographic.height = 0;
                                let lon = Cesium.Math.toDegrees(cartographic.longitude)
                                    , lat = Cesium.Math.toDegrees(cartographic.latitude)
                                    , height = cartographic.height;
                                cartesian = this.transformWGS84ToCartesian({ lng: lon, lat: lat, alt: height })

                            }
                        }
                    }
                    // 地形
                    let boolTerrain = this._viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
                    // Terrain
                    if (!isOn3dtiles && !boolTerrain) {
                        var ray = this._viewer.scene.camera.getPickRay(px);
                        if (!ray) return null;
                        cartesian = this._viewer.scene.globe.pick(ray, this._viewer.scene);
                        isOnTerrain = true
                    }
                    // 地球
                    if (!isOn3dtiles && !isOnTerrain && boolTerrain) {

                        cartesian = this._viewer.scene.camera.pickEllipsoid(px, this._viewer.scene.globe.ellipsoid);
                    }
                    if (cartesian) {
                        let position = this.transformCartesianToWGS84(cartesian)
                        if (position.alt < 0) {
                            cartesian = this.transformWGS84ToCartesian(position, 0.1)
                        }
                        return cartesian;
                    }
                    return false;
                }

            },
            /**
             * 获取84坐标的距离
             * @param {*} positions
             */
            getPositionDistance: function (positions) {
                let distance = 0
                for (let i = 0; i < positions.length - 1; i++) {
                    let point1cartographic = this.transformWGS84ToCartographic(positions[i])
                    let point2cartographic = this.transformWGS84ToCartographic(positions[i + 1])
                    let geodesic = new Cesium.EllipsoidGeodesic()
                    geodesic.setEndPoints(point1cartographic, point2cartographic)
                    let s = geodesic.surfaceDistance
                    s = Math.sqrt(
                        Math.pow(s, 2) +
                        Math.pow(point2cartographic.height - point1cartographic.height, 2)
                    )
                    distance = distance + s
                }
                return distance.toFixed(3)
            },
            /**
            * 计算一组坐标组成多边形的面积
            * @param {*} positions
            */
            getPositionsArea: function (positions) {
                let result = 0
                if (positions) {
                    let h = 0
                    let ellipsoid = Cesium.Ellipsoid.WGS84
                    positions.push(positions[0])
                    for (let i = 1; i < positions.length; i++) {
                        let oel = ellipsoid.cartographicToCartesian(
                            this.transformWGS84ToCartographic(positions[i - 1])
                        )
                        let el = ellipsoid.cartographicToCartesian(
                            this.transformWGS84ToCartographic(positions[i])
                        )
                        h += oel.x * el.y - el.x * oel.y
                    }
                    result = Math.abs(h).toFixed(2)
                }
                return result
            },
            /**
             * 测距
             * @param {*} options
             */
            drawLineMeasureGraphics: function (options = {}) {
                if (this._viewer && options) {
                    this.idContainer = [] //初始化id容器
                    let positions = [], _lineEntity = new Cesium.Entity(), $this = this, lineObj,
                        _handlers = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
                    window.toolTip = '点击鼠标左键开始绘制。';
                    // left
                    _handlers.setInputAction(function (movement) {
                        window.toolTip = '点击鼠标左键继续绘制，双击鼠标左键结束绘制。';
                        var cartesian = $this.getCatesian3FromPX(movement.position);
                        if (cartesian && cartesian.x) {
                            if (positions.length == 0) {
                                positions.push(cartesian.clone());
                            }
                            // 添加量测信息点
                            _addInfoPoint(cartesian)
                            positions.push(cartesian);
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                    _handlers.setInputAction(function (movement) {
                        var cartesian = $this.getCatesian3FromPX(movement.endPosition);
                        toolTips(window.toolTip, movement.endPosition, true);
                        if (positions.length >= 2) {
                            if (cartesian && cartesian.x) {
                                positions.pop();
                                positions.push(cartesian);
                            }
                        }
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    // 双击结束
                    _handlers.setInputAction(function (movement) {
                        positions.pop()
                        positions.pop() //因为是双击结束，所以要pop两次，一次是move的结果，一次是单击结果
                        toolTips(window.toolTip, null, false);
                        _handlers.destroy()
                        _handlers = null
                        _lineEntity.polyline.positions = _lineEntity.polyline.positions.getValue() //取消CallbackProperty
                        let cartesian = $this.getCatesian3FromPX(movement.position);
                        _addInfoPoint(cartesian)

                        if (typeof options.callback === 'function') {

                            options.callback($this.transformCartesianArrayToWGS84Array(positions), lineObj);
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

                    _lineEntity.polyline = {
                        width: options.width || 5
                        , material:Cesium.Color.fromCssColorString(options.material)  || Cesium.Color.BLUE.withAlpha(0.8)
                        , clampToGround: options.clampToGround || false
                    }
                    _lineEntity.polyline.positions = new Cesium.CallbackProperty(function () {
                        return positions
                    }, false)
                    // lineObj = this._drawLayer.entities.add(_lineEntity)
                    this.idContainer.push(_lineEntity.id)
                    _lineEntity.name = "_measure"
                    _lineEntity.type = "measure"
                    _lineEntity.idContainer = this.idContainer
                    this._viewer.entities.add(_lineEntity)
                    //添加坐标点
                    const _addInfoPoint = (position)=> {
                        const _labelEntity = new Cesium.Entity()
                        _labelEntity.position = position
                        _labelEntity.point = {
                            pixelSize: 6,
                            outlineColor: Cesium.Color.YELLOWGREEN,
                            outlineWidth: 2
                        }
                        _labelEntity.label = {
                            text: ($this.getPositionDistance($this.transformCartesianArrayToWGS84Array(positions)) / 1000).toFixed(4) + ' km',
                            show: true,
                            showBackground: true,
                            font: '14px monospace',
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(-20, -30) //left top
                        }
                        // $this._drawLayer.entities.add(_labelEntity)
                        this.idContainer.push(_labelEntity.id)
                        _labelEntity.name = "_measure"
                        _labelEntity.type = "measure"
                        _labelEntity.idContainer = this.idContainer
                        this._viewer.entities.add(_labelEntity)
                    }
                }

            },
            /**
             * 测面积
             * @param {*} options
             */
            drawAreaMeasureGraphics: function (options = {}) {
                if (this._viewer && options) {
                    this.idContainer = []//初始化id容器
                    var positions = [], polygon = new Cesium.PolygonHierarchy(), _polygonEntity = new Cesium.Entity(), $this = this, polyObj = null, _label = '',
                        _handler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
                    window.toolTip = '点击鼠标左键开始绘制。'
                    // left
                    _handler.setInputAction(function (movement) {
                        window.toolTip = '点击鼠标左键继续绘制，双击鼠标左键结束绘制（不少于3个标绘点）。';
                        var cartesian = $this.getCatesian3FromPX(movement.position);
                        if (cartesian && cartesian.x) {
                            if (positions.length == 0) {
                                polygon.positions.push(cartesian.clone())
                                positions.push(cartesian.clone());
                            }
                            positions.push(cartesian.clone());
                            polygon.positions.push(cartesian.clone())

                            if (!polyObj) create()
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                    // mouse
                    _handler.setInputAction(function (movement) {
                        toolTips(window.toolTip, movement.endPosition, true);
                        var cartesian = $this.getCatesian3FromPX(movement.endPosition);
                        // var cartesian = $this._viewer.scene.camera.pickEllipsoid(movement.endPosition, $this._viewer.scene.globe.ellipsoid);
                        if (positions.length >= 2) {
                            if (cartesian && cartesian.x) {
                                positions.pop()
                                positions.push(cartesian);
                                polygon.positions.pop()
                                polygon.positions.push(cartesian);
                            }
                        }
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                    // 双击
                    _handler.setInputAction(function (movement) {
                        positions.pop()
                        positions.pop() //因为是双击结束，所以要pop两次，一次是move的结果，一次是单击结果
                        let cartesian = $this.getCatesian3FromPX(movement.endPosition);
                        toolTips(window.toolTip, null, false);
                        _handler.destroy();
                        _polygonEntity.polyline.positions = _polygonEntity.polyline.positions.getValue()//取消CallbackProperty
                        positions.push(positions[0]);

                        // 添加信息点
                        _addInfoPoint(positions[0])
                        if (typeof options.callback === 'function') {

                            options.callback($this.transformCartesianArrayToWGS84Array(positions), polyObj);
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

                    const create= ()=> {
                        _polygonEntity.polyline = {
                            width: options.width || 3
                            , material:Cesium.Color.fromCssColorString(options.material) ||Cesium.Color.BLUE.withAlpha(0.8)
                            , clampToGround: options.clampToGround || false
                        }

                        _polygonEntity.polyline.positions = new Cesium.CallbackProperty(function () {
                            return positions
                        }, false)

                        _polygonEntity.polygon = {

                            hierarchy: new Cesium.CallbackProperty(function () {
                                return polygon
                            }, false),

                            material: Cesium.Color.WHITE.withAlpha(0.1)
                            , clampToGround: options.clampToGround || false
                        }

                        // polyObj = $this._drawLayer.entities.add(_polygonEntity)

                        this.idContainer.push(_polygonEntity.id)
                        _polygonEntity.name = "_measure"
                        _polygonEntity.type = "measure"
                        _polygonEntity.idContainer = this.idContainer
                        polyObj = this._viewer.entities.add(_polygonEntity)
                    }

                    const _addInfoPoint=(position)=> {
                        const _labelEntity = new Cesium.Entity()
                        _labelEntity.position = position
                        _labelEntity.point = {
                            pixelSize: 6,
                            outlineColor: Cesium.Color.YELLOWGREEN,
                            outlineWidth: 2
                        }
                        _labelEntity.label = {
                            text: ($this.getPositionsArea($this.transformCartesianArrayToWGS84Array(positions)) / 1000000.0).toFixed(4) + ' km²',
                            show: true,
                            showBackground: true,
                            font: '14px monospace',
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(-20, -50) //left top
                        }
                        // $this._drawLayer.entities.add(_labelEntity)

                        this.idContainer.push(_labelEntity.id)
                        _labelEntity.name = "_measure"
                        _labelEntity.type = "measure"
                        _labelEntity.idContainer = this.idContainer
                        this._viewer.entities.add(_labelEntity)
                    }
                }

            },
            /**
             * 画三角量测
             * @param {*} options
             */
            drawTrianglesMeasureGraphics: function (options = {}) {
                options.style = options.style ||
                {
                    width: 3
                    , material: Cesium.Color.BLUE.withAlpha(0.5)
                }
                if (this._viewer && options) {
                    window.toolTip ='点击鼠标左键开始绘制，标绘2个点自动结束标绘。'
                    this.idContainer = [] //初始化容器
                    var _trianglesEntity = new Cesium.Entity(), _tempLineEntity = new Cesium.Entity(), _tempLineEntity2 = new Cesium.Entity(),
                        _positions = [], _tempPoints = [], _tempPoints2 = [], $this = this,
                        _handler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
                    // 高度
                    function _getHeading(startPosition, endPosition) {
                        if (!startPosition && !endPosition) return 0
                        if (Cesium.Cartesian3.equals(startPosition, endPosition)) return 0
                        let cartographic = Cesium.Cartographic.fromCartesian(startPosition);
                        let cartographic2 = Cesium.Cartographic.fromCartesian(endPosition);
                        return (cartographic2.height - cartographic.height).toFixed(2)
                    }
                    // 偏移点
                    function _computesHorizontalLine(positions) {
                        let cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
                        let cartographic2 = Cesium.Cartographic.fromCartesian(positions[1]);
                        return Cesium.Cartesian3.fromDegrees(
                            Cesium.Math.toDegrees(cartographic.longitude),
                            Cesium.Math.toDegrees(cartographic.latitude),
                            cartographic2.height
                        )
                    }
                    // left
                    _handler.setInputAction(function (movement) {
                        window.toolTip = '点击鼠标左键绘制，标绘2个点自动结束标绘。';
                        var position = $this.getCatesian3FromPX(movement.position);
                        if (!position && !position.z) return false
                        if(_positions.length >= 1){ //将所有CallbackProperty回调取消
                            const linePoitions1 =  _trianglesEntity.polyline.positions.getValue()
                            const linePoitions2 =  _tempLineEntity.polyline.positions.getValue()
                            const linePoitions3 =  _tempLineEntity2.polyline.positions.getValue()
                            _trianglesEntity.polyline.positions = linePoitions1
                            _trianglesEntity.position = linePoitions1[0]
                            _trianglesEntity.label.text ='直线:' + $this.getPositionDistance($this.transformCartesianArrayToWGS84Array(linePoitions1)) + ' m'
                            _tempLineEntity.polyline.positions = linePoitions2
                            _tempLineEntity.positions = linePoitions2[1]
                            _tempLineEntity.label.text = '高度:' + _getHeading(linePoitions2[0], linePoitions2[1]) + ' m'
                            _tempLineEntity2.polyline.positions = linePoitions3
                            _tempLineEntity2.position = linePoitions3[1]
                            _tempLineEntity2.label.text = '水平距离:' + $this.getPositionDistance($this.transformCartesianArrayToWGS84Array(linePoitions3)) + ' m'
                            toolTips(window.toolTip, null, false);
                        }
                        if (_positions.length == 0) {
                            _positions.push(position.clone())
                            _positions.push(position.clone())
                            _tempPoints.push(position.clone())
                            _tempPoints.push(position.clone())
                        } else {
                            _handler.destroy();
                            if (typeof options.callback === 'function') {

                                options.callback({ e: _trianglesEntity, e2: _tempLineEntity, e3: _tempLineEntity2 });
                            }
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                    // mouse
                    _handler.setInputAction(function (movement) {
                        toolTips(window.toolTip, movement.endPosition, true);
                        var position = $this.getCatesian3FromPX(movement.endPosition);
                        if (position && _positions.length > 0) {
                            //直线
                            _positions.pop()
                            _positions.push(position.clone());
                            let horizontalPosition = _computesHorizontalLine(_positions)
                            //高度
                            _tempPoints.pop()
                            _tempPoints.push(horizontalPosition.clone())
                            //水平线
                            _tempPoints2.pop(), _tempPoints2.pop()
                            _tempPoints2.push(position.clone())
                            _tempPoints2.push(horizontalPosition.clone())
                        }
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

                    // create entity

                    //直线
                    _trianglesEntity.polyline = {
                        positions: new Cesium.CallbackProperty(function () {
                            return _positions
                        }, false),
                        width: options.width || 3,
                        material:Cesium.Color.fromCssColorString(options.material) ||Cesium.Color.BLUE.withAlpha(0.8),
                        clampToGround: options.clampToGround || false
                    }
                    _trianglesEntity.position = new Cesium.CallbackProperty(function () {
                        return _positions[0]
                    }, false)
                    _trianglesEntity.point = {
                        pixelSize: 6,
                        outlineColor: Cesium.Color.YELLOWGREEN,
                        outlineWidth: 2
                    }
                    _trianglesEntity.label = {
                        text: new Cesium.CallbackProperty(function () {
                            return '直线:' + $this.getPositionDistance($this.transformCartesianArrayToWGS84Array(_positions)) + ' m'
                        }, false),
                        show: true,
                        showBackground: true,
                        font: '14px monospace',
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(50, -100) //left top
                    }
                    //高度
                    _tempLineEntity.polyline = {
                        positions: new Cesium.CallbackProperty(function () {
                            return _tempPoints
                        }, false),
                        width: options.width || 3,
                        material:Cesium.Color.fromCssColorString(options.material) ||Cesium.Color.BLUE.withAlpha(0.8),
                        clampToGround: options.clampToGround || false
                    }
                    _tempLineEntity.position = new Cesium.CallbackProperty(function () {
                        return _tempPoints2[1]
                    }, false)
                    _tempLineEntity.point = {
                        pixelSize: 6,
                        outlineColor: Cesium.Color.YELLOWGREEN,
                        outlineWidth: 2
                    }
                    _tempLineEntity.label = {
                        text: new Cesium.CallbackProperty(function () {
                            return '高度:' + _getHeading(_tempPoints[0], _tempPoints[1]) + ' m'
                        }, false),
                        show: true,
                        showBackground: true,
                        font: '14px monospace',
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(-20, 100) //left top
                    }
                    //水平
                    _tempLineEntity2.polyline = {
                        positions: new Cesium.CallbackProperty(function () {
                            return _tempPoints2
                        }, false),
                        width: options.width || 3,
                        material:Cesium.Color.fromCssColorString(options.material) ||Cesium.Color.BLUE.withAlpha(0.8),
                        clampToGround: options.clampToGround || false
                    }
                    _tempLineEntity2.position = new Cesium.CallbackProperty(function () {
                        return _positions[1]
                    }, false)
                    _tempLineEntity2.point = {
                        pixelSize: 6,
                        outlineColor: Cesium.Color.YELLOWGREEN,
                        outlineWidth: 2
                    }
                    _tempLineEntity2.label = {
                        text: new Cesium.CallbackProperty(function () {
                            return '水平距离:' + $this.getPositionDistance($this.transformCartesianArrayToWGS84Array(_tempPoints2)) + ' m'
                        }, false),
                        show: true,
                        showBackground: true,
                        font: '14px monospace',
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(-150, -20) //left top
                    }
                    // this._drawLayer.entities.add(_tempLineEntity2)
                    this.idContainer.push(_tempLineEntity2.id)
                    this.idContainer.push(_tempLineEntity.id)
                    this.idContainer.push(_trianglesEntity.id)
                    _tempLineEntity2.name = "_measure"
                    _tempLineEntity2.type = "measure"
                    _tempLineEntity2.idContainer = this.idContainer
                    this._viewer.entities.add(_tempLineEntity2)
                    // this._drawLayer.entities.add(_tempLineEntity)
                    _tempLineEntity.name = "_measure"
                    _tempLineEntity.type = "measure"
                    _tempLineEntity.idContainer = this.idContainer
                    this._viewer.entities.add(_tempLineEntity)
                    // this._drawLayer.entities.add(_trianglesEntity)
                    _trianglesEntity.name = "_measure"
                    _trianglesEntity.type = "measure"
                    _trianglesEntity.idContainer = this.idContainer
                    this._viewer.entities.add(_trianglesEntity)
                }
            }
        }
        return _
    })(Cesium);

