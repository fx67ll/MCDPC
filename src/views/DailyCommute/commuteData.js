// @name: commuteData
// @description：每日通勤页的起讫点坐标、路线配置与拥堵常量。

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
const BD_POINTS = {
  start1: { name: '浦乌北路·虎桥路公交站', bd: [118.597539, 32.016786] },
  // 虎桥路公交站对面（下班回程终点）
  start1Opposite: { name: '浦乌北路·虎桥路公交站', bd: [118.597531, 32.016423] },
  start2: { name: '绿水湾路地铁站', bd: [118.624797, 32.018333] },
  via: { name: '南京花神科技广场东门', bd: [118.759862, 31.980695] },
  // 大胜关大桥收费站（下班回虎桥路的第二途经点，在花神之后）
  viaDashengguan: { name: '大胜关大桥收费站', bd: [118.611055, 31.992565] },
  end: { name: 'BeanStar 比星咖啡', bd: [118.858243, 31.93432] },
};

// 转换为高德 GCJ-02 坐标供地图使用
export const POINTS = {
  start1: { name: BD_POINTS.start1.name, lnglat: bd09ToGcj02(BD_POINTS.start1.bd[0], BD_POINTS.start1.bd[1]) },
  start1Opposite: { name: BD_POINTS.start1Opposite.name, lnglat: bd09ToGcj02(BD_POINTS.start1Opposite.bd[0], BD_POINTS.start1Opposite.bd[1]) },
  start2: { name: BD_POINTS.start2.name, lnglat: bd09ToGcj02(BD_POINTS.start2.bd[0], BD_POINTS.start2.bd[1]) },
  via: { name: BD_POINTS.via.name, lnglat: bd09ToGcj02(BD_POINTS.via.bd[0], BD_POINTS.via.bd[1]) },
  viaDashengguan: { name: BD_POINTS.viaDashengguan.name, lnglat: bd09ToGcj02(BD_POINTS.viaDashengguan.bd[0], BD_POINTS.viaDashengguan.bd[1]) },
  end: { name: BD_POINTS.end.name, lnglat: bd09ToGcj02(BD_POINTS.end.bd[0], BD_POINTS.end.bd[1]) },
};

// 上班路线（2 条，起始点不同，途经、终点相同）
// 路线一：绿水湾路（主选，走五桥免费）；路线二：虎桥路（备选，走三桥收费）
export const GO_ROUTES = [
  { name: '路线一 · 绿水湾路', color: '#42b983', start: POINTS.start2, via: POINTS.via, end: POINTS.end },
  { name: '路线二 · 虎桥路', color: '#ef6b5a', start: POINTS.start1, via: POINTS.via, end: POINTS.end },
];
// 下班路线（起点终点对调：从咖啡店出发，途经花神，回到起始点）
// 路线二回虎桥路：终点为虎桥路公交站对面，额外途经大胜关大桥收费站（在花神之后）
export const BACK_ROUTES = [
  { name: '路线一 · 回绿水湾路', color: '#42b983', start: POINTS.end, via: POINTS.via, end: POINTS.start2 },
  { name: '路线二 · 回虎桥路', color: '#ef6b5a', start: POINTS.end, via: POINTS.via, via2: POINTS.viaDashengguan, end: POINTS.start1Opposite },
];

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

// 根据当前小时自动判断上班/下班：6:00~12:00 上班，其余下班
export function autoTabByHour(d) {
  var h = d.getHours();
  return h >= 6 && h < 12 ? 'go' : 'back';
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

