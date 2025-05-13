/*
 * 封装提示内容方法
 * @Author: Wang jianLei
 * @Date: 2023-01-17 14:56:53
 * @Last Modified by: jianlei wang
 * @Last Modified time: 2023-05-19 17:33:37
 */
import toolTips from "../src/common/reminderTip";

const ToolTip = {
  Point: "左键选择点进行编辑",
  Polyline: "左键点击折线进行编辑",
  FreeLine: "左键点击自由线线进行编辑",
  Polygon: "左键点击多边形进行编辑",
  CurvedPolygon: "左键点击曲面多边形进行编辑",
  EditPoint: "点：左键摁下并拖动，左键抬起完成编辑",
  EditPolyline: "折线：左键摁下并拖动，左键抬起完成编辑",
  EditFreeLine: "自由线：左键摁下并拖动，左键抬起完成编辑",
  PolylineEditPoints: "折线节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  FreeLineEditPoints: "自由线节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  PolylineEditCenterPoints: "折线虚拟中点：左键点击增加节点",
  FreeLineEditCenterPoints: "自由线线虚拟中点：左键点击增加节点",
  EditPolygon: "多边形：左键摁下并拖动，左键抬起完成编辑",
  EditFreePolygon: "自由面：左键摁下并拖动，左键抬起完成编辑",
  PolygonEditPoints: "多边形节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  FreePolygonEditPoints: "自由面节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  PolygonEditCenterPoints: "多边形虚拟中点：左键点击增加节点",
  FreePolygonEditCenterPoints: "自由面虚拟中点：左键点击增加节点",
  EditCurvedPolygon: "曲面多边形：左键摁下并拖动，左键抬起完成编辑",
  CurvedPolygonEditPoints:
    "曲面多边形节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  CurvedPolygonEditCenterPoints: "曲面多边形虚拟中点：左键点击增加节点",
  Billboard: "左键点击广告牌进行编辑",
  EditBillboard: "广告牌：左键摁下并拖动，左键抬起完成编辑",
  Curve: "左键点击曲线进行编辑",
  EditCurve: "曲线：左键摁下并拖动，左键抬起完成编辑",
  CurveEditPoints: "曲线节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  CurveEditCenterPoints: "曲线虚拟中点：左键点击增加节点",
  LineArrow: "左键点击简单直线箭头进行编辑",
  CurveArrow: "左键点击简单曲线箭头进行编辑",
  EditLineArrow: "简单箭头：左键摁下并拖动，左键抬起完成编辑",
  EditCurveArrow: "简单曲线箭头：左键按下并拖动，左键抬起完成编辑",
  CurveArrowEditPoints:
    "简单箭头节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  CurveArrowEditCenterPoints: "简单箭头虚拟中点：左键点击增加节点",
  LineArrowEditPoints: "简单箭头节点：左键摁住拖动，左键抬起完成编辑",
  // LineArrowEditCenterPoints: '简单箭头虚拟中点：左键点击增加节点',
  RegularPolygon: "左键点击正多边形进行编辑",
  EditRegularPolygon: "正多边形:左键摁下拖动，左键抬起完成编辑",
  RegularPolygonEditCenter: "正多边形中点：左键摁下拖动，左键抬起完成编辑",
  RegularPolygonEditEnd: "正多边形节点：左键摁下拖动，左键抬起完成编辑",
  AttackArrow: "左键点击攻击箭头进行编辑",
  EditAttackArrow: "攻击箭头：左键摁下并拖动，左键抬起完成编辑",
  AttackArrowEditPoints:
    "攻击箭头节点：左键摁住拖动，右键删除，左键抬起完成编辑",
  AttackArrowEditCenterPoints: "攻击箭头虚拟中点：左键点击增加节点",
  RightAngleArrow: "左键点击直角箭头进行编辑",
  EditRightAngleArrow: "直角箭头：左键摁下并拖动，左键抬起完成编辑",
  RightAngleArrowEditPoints: "攻击箭头节点：左键摁住拖动，左键抬起完成编辑",
  RightAngleArrowEditCenterPoints:
    "攻击箭头中点：左键摁下并拖动，左键抬起完成编辑",
  Elliptic: "左键点击椭圆进行编辑",
  EditElliptic: "椭圆:左键摁下拖动，左键抬起完成编辑",
  EllipticEditCenter: "椭圆中点：左键摁下拖动，左键抬起完成编辑",
  EllipticEditEnd: "椭圆轴点：左键摁下拖动，左键抬起完成编辑",
  Circle: "左键点击圆进行编辑",
  EditCircle: "圆:左键摁下拖动，左键抬起完成编辑",
  CircleEditCenter: "圆中点：左键摁下拖动，左键抬起完成编辑",
  CircleEditEnd: "圆轴点：左键摁下拖动，左键抬起完成编辑",
  Rectangle: "左键点击矩形进行编辑",
  EditRectangle: "矩形:左键摁下拖动，左键抬起完成编辑",
  RectangleEditPoint: "矩形节点：左键摁下拖动，左键抬起完成编辑",
  AssemblePolygon: "左键点击集结地进行编辑",
  EditAssemble: "集结地:左键摁下拖动，左键抬起完成编辑",
  AssembleEditPoint: "集结地节点：左键摁下拖动，左键抬起完成编辑",
  SwallowtailArrow: "左键点击燕尾箭头进行编辑",
  EditSwallowtailArrow: "燕尾箭头:左键摁下拖动，左键抬起完成编辑",
  SwallowtailArrowEditPoint: "燕尾箭头节点：左键摁下拖动，左键抬起完成编辑",
  StraightArrow: "左键点击直线箭头进行编辑",
  EditStraightArrow: "直线箭头:左键摁下拖动，左键抬起完成编辑",
  StraightArrowEditPoint: "直线箭头节点：左键摁下拖动，左键抬起完成编辑",
  PincerArrow: "左键点击钳击箭头进行编辑",
  EditPincerArrow: "钳击箭头:左键摁下拖动，左键抬起完成编辑",
  PincerArrowEditPoint: "钳击箭头节点：左键摁下拖动，左键抬起完成编辑",
  CurveFlag: "左键点击曲线旗标进行编辑",
  RectangleFlag: "左键点击矩形旗标进行编辑",
  RegularTriangleFlag: "左键点击正三角旗标进行编辑",
  InvertedTriangleFlag: "左键点击倒三角旗标进行编辑",
  TriangleFlag: "左键点击对三角线旗标进行编辑",
  EditFlag: "旗标:左键摁下拖动，左键抬起完成编辑",
  FlagEditPoint: "旗标节点：左键摁下拖动，左键抬起完成编辑",
  DefenseLine: "左键点击阵型对象进行编辑",
  EditDefenseLine: "阵型:左键摁下拖动，左键抬起完成编辑",
  DefenseLineEditPoint: "阵型节点：左键摁下拖动，左键抬起完成编辑",
  Bow: "左键点击弓形对象进行编辑",
  EditBow: "弓形:左键摁下拖动，左键抬起完成编辑",
  BowEditPoint: "弓形节点：左键摁下拖动，左键抬起完成编辑",
  RoundRectangle: "左键点击圆角矩形对象进行编辑",
  EditRoundRectangle: "圆角矩形:左键摁下拖动，左键抬起完成编辑",
  RoundRectangleEditPoint: "圆角矩形节点：左键摁下拖动，左键抬起完成编辑",
  Sector: "左键点击扇形对象进行编辑",
  EditSector: "扇形:左键摁下拖动，左键抬起完成编辑",
  SectorEditPoint: "扇形节点：左键摁下拖动，左键抬起完成编辑",
  Label: "左键点击文本对象进行编辑",
  EditLabel: "文本：左键摁下并拖动，右键编辑属性",
  Gltf: "左键点击模型对象进行编辑",
  EditGltf: "模型：左键编辑位置，右键编辑旋转，中间摁下并拖动进行缩放",
};
const showToolTip = (type, toolTip, pos, bool) => {
  if (type) {
    toolTip = ToolTip[type];
    toolTips(toolTip, pos, bool);
  } else {
    removeToolTip(toolTip);
  }
};
const removeToolTip = (toolTip) => {
  toolTip = "";
  toolTips(toolTip, null, false);
};

export { showToolTip, removeToolTip };
