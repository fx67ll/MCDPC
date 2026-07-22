// @name: amapLoader
// @author: fx67ll
// @version: 1.1.0
// @description：高德地图 JS API 2.0 按需加载工具类，基于 @amap/amap-jsapi-loader 封装。
//              各子组件使用时再加载对应插件，不使用则不加载，首页不再引入高德依赖。
//              统一管理 key、版本、安全密钥、插件清单与 Loca 可视化库的懒加载。
//              注意：2.0 下 AMap.Object3DLayer / Object3D.* 等 3D 类需加载 AMap.Map3D 插件后方可使用。

import AMapLoader from '@amap/amap-jsapi-loader';

// 高德开放平台申请的 key
const AMAP_KEY = '73da1512a62077c0b3ac9b504ddf8933';
// JS API 版本，使用 2.0
const AMAP_VERSION = '2.0';
// 安全密钥（2021-12-02 之后申请的 JS API key 必须配置 securityJsCode，否则加载报 INVALID_USER_KEY）
const AMAP_SECURITY_CODE = '0c926d0125b76ad1821786253d7dc186';

// 全局已加载的 AMap 单例，避免重复加载脚本
let AMapPromise = null;
// 已注册的插件集合，避免重复注册
let loadedPlugins = {};

// 安全密钥配置（必须在 AMapLoader.load 之前设置）
function setupSecurity() {
  if (AMAP_SECURITY_CODE) {
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_CODE,
    };
  }
}

/**
 * 用 AMap.plugin 补注册尚未加载的插件。
 * 2.0 下 amap-jsapi-loader 初次 load 的 plugins 会注册，但后续调用想补加插件时
 * 必须显式用 AMap.plugin 注册，否则会出现 "X is not a constructor"。
 * 带超时容错：若传入的插件名在 2.0 不存在（如某些 1.4 遗留名），回调不触发也不阻断主流程。
 * @param {AMap} AMap
 * @param {Array<String>} plugins
 * @returns {Promise<AMap>}
 */
function ensurePlugins(AMap, plugins) {
  if (!plugins || plugins.length === 0) {
    return Promise.resolve(AMap);
  }
  var need = plugins.filter(function (p) {
    return !loadedPlugins[p];
  });
  if (need.length === 0) {
    return Promise.resolve(AMap);
  }
  return new Promise(function (resolve) {
    var done = false;
    // 超时兜底：无效插件名不会触发回调，3 秒后强制放行，避免卡死
    var timer = setTimeout(function () {
      if (!done) {
        done = true;
        resolve(AMap);
      }
    }, 3000);
    try {
      AMap.plugin(need, function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        need.forEach(function (p) {
          loadedPlugins[p] = true;
        });
        resolve(AMap);
      });
    } catch (e) {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(AMap);
      }
    }
  });
}

/**
 * 加载高德地图 JS API 2.0 及指定插件。
 * 多次调用会复用同一 AMap 单例，并补注册新请求的插件。
 * @param {Array<String>} plugins 需要加载的插件清单，如 ['AMap.DistrictSearch','AMap.HeatMap','AMap.ControlBar','AMap.Map3D']
 * @returns {Promise<AMap>} 返回 AMap 命名空间
 */
export function loadAMap(plugins) {
  var want = plugins || [];
  if (!AMapPromise) {
    setupSecurity();
    AMapPromise = AMapLoader.load({
      key: AMAP_KEY,
      version: AMAP_VERSION,
      plugins: want,
    })
      .then(function (AMap) {
        want.forEach(function (p) {
          loadedPlugins[p] = true;
        });
        return AMap;
      })
      .catch(function (err) {
        AMapPromise = null;
        throw err;
      });
  }
  return AMapPromise.then(function (AMap) {
    return ensurePlugins(AMap, want);
  });
}

/**
 * 加载 Loca 数据可视化库（用于 3D 飞线、光柱、热力等高级可视化）。
 * Loca 依赖 AMap 全局对象，必须先 loadAMap 成功后再调用。
 * @param {AMap} AMap 已加载的 AMap 命名空间
 * @returns {Promise<Loca>} 返回 Loca 命名空间
 */
export function loadLoca(AMap) {
  if (window.Loca) {
    return Promise.resolve(window.Loca);
  }
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    // Loca v2 官方脚本地址，需与 JS API 2.0 配合
    script.src = 'https://webapi.amap.com/loca?v=2.0&key=' + AMAP_KEY;
    script.onload = function () {
      if (window.Loca) {
        resolve(window.Loca);
      } else {
        reject(new Error('Loca 加载失败：脚本已执行但未挂载到 window.Loca'));
      }
    };
    script.onerror = function () {
      reject(new Error('Loca 脚本加载失败，请检查网络'));
    };
    document.head.appendChild(script);
  });
}

export default {
  loadAMap: loadAMap,
  loadLoca: loadLoca,
};
