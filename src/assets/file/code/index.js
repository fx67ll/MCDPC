// @name: codeSource
// @description：组件源码统一注册中心。通过 raw-loader 读取 .vue 原始文件内容，
//              新增组件只需在下方注册表加一行，无需手动维护转义字符串，源码永远与实际同步。
//              使用：在组件中调用 this.$router.push({ path: '/code', query: { code: 'MapCanvas' } })

// raw-loader 读取 .vue 源文件原始文本（含 template/script/style）
// 兼容 raw-loader 0.5（直接返回字符串）与新版（返回 {default: string}）
function raw(req) {
	return (req && req.default !== undefined) ? req.default : req;
}
const MapCanvas = raw(require('!raw-loader!@v/Map/MapCanvas/MapCanvas.vue'));
const SplitArea = raw(require('!raw-loader!@v/Map/SplitArea/SplitArea.vue'));
const HeatMapPoint = raw(require('!raw-loader!@v/Map/HeatMapPoint/HeatMapPoint.vue'));
const FlyLine3D = raw(require('!raw-loader!@v/Map/FlyLine3D/FlyLine3D.vue'));
const GlowWall3D = raw(require('!raw-loader!@v/Map/GlowWall3D/GlowWall3D.vue'));

// 源码注册表：key 为路由 query.code 的值，value 为源码文本
const codeMap = {
	MapCanvas: MapCanvas,
	SplitArea: SplitArea,
	HeatMapPoint: HeatMapPoint,
	FlyLine3D: FlyLine3D,
	GlowWall3D: GlowWall3D
};

/**
 * 根据 code 获取源码文本
 * @param {String} code 注册表 key
 * @returns {String} 源码文本，未找到返回 null
 */
export function getCode(code) {
	return codeMap[code] || null;
}

export default codeMap;
