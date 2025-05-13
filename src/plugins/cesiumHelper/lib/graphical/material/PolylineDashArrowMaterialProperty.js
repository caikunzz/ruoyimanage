const Cesium = window.Cesium;

/**
 * #ifdef GL_OES_standard_derivatives
 * #extension GL_OES_standard_derivatives : enable
 * #endif
 *
 * uniform vec4 color;         // 线的颜色
 * uniform vec4 gapColor;      // 间隔的颜色
 * uniform float dashLength;   // 虚线长度
 * uniform float dashPattern;  // 虚线模式
 *
 * varying float v_polylineAngle; // 线的角度
 * varying float v_width;         // 线的宽度
 *
 * const float maskLength = 10.0;  // 掩码长度
 *
 * mat2 rotate(float rad) {
 *     float c = cos(rad);
 *     float s = sin(rad);
 *     return mat2(
 *         c, s,
 *         -s, c
 *     );
 * }
 *
 * float getPointOnLine(vec2 p0, vec2 p1, float x) {
 *     float slope = (p0.y - p1.y) / (p0.x - p1.x);
 *     return slope * (x - p0.x) + p0.y;
 * }
 *
 * czm_material czm_getMaterial(czm_materialInput materialInput) {
 *     czm_material material = czm_getDefaultMaterial(materialInput);
 *     // 旋转片 段坐标
 *     vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;
 *
 *     // 计算虚线内的相对位置（0 到 1）
 *     float dashPosition = fract(pos.x / (dashLength * czm_pixelRatio));
 *
 *     // 确定掩码索引
 *     float maskIndex = floor(dashPosition * maskLength);
 *
 *     // 测试位掩码
 *     float maskTest = floor(dashPattern / pow(2.0, maskIndex));
 *     vec4 fragColor = (mod(maskTest, 2.0) < 1.0) ? gapColor : color;
 *
 *     vec2 st = materialInput.st;
 *
 * #ifdef GL_OES_standard_derivatives
 *     // 根据标准导数计算抗锯齿的基础值
 *     float base = 1.0 - abs(fwidth(st.s)) * 10.0 * czm_pixelRatio;
 * #else
 *     // 如果GL_OES_standard_derivatives不可用，则使用回退值
 *     float base = 0.975; // 2.5% 的线将作为箭头头部
 * #endif
 *
 *     vec2 center = vec2(1.0, 0.5);
 *     float ptOnUpperLine = getPointOnLine(vec2(base, 1.0), center, st.s);
 *     float ptOnLowerLine = getPointOnLine(vec2(base, 0.0), center, st.s);
 *
 *     float halfWidth = 0.15;
 *
 *     float s = step(0.5 - halfWidth, st.t);
 *     s *= 1.0 - step(0.5 + halfWidth, st.t);
 *     s *= 1.0 - step(base, st.s);
 *
 *     float t = step(base, materialInput.st.s);
 *     t *= 1.0 - step(ptOnUpperLine, st.t);
 *     t *= step(ptOnLowerLine, st.t);
 *
 *     float dist;
 *
 *     if (st.s < base) {
 *         if (fragColor.a < 0.005) {
 *             // 丢弃 alpha 非常低的片段
 *             discard;
 *         }
 *
 *         float d1 = abs(st.t - (0.5 - halfWidth));
 *         float d2 = abs(st.t - (0.5 + halfWidth));
 *         dist = min(d1, d2);
 *     } else {
 *         fragColor = color;
 *
 *         float d1 = czm_infinity;
 *
 *         if (st.t < 0.5 - halfWidth && st.t > 0.5 + halfWidth) {
 *             d1 = abs(st.s - base);
 *         }
 *
 *         float d2 = abs(st.t - ptOnUpperLine);
 *         float d3 = abs(st.t - ptOnLowerLine);
 *         dist = min(min(d1, d2), d3);
 *     }
 *
 *     vec4 outsideColor = vec4(0, 0, 0, 0);
 *     vec4 currentColor = mix(outsideColor, fragColor, clamp(s + t, 0.0, 1.0));
 *     vec4 outColor = czm_antialias(outsideColor, fragColor, currentColor, dist);
 *
 *     outColor = czm_gammaCorrect(outColor);
 *     material.diffuse = outColor.rgb;
 *     material.alpha = outColor.a;
 *     return material;
 * }
 * */

class PolylineDashArrowMaterialProperty {
  constructor(options) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._gapColor = undefined;
    this._dashLength = undefined;
    this._dashPattern = undefined;

