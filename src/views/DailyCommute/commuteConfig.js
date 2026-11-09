// @name: commuteConfig
// @description：commute 公开路由专用通勤定位配置，与 dailyConfig.js 中 daily 的定位配置完全分离。
//               当前预留一套与 daily 结构完全一致的数据作为可编辑基线，后续直接替换为 commute 实际起讫点即可；
//               本文件仅维护 commute 场景原始数据，坐标转换、路线解析等通用逻辑统一由 commuteUtils.js 提供。

import { createScene } from '@/utils/commuteUtils.js';;

// ===== 点位配置（预留基线，结构与 daily 一致）=====
// 每项：{ index: 稳定标识（数字，供路线引用）, name: 展示名称, bd: [百度经度, 百度纬度] }
// 坐标拾取地址：lbsyun.baidu.com/maptool/getpoint，代码内自动转换为高德 GCJ-02。
// 后续调整 commute 起讫点时，直接修改下方点位的 name 与 bd 即可，index 保持稳定供路线引用。
const COMMUTE_BD_POINTS = [
  { index: 1, name: '南京绕城高速入口', bd: [118.591460,32.010397] },
  // 下班回程终点
  { index: 2, name: '南京绕城高速出口', bd: [118.591460,32.010397] },
  { index: 3, name: '雨山路地铁站', bd: [118.621776,32.050264] },
  { index: 4, name: '南京花神科技广场东门', bd: [118.759862, 31.980695] },
  // 大胜关大桥收费站·绕城出口方向（下班回建设路的第二途经点，在花神之后）
  { index: 5, name: '大胜关大桥收费站·绕城出口方向', bd: [118.611055, 31.992565] },
  { index: 6, name: 'BeanStar 比星咖啡', bd: [118.858243, 31.93432] },
  // 雨山路地铁站（上班起点：马路同侧，避免掉头；与下班终点 index 3 同名不同坐标）
  { index: 7, name: '雨山路地铁站', bd: [118.621898,32.050115] },
  // 大胜关大桥收费站·绕城入口方向（上班建设路路线途经点，在建设路之后、花神之前）
  { index: 8, name: '大胜关大桥收费站·绕城入口方向', bd: [118.610617, 31.992002] },
];

// ===== 路线配置（预留基线，结构与 daily 一致）=====
// 每项：{ key: 稳定标识, name: 展示名称, color: 路线颜色, pointIndices: [起点, 途经..., 终点] }
// key 以 go- 开头为上班路线，以 back- 开头为下班路线；pointIndices 引用 COMMUTE_BD_POINTS 的 index。
// 首元素为起点，末元素为终点，中间元素为途经点（数量不限）。
// 后续调整 commute 路线时，直接修改 pointIndices 引用即可，key 保持稳定。
const COMMUTE_ROUTES = [
  // 上班路线（2 条，起始点不同，途经、终点相同）
  // 路线一：雨山路（主选，走五桥免费）；路线二：建设路（备选，走三桥收费）
  { key: 'go-1', name: '路线一 · 雨山路', color: '#42b983', pointIndices: [7, 4, 6] },
  { key: 'go-2', name: '路线二 · 建设路', color: '#ef6b5a', pointIndices: [1, 8, 4, 6] },
  // 下班路线（起点终点对调：从咖啡店出发，途经花神，回到起始点）
  // 路线二回建设路：终点为建设路，额外途经大胜关大桥收费站·绕城出口方向(5，在花神之后)
  { key: 'back-1', name: '路线一 · 回雨山路', color: '#42b983', pointIndices: [6, 4, 3] },
  { key: 'back-2', name: '路线二 · 回建设路', color: '#ef6b5a', pointIndices: [6, 4, 5, 2] },
];

// ===== 隐藏路段配置（可选，预留基线）=====
// 开启后：上班在隐藏点→路线起点段耗时叠加进总时长与首段；下班在路线终点→隐藏点段叠加进总时长与末段。
// 不在地图显示该点，也不新增分段行。无需该特性时保持 enabled: false 即可。
const COMMUTE_HIDDEN_LEG = {
  enabled: true,
  bd: [118.611254, 32.014315],
};

// ===== 专用时间信息卡配置（可选，预留基线）=====
// 用于展示「指定地点 → 指定点位」的驾车用时；fromName 为空或 toPointIndex 无效时页面自动隐藏该卡片。
// bd 与 toPointIndex 需同时有效，信息卡才会展示。
const COMMUTE_INFO = {
  fromName: '江浦',
  bd: [118.611254, 32.014315],
  toPointIndex: 4,
};

// commute 场景配置汇总：字段与 dailyConfig.js 的 DAILY_SCENE 保持一致
export const COMMUTE_SCENE = createScene({
  bdPoints: COMMUTE_BD_POINTS,
  routes: COMMUTE_ROUTES,
  hiddenLeg: COMMUTE_HIDDEN_LEG,
  info: COMMUTE_INFO,
});
