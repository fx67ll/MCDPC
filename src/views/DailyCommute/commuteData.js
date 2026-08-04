// @name: commuteData
// @description：每日通勤页的起讫点坐标、路线配置与拥堵常量。
// 数据结构面向“后台可配置”设计：
//   - POINTS：点位对象数组，每项 { index, name, bd:[lng,lat] }，index 为稳定标识。
//   - ROUTES：路线对象数组，每项 { key, name, color, pointIndices:[起始, 途经1, 途经2, ..., 终点] }。
//     pointIndices 引用 POINTS 的 index；首元素为起点，末元素为终点，中间为途经点（数量不限）。
//   - TABS：上班/下班分组，各自引用 ROUTES 的 key。

// ===== 坐标系转换：百度 BD-09 → 高德 GCJ-02 =====
// 坐标通过百度地图拾取器获取（BD-09），高德地图需要 GCJ-02，这里做转换。
var PI = Math.PI;
var X_PI = (PI * 3000.0) / 180.0;
function bd09ToGcj02(bdLng, bdLat) {
  var x = bdLng - 0.0065;
  var y = bdLat - 0.006;
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  return [z * Math.cos(theta), z * Math.sin(theta)];
}

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

// 转换为高德 GCJ-02 坐标供地图使用（自动遍历，无需逐点维护）
export const POINTS = BD_POINTS.map(function (p) {
  return {
    index: p.index,
    name: p.name,
    lnglat: bd09ToGcj02(p.bd[0], p.bd[1]),
  };
});

// 隐藏路段配置（可选特性，独立于通用路线逻辑）
// 开启后：上班在该点→路线起点段耗时叠加进总时长与首段；下班在路线终点→该点段叠加进总时长与末段
// 不在地图显示该点，也不新增分段行。无此需求时设 HIDDEN_LEG.enabled = false 即可完全跳过。
export const HIDDEN_LEG = {
  enabled: true,
  lnglat: bd09ToGcj02(118.611254, 32.014315),
};

// fx67ll 专用时间信息：从「江浦」到花神科技园东门(index 4)的驾车用时
// 起点展示名用区域名，不暴露具体敏感地点；坐标同 HIDDEN_LEG.lnglat
export const FX67LL_INFO = {
  fromName: '江浦',
  fromLnglat: HIDDEN_LEG.lnglat,
  toPointIndex: 4,
};

// 按 index 建立查找表，供路线配置解析坐标
const POINT_MAP = (function () {
  var m = {};
  POINTS.forEach(function (p) { m[p.index] = p; });
  return m;
})();

// 按 index 取点
export function getPoint(index) {
  return POINT_MAP[index] || null;
}

// 路线配置：pointIndices 引用 POINTS 的 index
// 首元素=起点，末元素=终点，中间元素=途经点（数量不限）
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

// 上班/下班分组（引用 ROUTES 的 key，后台只需维护 ROUTES 与这里两组）
export const GO_ROUTES = ROUTES.filter(function (r) { return r.key.indexOf('go-') === 0; });
export const BACK_ROUTES = ROUTES.filter(function (r) { return r.key.indexOf('back-') === 0; });

// 解析路线为结构化点：{ start, vias:[], end }
export function getRoutePoints(route) {
  if (!route || !route.pointIndices || route.pointIndices.length < 2) {
    return { start: null, vias: [], end: null };
  }
  var idxs = route.pointIndices;
  var start = getPoint(idxs[0]);
  var end = getPoint(idxs[idxs.length - 1]);
  var vias = [];
  for (var i = 1; i < idxs.length - 1; i++) {
    var p = getPoint(idxs[i]);
    if (p) vias.push(p);
  }
  return { start: start, vias: vias, end: end };
}

// 拥堵状态：0未知 1畅通 2缓行 3拥堵 4严重拥堵
export const CONGESTION = {
  0: { level: 0, text: '未知', cls: 'unknown' },
  1: { level: 1, text: '畅通', cls: 'smooth' },
  2: { level: 2, text: '缓行', cls: 'slow' },
  3: { level: 3, text: '拥堵', cls: 'jam' },
  4: { level: 4, text: '严重拥堵', cls: 'bad' },
};

// 时间格式化工具
export function formatTime(d) {
  var h = d.getHours();
  var m = d.getMinutes();
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

export function fmtDuration(sec) {
  if (!sec || sec < 0) return '--';
  var m = Math.round(sec / 60);
  if (m < 60) return m + ' 分钟';
  var h = Math.floor(m / 60);
  var mm = m % 60;
  return h + ' 小时 ' + (mm > 0 ? mm + ' 分' : '');
}

export function fmtDistance(meter) {
  if (!meter) return '--';
  if (meter >= 1000) return (meter / 1000).toFixed(1) + ' 公里';
  return meter + ' 米';
}

// 根据当前小时自动判断上班/下班：0:00~12:00 上班，12:00~24:00 下班
export function autoTabByHour(d) {
  var h = d.getHours();
  return h < 12 ? 'go' : 'back';
}

// ===== 高德 API 请求队列（规避 1 秒并发不超过 3 的限制）=====
// 串行执行所有 Driving.search，相邻请求间隔 400ms，保证每秒不超过 3 次。
var _queue = [];
var _running = false;
var _interval = 400; // 请求间隔毫秒（1000/3 ≈ 333，留余量用 400）

function _runNext() {
  if (_queue.length === 0) {
    _running = false;
    return;
  }
  _running = true;
  var task = _queue.shift();
  var called = false;
  // 超时兜底：如果 search 8 秒没回调，强制 done 防止队列卡死
  var timer = setTimeout(function () {
    if (!called) {
      called = true;
      setTimeout(_runNext, _interval);
    }
  }, 8000);
  task.fn(function () {
    if (called) return;
    called = true;
    clearTimeout(timer);
    setTimeout(_runNext, _interval);
  });
}

/**
 * 把一个 Driving.search 任务加入队列串行执行
 * @param {Function} fn 实际执行函数，接收一个 done 回调，fn(done) 内部完成 search 后调 done()
 */
export function enqueueAMapTask(fn) {
  _queue.push({ fn: fn });
  if (!_running) {
    _runNext();
  }
}
