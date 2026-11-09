// @name: commuteUtils
// @description：每日通勤页通用工具与场景配置构建逻辑。
//               包含坐标转换、拥堵分级、时间/距离格式化、定位投影、高德请求队列，
//               以及 createScene：把各场景的原始点位/路线配置统一转换为页面可直接使用的场景对象。
//               dailyConfig.js 与 commuteConfig.js 仅维护各自原始数据，通用逻辑统一收敛于此，避免重复实现。

// ===== 坐标系转换：百度 BD-09 → 高德 GCJ-02 =====
// 坐标通过百度地图拾取器获取（BD-09），高德地图需要 GCJ-02，这里做转换。
var PI = Math.PI;
var X_PI = (PI * 3000.0) / 180.0;
export function bd09ToGcj02(bdLng, bdLat) {
  var x = bdLng - 0.0065;
  var y = bdLat - 0.006;
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  return [z * Math.cos(theta), z * Math.sin(theta)];
}

// 百度坐标转高德坐标（缺少有效坐标时返回 null）
function toGcjLnglat(bd) {
  if (!bd || bd.length < 2) return null;
  return bd09ToGcj02(bd[0], bd[1]);
}

/**
 * 构建场景配置：把原始点位、路线与可选配置统一转换为页面可直接使用的场景对象
 * @param {Object} options 场景原始配置
 * @param {Array} options.bdPoints 点位数组，每项 { index, name, bd:[lng,lat] }
 * @param {Array} options.routes 路线数组，每项 { key, name, color, pointIndices:[起点, 途经..., 终点] }
 * @param {Object} [options.hiddenLeg] 隐藏路段配置 { enabled, bd:[lng,lat] }
 * @param {Object} [options.info] 专用时间信息卡配置 { fromName, bd:[lng,lat], toPointIndex }
 * @returns {Object} { points, goRoutes, backRoutes, hiddenLeg, info, getPoint, getRoutePoints }
 */