    this.color = options.color;
    this.gapColor = options.gapColor;
    this.dashLength = options.dashLength;
    this.dashPattern = options.dashPattern;
  }

  get isConstant() {
    return false;
  }

  get definitionChanged() {
    return this._definitionChanged;
  }

  getType() {
    return Cesium.Material.PolylineDashArrowType;
  }

  getValue(time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }

    result.color = Cesium.Property.getValueOrDefault(
      this._color,
      time,
      Cesium.Color.RED,
      result.color
    );
    result.gapColor = Cesium.Property.getValueOrDefault(
      this._gapColor,
      time,
      Cesium.Color.TRANSPARENT,
      result.gapColor
    );
    result.dashLength = Cesium.Property.getValueOrDefault(
      this._dashLength,
      time,
      16.0,
      result.dashLength
    );
    result.dashPattern = Cesium.Property.getValueOrDefault(
      this._dashPattern,
      time,
      1.0,
      result.dashPattern
    );

    return result;
  }

  equals(other) {
    return (
      this === other ||
      (other instanceof PolylineDashArrowMaterialProperty &&
        Cesium.Property.equals(this._color, other._color) &&
        Cesium.Property.equals(this._gapColor, other._gapColor) &&
        Cesium.Property.equals(this._dashLength, other._dashLength) &&
        Cesium.Property.equals(this._dashPattern, other._dashPattern))
    );
  }
}

Object.defineProperties(PolylineDashArrowMaterialProperty.prototype, {
  color: Cesium.createPropertyDescriptor("color"),
  gapColor: Cesium.createPropertyDescriptor("gapColor"),
  dashLength: Cesium.createPropertyDescriptor("dashLength"),
  dashPattern: Cesium.createPropertyDescriptor("dashPattern"),
});

Cesium.PolylineDashArrowMaterialProperty = PolylineDashArrowMaterialProperty;
Cesium.Material.PolylineDashArrowType = "PolylineDashArrow";
Cesium.Material.PolylineDashArrowSource = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform vec4 color;         // 线的颜色
uniform vec4 gapColor;      // 间隔的颜色
uniform float dashLength;   // 虚线长度
uniform float dashPattern;  // 虚线模式

varying float v_polylineAngle; // 线的角度
varying float v_width;         // 线的宽度

const float maskLength = 10.0;  // 掩码长度

mat2 rotate(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat2(
        c, s,
        -s, c
    );
}

float getPointOnLine(vec2 p0, vec2 p1, float x) {
    float slope = (p0.y - p1.y) / (p0.x - p1.x);
    return slope * (x - p0.x) + p0.y;
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);
    // 旋转片 段坐标
    vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;

    // 计算虚线内的相对位置（0 到 1）
    float dashPosition = fract(pos.x / (dashLength * czm_pixelRatio));

    // 确定掩码索引
    float maskIndex = floor(dashPosition * maskLength);

    // 测试位掩码
    float maskTest = floor(dashPattern / pow(2.0, maskIndex));
    vec4 fragColor = (mod(maskTest, 2.0) < 1.0) ? gapColor : color;

    vec2 st = materialInput.st;

#ifdef GL_OES_standard_derivatives
    // 根据标准导数计算抗锯齿的基础值
    float base = 1.0 - abs(fwidth(st.s)) * 10.0 * czm_pixelRatio;
#else
    // 如果GL_OES_standard_derivatives不可用，则使用回退值
    float base = 0.975; // 2.5% 的线将作为箭头头部
#endif

    vec2 center = vec2(1.0, 0.5);
    float ptOnUpperLine = getPointOnLine(vec2(base, 1.0), center, st.s);
    float ptOnLowerLine = getPointOnLine(vec2(base, 0.0), center, st.s);

    float halfWidth = 0.15;

    float s = step(0.5 - halfWidth, st.t);
    s *= 1.0 - step(0.5 + halfWidth, st.t);
    s *= 1.0 - step(base, st.s);

    float t = step(base, materialInput.st.s);
    t *= 1.0 - step(ptOnUpperLine, st.t);
    t *= step(ptOnLowerLine, st.t);

    float dist;

    if (st.s < base) {
        if (fragColor.a < 0.005) {
            // 丢弃 alpha 非常低的片段
            discard;
        }

        float d1 = abs(st.t - (0.5 - halfWidth));
        float d2 = abs(st.t - (0.5 + halfWidth));
        dist = min(d1, d2);
    } else {
        fragColor = color;

        float d1 = czm_infinity;

        if (st.t < 0.5 - halfWidth && st.t > 0.5 + halfWidth) {
            d1 = abs(st.s - base);
        }

        float d2 = abs(st.t - ptOnUpperLine);
        float d3 = abs(st.t - ptOnLowerLine);
        dist = min(min(d1, d2), d3);
    }

    vec4 outsideColor = vec4(0, 0, 0, 0);
    vec4 currentColor = mix(outsideColor, fragColor, clamp(s + t, 0.0, 1.0));
    vec4 outColor = czm_antialias(outsideColor, fragColor, currentColor, dist);

    outColor = czm_gammaCorrect(outColor);
    material.diffuse = outColor.rgb;
    material.alpha = outColor.a;
    return material;
}
`;

Cesium.Material._materialCache.addMaterial(
  Cesium.Material.PolylineDashArrowType,
  {
    fabric: {
      type: Cesium.Material.PolylineDashArrowType,
      uniforms: {
        color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
        gapColor: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
        dashLength: 16.0,
        dashPattern: 1.0,
      },
      source: Cesium.Material.PolylineDashArrowSource,
    },
    translucent: function () {
      // 可根据需要设置透明度属性
    },
  }
);
