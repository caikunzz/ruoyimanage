/**
 * uniform vec4 color;
 *
 * czm_material czm_getMaterial(czm_materialInput materialInput) {
 *     czm_material material = czm_getDefaultMaterial(materialInput);
 *     vec2 st = materialInput.st;
 *     vec2 center = vec2(0.5);
 *     float dis = distance(st, center);
 *
 *     // Adjust the spread factor for softer edges
 *     float spreadFactor = 0.1; // 调整这个值以获得更软或更硬的边缘
 *
 *     // Calculate alpha and diffuse with soft edge
 *     float a = 0.0;
 *     if (dis < 1.0) {
 *         a = 1.0 - (dis - 1.0) / spreadFactor;
 *     }
 *
 *     // Apply alpha and diffuse
 *     material.alpha = a;
 *     material.diffuse = color.rgb * a;
 *
 *     return material;
 * */

class PointGlowMaterialProperty {
    constructor(options) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this.color = options.color || Cesium.Color.RED;
    }

    get isConstant() {
        return false;
    }

    get definitionChanged() {
        return this._definitionChanged;
    }

    getType() {
        return Cesium.Material.PointGlowMaterialType;
    }

    getValue(time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }

        result.color = Cesium.Property.getValueOrDefault(this._color, time, Cesium.Color.RED, result.color);
        return result;
    }

    equals(other) {
        return (this === other ||
            (other instanceof PointGlowMaterialProperty &&
                Cesium.Property.equals(this._color, other._color))
        );
    }
}

Object.defineProperties(PointGlowMaterialProperty.prototype, {
    color: Cesium.createPropertyDescriptor('color'),
});

Cesium.PointGlowMaterialProperty = PointGlowMaterialProperty;
Cesium.Material.PointGlowMaterialProperty = 'PointGlowMaterialProperty';
Cesium.Material.PointGlowMaterialType = 'PointGlowMaterialType';
Cesium.Material.PointGlowMaterialSource = `
  uniform vec4 color;

czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    vec2 center = vec2(0.5);
    float dis = distance(st, center);

    // Adjust the spread factor for softer edges
    float spreadFactor = 0.1; // 调整这个值以获得更软或更硬的边缘

    // Calculate alpha and diffuse with soft edge
    float a = 0.0;
    if (dis < 1.0) {
        a = 1.0 - (dis - 1.0) / spreadFactor;
    }

    // Apply alpha and diffuse
    material.alpha = a;
    material.diffuse = color.rgb * a;

    return material;
}

`;

Cesium.Material._materialCache.addMaterial(Cesium.Material.PointGlowMaterialType, {
    fabric: {
        type: Cesium.Material.PointGlowMaterialType,
        uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0), // 初始颜色
        },
        source: Cesium.Material.PointGlowMaterialSource,
    },
    translucent: function () {
        return true;
    },
});