export function createScene(options) {
  var opts = options || {};
  var bdPoints = Array.isArray(opts.bdPoints) ? opts.bdPoints : [];
  var routes = Array.isArray(opts.routes) ? opts.routes : [];

  // 点位转换为高德 GCJ-02 坐标；过滤缺少坐标的无效项，避免未填充数据时页面报错
  var points = bdPoints
    .filter(function (p) {
      return p && p.index !== undefined && p.bd && p.bd.length >= 2;
    })
    .map(function (p) {
      return {
        index: p.index,
        name: p.name,
        lnglat: bd09ToGcj02(p.bd[0], p.bd[1]),
      };
    });

  // 按 index 建立查找表，供路线配置解析坐标
  var pointMap = {};
  points.forEach(function (p) {
    pointMap[p.index] = p;
  });

  // 按 index 取点
  function getPoint(index) {
    return pointMap[index] || null;
  }

  // 路线是否有效：至少包含起终点，且引用的点位全部存在
  function isValidRoute(route) {
    if (!route || !route.pointIndices || route.pointIndices.length < 2) return false;
    return route.pointIndices.every(function (idx) {
      return !!pointMap[idx];
    });
  }

  // 解析路线为结构化点：{ start, vias:[], end }
  function getRoutePoints(route) {
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

  // 按 go- / back- 前缀分组，并过滤未配置或配置不完整的路线
  var goRoutes = routes.filter(function (r) {
    return r && r.key && r.key.indexOf('go-') === 0 && isValidRoute(r);
  });
  var backRoutes = routes.filter(function (r) {
    return r && r.key && r.key.indexOf('back-') === 0 && isValidRoute(r);
  });

  // 隐藏路段配置：未启用或缺少坐标时视为关闭，不影响通用逻辑
  var hiddenSrc = opts.hiddenLeg || {};
  var hiddenLnglat = toGcjLnglat(hiddenSrc.bd);
  var hiddenLeg = {
    enabled: hiddenSrc.enabled === true && !!hiddenLnglat,
    lnglat: hiddenLnglat,
  };

  // 专用时间信息卡配置：缺少有效坐标时由页面隐藏卡片
  var infoSrc = opts.info || {};
  var info = {
    fromName: infoSrc.fromName || '',
    fromLnglat: toGcjLnglat(infoSrc.bd),
    toPointIndex: infoSrc.toPointIndex,
  };

  return {
    points: points,
    goRoutes: goRoutes,
    backRoutes: backRoutes,
    hiddenLeg: hiddenLeg,
    info: info,
    getPoint: getPoint,
    getRoutePoints: getRoutePoints,
  };
}

// 拥堵状态：0未知 1畅通 2缓行 3拥堵 4严重拥堵
export const CONGESTION = {
  0: { level: 0, text: '未知', cls: 'unknown' },
  1: { level: 1, text: '畅通', cls: 'smooth' },
  2: { level: 2, text: '缓行', cls: 'slow' },
  3: { level: 3, text: '拥堵', cls: 'jam' },
  4: { level: 4, text: '严重拥堵', cls: 'bad' },
};

// 高德 2.0 tmcs[].status 直接返回中文拥堵描述字符串（"畅通"/"缓行"/"拥堵"/"严重拥堵"/"未知"）
// 旧版返回数字 0~4。这里统一兼容两种格式，返回拥堵配置对象。
var CONGESTION_TEXT_MAP = {
  '未知': CONGESTION[0],
  '畅通': CONGESTION[1],
  '缓行': CONGESTION[2],
  '拥堵': CONGESTION[3],
  '严重拥堵': CONGESTION[4],
  // 兼容"严重拥堵"的别称
  '严重': CONGESTION[4],
};
export function parseCongestion(status) {
  if (status === undefined || status === null) return CONGESTION[0];
  // 数字格式（0~4）
  if (typeof status === 'number') return CONGESTION[status] || CONGESTION[0];
  // 字符串格式：可能是中文描述，也可能是数字字符串
  if (typeof status === 'string') {
    if (CONGESTION_TEXT_MAP[status]) return CONGESTION_TEXT_MAP[status];
    var n = Number(status);
    if (!isNaN(n) && CONGESTION[n]) return CONGESTION[n];
  }
  return CONGESTION[0];
}

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

// 将定位点投影到路线，计算其在整条路线上的进度百分比（0~100）
// 遍历 rawRoute.steps[].path 累计距离，找离定位点最近的路径点，按累计距离占比返回百分比
// 定位点离路线过远（>1km）返回 null，表示不在路线上
// 供路况条"我"标记定位使用，web 横条与移动端卡片共用
export function locateOnRoute(currentLnglat, rawRoute) {
  if (!currentLnglat || !rawRoute || !rawRoute.steps || !rawRoute.steps.length) return null;
  var pts = [];
  var cum = 0;
  var prev = null;
  rawRoute.steps.forEach(function (step) {
    if (!step.path || !step.path.length) return;
    step.path.forEach(function (p) {
      var lng = p[0] !== undefined ? p[0] : p.lng;
      var lat = p[1] !== undefined ? p[1] : p.lat;
      if (prev) {
        cum += Math.sqrt((lng - prev[0]) * (lng - prev[0]) + (lat - prev[1]) * (lat - prev[1]));
      }
      pts.push({ lng: lng, lat: lat, cum: cum });
      prev = [lng, lat];
    });
  });
  if (!pts.length) return null;
  var total = pts[pts.length - 1].cum;
  if (total <= 0) return null;
  var best = null;
  var bestDist = Infinity;
  pts.forEach(function (p) {
    var dx = p.lng - currentLnglat[0];
    var dy = p.lat - currentLnglat[1];
    var d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  });
  if (!best) return null;
  // 距离过远视为不在路线上（阈值约 1km，经纬度平方约 0.0001）
  if (bestDist > 0.0001) return null;
  return Math.max(0, Math.min(100, (best.cum / total) * 100));
}

// 整体拥堵等级（0~4）：与 parseRoute 的 jamRatio 逻辑一致
// segments 为 parseRoute 产出的分段拥堵数组，level>=3 计为拥堵段
export function overallCongestionLevel(segments) {
  if (!segments || !segments.length) return 0;
  var jam = 0;
  segments.forEach(function (s) {
    if (s.level >= 3) jam++;
  });
  var ratio = jam / segments.length;
  if (ratio > 0.5) return 4;
  if (ratio > 0.3) return 3;
  if (ratio > 0.1) return 2;
  return 1;
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

/**
 * 清空排队中未执行的任务（已发出正在执行的无法取消）。
 * 快速刷新时调用，丢弃旧请求的排队任务，减轻队列堆积卡顿。
 */
export function clearAMapQueue() {
  _queue.length = 0;
}
