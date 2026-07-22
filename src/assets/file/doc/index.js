// @name: docSource
// @description：组件文档统一数据源。每个组件一份结构化文档（描述/属性/方法/事件），
//              CodeDoc 页面按 query.code 取对应文档展示。新增组件只需在下方加一份配置。

const docs = {
	MapCanvas: {
		description: 'MapCanvas · 地图标注绘图工具',
		Attributes: [
			{ param: '—（内部配置）', descrbition: '地图中心、缩放、底图样式在组件内固定配置，以南京为中心', type: '—', chooseValue: '—', defaultValue: '南京 [118.779611, 32.016625], zoom 12' }
		],
		Methods: [
			{ methods: 'setMode(mode)', descrbition: '切换绘制模式并进入绘制', methods2: "mode: 'polygon' | 'freedraw' | 'measure'" },
			{ methods: 'finishShape()', descrbition: '完成当前图形并存入图形列表', methods2: '—' },
			{ methods: 'undo()', descrbition: '撤销当前路径最后一个点 / 撤销上一个图形', methods2: '—' },
			{ methods: 'clearAll()', descrbition: '清空所有图形', methods2: '—' },
			{ methods: 'drawDemo()', descrbition: '加载南京演示区域图形', methods2: '—' },
			{ methods: 'exportPng()', descrbition: '导出画布为 PNG 图片', methods2: '—' },
			{ methods: 'exportJson()', descrbition: '导出所有图形坐标为 JSON', methods2: '—' },
			{ methods: 'toggleShape(i) / removeShape(i) / focusShape(i)', descrbition: '图形显隐 / 删除 / 聚焦定位', methods2: 'i: 图形下标' }
		],
		Events: [
			{ events: 'map click', descrbition: '多边形/测距模式下点击取点', events2: 'lnglat' },
			{ events: 'map dblclick', descrbition: '双击结束当前绘制', events2: '—' },
			{ events: 'map mousedown/mousemove/mouseup', descrbition: '手绘模式按住拖动绘制', events2: 'lnglat' }
		],
		Slot: [
			{ slot: '—', descrbition: '无插槽，工具面板内置' }
		]
	},
	SplitArea: {
		description: 'SplitArea · 行政区划逐级下钻',
		Attributes: [
			{ param: 'mode', descrbition: '显示模式', type: 'String', chooseValue: 'lite / full', defaultValue: 'lite' },
			{ param: 'NANJING_CENTER', descrbition: '视觉中心点', type: 'Array', chooseValue: '[lng, lat]', defaultValue: '[118.7969, 32.0603]' },
			{ param: 'PRIORITY_PROVINCES', descrbition: '个人私用模式优先展示省份', type: 'Array', chooseValue: '—', defaultValue: '江苏、安徽' },
			{ param: 'LITE_PROVINCE_CITIES', descrbition: '私用模式各省限定展示的市', type: 'Object', chooseValue: '—', defaultValue: '江苏→南京, 安徽→马鞍山' }
		],
		Methods: [
			{ methods: 'drawArea(adcode, level)', descrbition: '查询并绘制指定行政区的下级区域', methods2: 'adcode, level' },
			{ methods: 'drillDown(areaInfo) / drillUp(index)', descrbition: '下钻 / 面包屑回溯', methods2: 'areaInfo / index' },
			{ methods: 'switchMode(mode)', descrbition: '切换个人私用/全国通用模式', methods2: "mode: 'lite' | 'full'" },
			{ methods: 'runGrouped(items, taskFn, token, onAllDone)', descrbition: '分组节流执行器（每组3个，间隔1.23s）', methods2: '—' }
		],
		Events: [
			{ events: 'polygon click', descrbition: '点击区域下钻', events2: 'areaInfo' },
			{ events: 'polygon mouseover/mouseout', descrbition: '悬浮高亮', events2: '—' },
			{ events: 'map moveend', descrbition: '拖动后懒加载视口所在省份（仅全国模式）', events2: '—' }
		],
		Slot: [{ slot: '—', descrbition: '无插槽' }]
	},
	HeatMapPoint: {
		description: 'HeatMapPoint · 24小时动态热力图',
		Attributes: [
			{ param: 'currentHour', descrbition: '当前小时（0-23）', type: 'Number', chooseValue: '0 ~ 23', defaultValue: '9' },
			{ param: 'intensity', descrbition: '热力强度百分比', type: 'Number', chooseValue: '20 ~ 100', defaultValue: '80' },
			{ param: 'isPlaying', descrbition: '是否播放中', type: 'Boolean', chooseValue: 'true / false', defaultValue: 'false' },
			{ param: 'hourWeights', descrbition: '24小时人口活跃度权重', type: 'Array', chooseValue: '—', defaultValue: '城市典型曲线' }
		],
		Methods: [
			{ methods: 'updateHeat()', descrbition: '根据当前小时生成数据并刷新热力图层', methods2: '—' },
			{ methods: 'togglePlay() / startPlay() / stopPlay()', descrbition: '播放控制', methods2: '—' },
			{ methods: 'resetTime()', descrbition: '重置到 9 点', methods2: '—' }
		],
		Events: [
			{ events: 'time-slider input', descrbition: '时间轴拖动', events2: 'hour' },
			{ events: 'map complete', descrbition: '地图加载完成后渲染热力', events2: '—' }
		],
		Slot: [{ slot: '—', descrbition: '无插槽' }]
	},
	FlyLine3D: {
		description: 'FlyLine2D · 2D 关联飞线可视化',
		Attributes: [
			{ param: 'currentHub', descrbition: '中心区域下标', type: 'Number', chooseValue: '0 ~ 10', defaultValue: '4（浦口区）' },
			{ param: 'hubs', descrbition: '中心区域候选（南京11区）', type: 'Array', chooseValue: '—', defaultValue: 'NANJING_HUBS' }
		],
		Methods: [
			{ methods: 'drawFlyLines()', descrbition: '绘制从中心区到其他区的贝塞尔飞线', methods2: '—' },
			{ methods: 'addBezierLine(start, end, idx)', descrbition: '单条二次贝塞尔飞线 + 流动光点', methods2: '—' },
			{ methods: 'switchHub(index)', descrbition: '切换中心区域', methods2: 'index' },
			{ methods: 'startAnim()', descrbition: '光点沿飞线流动动画', methods2: '—' }
		],
		Events: [
			{ events: 'hub-item click', descrbition: '切换中心区域', events2: 'index' }
		],
		Slot: [{ slot: '—', descrbition: '无插槽' }]
	},
	GlowWall3D: {
		description: 'GlowWall3D · 3D 立体光墙雷达扫描',
		Attributes: [
			{ param: 'currentCity', descrbition: '当前监控区域下标', type: 'Number', chooseValue: '0 ~ 10', defaultValue: '4（浦口区）' },
			{ param: 'cities', descrbition: '监控区域列表（南京11区）', type: 'Array', chooseValue: '—', defaultValue: 'NANJING_DISTRICTS' }
		],
		Methods: [
			{ methods: 'drawCity()', descrbition: '绘制当前区域光墙/雷达/告警点', methods2: '—' },
			{ methods: 'addGlowWall(path)', descrbition: '区域发光描边', methods2: 'path: 边界坐标' },
			{ methods: 'addRadar(center)', descrbition: '雷达圆环 + 旋转扫描扇形', methods2: 'center' },
			{ methods: 'addAlertPoints(city, center)', descrbition: '围绕中心分布告警点', methods2: '—' },
			{ methods: 'switchCity(index)', descrbition: '切换监控区域', methods2: 'index' }
		],
		Events: [
			{ events: 'city-item click', descrbition: '切换监控区域', events2: 'index' },
			{ events: 'radar rotate (timer)', descrbition: '雷达扇形每 50ms 旋转 4°', events2: '—' }
		],
		Slot: [{ slot: '—', descrbition: '无插槽' }]
	}
};

/**
 * 根据 code 获取文档数据
 * @param {String} code 注册表 key
 * @returns {Object} 文档对象，未找到返回空结构
 */
export function getDoc(code) {
	return docs[code] || { description: '暂无文档', Attributes: [], Events: [], Methods: [], Slot: [] };
}

export default docs;
