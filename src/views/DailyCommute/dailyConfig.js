// @name: dailyConfig
// @description：每日通勤页 daily 场景的起讫点坐标、路线配置与可选信息卡配置。
//               本文件仅维护 daily 场景原始数据，坐标转换、路线解析等通用逻辑统一由 commuteUtils.js 提供。
//               数据结构面向“后台可配置”设计：
//   - BD_POINTS：点位对象数组，每项 { index, name, bd:[lng,lat] }，index 为稳定标识。
//   - ROUTES：路线对象数组，每项 { key, name, color, pointIndices:[起始, 途经1, ..., 终点] }。
//     pointIndices 引用 BD_POINTS 的 index；首元素为起点，末元素为终点，中间为途经点（数量不限）。

import { createScene } from '@/utils/commuteUtils.js';;

// 起讫点坐标（百度 BD-09，拾取自 lbsyun.baidu.com/maptool/getpoint）
// 代码内会自动转换为高德 GCJ-02。如需微调点位，改这里的百度坐标即可。
// index 为稳定标识，供路线配置引用；name 为展示名。
const BD_POINTS = [
  { index: 1, name: '浦乌北路·虎桥路公交站', bd: [118.597539, 32.016786] },
  // 虎桥路公交站对面（下班回程终点）
  { index: 2, name: '浦乌北路·虎桥路公交站', bd: [118.597531, 32.016423] },
  { index: 3, name: '绿水湾路地铁站', bd: [118.624797, 32.018333] },
  { index: 4, name: '南京花神科技广场东门', bd: [118.759862, 31.980695] },
  // 大胜关大桥收费站·绕城出口方向（下班回虎桥路的第二途经点，在花神之后）
  { index: 5, name: '大胜关大桥收费站·绕城出口方向', bd: [118.611055, 31.992565] },
  { index: 6, name: 'BeanStar 比星咖啡', bd: [118.858243, 31.93432] },
  // 绿水湾路地铁站（上班起点：马路同侧，避免掉头；与下班终点 index 3 同名不同坐标）
  { index: 7, name: '绿水湾路地铁站', bd: [118.625112, 32.018363] },
  // 大胜关大桥收费站·绕城入口方向（上班虎桥路路线途经点，在虎桥路之后、花神之前）
  { index: 8, name: '大胜关大桥收费站·绕城入口方向', bd: [118.610617, 31.992002] },
];

// 路线配置：pointIndices 引用 BD_POINTS 的 index
// key 以 go- 开头为上班路线，以 back- 开头为下班路线；首元素=起点，末元素=终点，中间=途经点（数量不限）
const ROUTES = [
  // 上班路线（2 条，起始点不同，途经、终点相同）
  // 路线一：绿水湾路（主选，走五桥免费）；路线二：虎桥路（备选，走三桥收费）
  { key: 'go-1', name: '路线一 · 绿水湾路', color: '#42b983', pointIndices: [7, 4, 6] },
  { key: 'go-2', name: '路线二 · 虎桥路', color: '#ef6b5a', pointIndices: [1, 8, 4, 6] },
  // 下班路线（起点终点对调：从咖啡店出发，途经花神，回到起始点）
  // 路线二回虎桥路：终点为虎桥路公交站对面(2)，额外途经大胜关大桥收费站·绕城出口方向(5，在花神之后)
  { key: 'back-1', name: '路线一 · 回绿水湾路', color: '#42b983', pointIndices: [6, 4, 3] },
  { key: 'back-2', name: '路线二 · 回虎桥路', color: '#ef6b5a', pointIndices: [6, 4, 5, 2] },
];

// 隐藏路段配置（可选特性，独立于通用路线逻辑）
// 开启后：上班在该点→路线起点段耗时叠加进总时长与首段；下班在路线终点→该点段叠加进总时长与末段
// 不在地图显示该点，也不新增分段行。无此需求时设 enabled: false 即可完全跳过。
const HIDDEN_LEG = {
  enabled: true,
  bd: [118.611254, 32.014315],
};

// fx67ll 专用时间信息：从「江浦」到花神科技园东门(index 4)的驾车用时
// 起点展示名用区域名，不暴露具体敏感地点；坐标同 HIDDEN_LEG
const INFO = {
  fromName: '江浦',
  bd: [118.611254, 32.014315],
  toPointIndex: 4,
};

// daily 场景配置汇总：字段与 commuteConfig.js 的 COMMUTE_SCENE 保持一致
// 页面按 scene 直接取用对应场景配置，daily 与 commute 的定位数据互不影响
export const DAILY_SCENE = createScene({
  bdPoints: BD_POINTS,
  routes: ROUTES,
  hiddenLeg: HIDDEN_LEG,
  info: INFO,
});
