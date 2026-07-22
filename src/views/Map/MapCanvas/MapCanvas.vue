<!-- @name: MapCanvas -->
<!-- @author: fx67ll -->
<!-- @version: 3.0.0-->
<!-- @description：基于高德地图 JS API 2.0 的地图标注绘图工具，使用 AMap.CustomLayer 自定义图层渲染。
                支持多边形绘制、自由手绘、测距测面、样式可调、多图形管理、撤销/清空/导出 PNG 与坐标 JSON。
                地图通过 src/utils/amapLoader.js 按需懒加载。 -->
<!-- @update: 2026年-v3.0.0，增量增强为完整绘图工具：多模式 + 样式面板 + 图形管理 + 导出，UI 统一玻璃质感 -->

<template>
	<div class="mapcanvas">
		<!-- 左侧工具面板 -->
		<div class="panel">
			<div class="panel-title">
				<span class="panel-title-icon">✏️</span>
				<span class="panel-title-text">绘图工具</span>
				<span class="status-badge" :class="'status-' + drawStatus">{{ drawStatusText }}</span>
			</div>

			<!-- 绘制模式 -->
			<div class="panel-section">
				<div class="section-label">绘制模式</div>
				<div class="mode-grid">
					<div class="mode-item" :class="{ active: drawMode === 'polygon' && isDrawing }" @click="setMode('polygon')">
						<span class="mode-icon">◢</span><span>多边形</span>
					</div>
					<div class="mode-item" :class="{ active: drawMode === 'freedraw' && isDrawing }" @click="setMode('freedraw')">
						<span class="mode-icon">〰</span><span>手绘</span>
					</div>
					<div class="mode-item" :class="{ active: drawMode === 'measure' && isDrawing }" @click="setMode('measure')">
						<span class="mode-icon">↔</span><span>测距测面</span>
					</div>
				</div>
				<div class="mode-tip">{{ modeTip }}</div>
			</div>

			<!-- 样式 -->
			<div class="panel-section">
				<div class="section-label">样式</div>
				<div class="style-row">
					<span class="style-key">线宽</span>
					<input class="range" type="range" min="1" max="20" step="1" v-model.number="style.width" @input="render" />
					<span class="style-val">{{ style.width }}px</span>
				</div>
				<div class="style-row">
					<span class="style-key">线色</span>
					<input class="color" type="color" v-model="style.stroke" @input="render" />
					<span class="style-val">{{ style.stroke }}</span>
				</div>
				<div class="style-row">
					<span class="style-key">填充</span>
					<input class="color" type="color" v-model="style.fill" @input="render" />
					<span class="style-val">{{ style.fill }}</span>
				</div>
				<div class="style-row">
					<span class="style-key">透明度</span>
					<input class="range" type="range" min="0" max="1" step="0.1" v-model.number="style.opacity" @input="render" />
					<span class="style-val">{{ style.opacity }}</span>
				</div>
				<div class="style-row">
					<span class="style-key">渐变</span>
					<select class="select" v-model="style.gradient" @change="render">
						<option value="none">无</option>
						<option value="horizontal">水平</option>
						<option value="vertical">垂直</option>
						<option value="diagonal">对角</option>
					</select>
				</div>
			</div>

			<!-- 操作 -->
			<div class="panel-section">
				<div class="section-label">操作</div>
				<div class="btn-row">
					<div class="op-btn" @click="finishShape"><span>✓</span>完成</div>
					<div class="op-btn" @click="undo"><span>↶</span>撤销</div>
					<div class="op-btn" @click="clearAll"><span>✕</span>清空</div>
				</div>
				<div class="btn-row">
					<div class="op-btn" @click="drawDemo"><span>★</span>演示</div>
					<div class="op-btn" @click="exportPng"><span>🖼</span>导出图</div>
					<div class="op-btn" @click="exportJson"><span>{ }</span>导出JSON</div>
				</div>
			</div>

			<!-- 图形列表 -->
			<div class="panel-section section-shapes">
				<div class="section-label">图形列表 <span class="count">{{ shapes.length }}</span></div>
				<div class="shape-list">
					<div class="shape-empty" v-if="shapes.length === 0">暂无图形，选择模式后在地图上绘制</div>
					<div class="shape-item" v-for="(s, i) in shapes" :key="i">
						<span class="shape-dot" :style="{ background: s.style.stroke }"></span>
						<span class="shape-name" @click="focusShape(i)">{{ s.name }}</span>
						<span class="shape-toggle" @click="toggleShape(i)">{{ s.visible ? '👁' : '—' }}</span>
						<span class="shape-del" @click="removeShape(i)">✕</span>
					</div>
				</div>
			</div>

			<!-- 测量结果 -->
			<div class="panel-section" v-if="measureResult.show">
				<div class="section-label">测量结果</div>
				<div class="measure-row">周长：<b>{{ measureResult.length }}</b></div>
				<div class="measure-row">面积：<b>{{ measureResult.area }}</b></div>
			</div>

			<!-- 文档入口移至右边缘收缩胶囊（view-source-btn），此处不再放置 -->
		</div>

		<!-- 源码/文档入口（右边缘收缩胶囊） -->
		<view-source-btn code="MapCanvas"></view-source-btn>

		<!-- 提示 toast -->
		<transition name="toast-fade">
			<div class="mc-toast" :class="'toast-' + toast.type" v-if="toast.show">
				<span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
				<span class="toast-text">{{ toast.text }}</span>
			</div>
		</transition>

		<!-- 地图右上角绘制状态浮层，提示用户当前是否可绘图 -->
		<div class="draw-hint" :class="'hint-' + drawStatus" v-show="showDrawHint">
			<span class="hint-dot"></span>
			<span class="hint-text">{{ drawStatusText }}</span>
		</div>

		<div id="map-container" ref="map"></div>
	</div>
</template>

<script>
import _ from 'underscore';
import { loadAMap } from '@/utils/amapLoader.js';

export default {
	name: 'MapCanvas',
	data() {
		return {
			AMap: null,
			map: null,
			Canvas: null,
			CanvasContext: null,
			customLayer: null,
			CanvasSize: [0, 0],
			// 绘制模式：polygon 多边形（点击取点）/ freedraw 手绘 / measure 测距测面
			drawMode: 'polygon',
			// 当前正在绘制的点集 [{x:lng,y:lat}]
			currentPath: [],
			// 是否正在绘制（锁定地图）
			isDrawing: false,
			// 手绘模式鼠标按下状态
			isFreeDrawing: false,
			// 已完成的图形列表
			shapes: [],
			// 可调样式
			style: {
				width: 4,
				stroke: '#42b983',
				fill: '#80d8ff',
				opacity: 0.5,
				gradient: 'none'
			},
			// 测量结果
			measureResult: { show: false, length: '0 m', area: '0 m²' },
			// toast
			toast: { show: false, type: 'success', text: '' },
			toastTimer: null,
			shapeSeq: 0,
			// 演示数据（南京区域）
			testData: [
				{ x: 118.739314, y: 32.041765 },
				{ x: 118.806605, y: 32.036963 },
				{ x: 118.827977, y: 32.018335 },
				{ x: 118.838878, y: 32.002251 },
				{ x: 118.804546, y: 31.989876 },
				{ x: 118.776736, y: 31.988784 },
				{ x: 118.75236, y: 31.994389 },
				{ x: 118.739829, y: 32.005817 },
				{ x: 118.743863, y: 32.032307 },
				{ x: 118.717599, y: 32.032962 }
			]
		};
	},
	computed: {
		modeTip() {
			if (this.drawMode === 'polygon') return '点击地图取点，双击或点「完成」闭合';
			if (this.drawMode === 'freedraw') return '按住鼠标拖动自由绘制';
			if (this.drawMode === 'measure') return '点击取点，双击结束并显示周长面积';
			return '';
		},
		// 绘图状态：idle 待绘制 / drawing 绘制中 / paused 已退出
		drawStatus() {
			if (this.isDrawing) return 'drawing';
			if (this.shapes.length > 0 || this.currentPath.length > 0) return 'paused';
			return 'idle';
		},
		drawStatusText() {
			if (this.drawStatus === 'drawing') {
				var name = { polygon: '多边形', freedraw: '手绘', measure: '测距' }[this.drawMode];
				return '绘制中·' + name;
			}
			if (this.drawStatus === 'paused') return '已退出·点击模式继续';
			return '待绘制·选择模式开始';
		},
		// 浮层只在绘制中/已退出时显示，待绘制时不显示（避免初始空地图上一堆提示）
		showDrawHint() {
			return this.drawStatus !== 'idle';
		}
	},
	mounted() {
		this.mapInit();
	},
	beforeDestroy() {
		if (this.toastTimer) clearTimeout(this.toastTimer);
		if (this.map) {
			this.map.destroy();
			this.map = null;
		}
	},
	methods: {
		mapInit() {
			var self = this;
			loadAMap([]).then(function (AMap) {
				self.AMap = AMap;
				self.map = new AMap.Map('map-container', {
					center: [118.779611, 32.016625],
					zoom: 12,
					mapStyle: 'amap://styles/whitesmoke',
					showIndoorMap: false
				});

				self.initCustomLayer();

				// 点击取点（polygon / measure 模式）
				self.map.on('click', function (e) {
					if (!self.isDrawing) return;
					if (self.drawMode === 'polygon' || self.drawMode === 'measure') {
						self.currentPath.push({ x: e.lnglat.getLng(), y: e.lnglat.getLat() });
						self.render();
						if (self.drawMode === 'measure') self.updateMeasure();
					}
				});

				// 双击结束当前绘制
				self.map.on('dblclick', function () {
					if (self.isDrawing) self.finishShape();
				});

				// 手绘模式
				self.map.on('mousedown', function (e) {
					if (!self.isDrawing || self.drawMode !== 'freedraw') return;
					self.isFreeDrawing = true;
					self.currentPath = [{ x: e.lnglat.getLng(), y: e.lnglat.getLat() }];
					self.render();
				});
				self.map.on('mousemove', function (e) {
					if (!self.isFreeDrawing) return;
					self.currentPath.push({ x: e.lnglat.getLng(), y: e.lnglat.getLat() });
					self.render();
				});
				self.map.on('mouseup', function () {
					if (self.isFreeDrawing) {
						self.isFreeDrawing = false;
						self.finishShape();
					}
				});
			}).catch(function (err) {
				console.error('MapCanvas 加载失败:', err);
			});
		},
		initCustomLayer() {
			var self = this;
			var canvas = document.createElement('canvas');
			canvas.classList.add('canvas-new');
			self.Canvas = canvas;
			self.CanvasContext = canvas.getContext('2d');
			self.customLayer = new self.AMap.CustomLayer(canvas, {
				zIndex: 120,
				zooms: [3, 18]
			});
			self.customLayer.render = function () {
				self.renderCanvas();
			};
			self.map.add(self.customLayer);
		},
		render() {
			if (this.customLayer) this.customLayer.render();
		},
		// 渲染：先画已完成图形，再画当前正在绘制的路径
		renderCanvas() {
			var self = this;
			var map = self.map;
			var context = self.CanvasContext;
			var canvas = self.Canvas;
			if (!map || !context || !canvas) return;
			var size = map.getSize();
			var dpr = window.devicePixelRatio || 1;
			if (canvas.width !== size.width * dpr || canvas.height !== size.height * dpr) {
				canvas.width = size.width * dpr;
				canvas.height = size.height * dpr;
				canvas.style.width = size.width + 'px';
				canvas.style.height = size.height + 'px';
			}
			self.CanvasSize = [size.width, size.height];
			context.setTransform(dpr, 0, 0, dpr, 0, 0);
			context.clearRect(0, 0, size.width, size.height);

			// 绘制已完成图形
			for (var i = 0; i < self.shapes.length; i++) {
				var s = self.shapes[i];
				if (!s.visible) continue;
				self.drawShape(map, context, s.path, s.style, true);
			}

			// 绘制当前路径
			if (self.currentPath.length > 0) {
				var isClosed = self.drawMode !== 'measure' && self.currentPath.length > 2;
				self.drawShape(map, context, self.currentPath, self.style, isClosed);
				// 顶点标记
				self.drawVertices(map, context, self.currentPath);
			}
		},
		// 绘制单个图形（线或闭合区域）
		drawShape(map, context, path, style, closed) {
			if (!path || path.length === 0) return;
			var pixels = path.map(function (p) {
				return map.lngLatToContainer(new this.AMap.LngLat(p.x, p.y));
			}, this);

			context.lineWidth = style.width;
			context.lineCap = 'round';
			context.lineJoin = 'round';
			context.shadowColor = 'rgba(0,0,0,0.2)';
			context.shadowBlur = 4;
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;

			context.beginPath();
			context.moveTo(pixels[0].x, pixels[0].y);
			for (var i = 1; i < pixels.length; i++) {
				context.lineTo(pixels[i].x, pixels[i].y);
			}
			if (closed) context.closePath();

			// 线条渐变
			var start = pixels[0];
			var end = pixels[pixels.length - 1];
			context.strokeStyle = this.makeGradient(context, start, end, style.stroke, style.gradient);
			if (closed) {
				context.fillStyle = this.hexToRgba(style.fill, style.opacity);
				context.fill();
			}
			context.stroke();
		},
		// 顶点小圆点
		drawVertices(map, context, path) {
			context.shadowBlur = 0;
			for (var i = 0; i < path.length; i++) {
				var px = map.lngLatToContainer(new this.AMap.LngLat(path[i].x, path[i].y));
				context.beginPath();
				context.arc(px.x, px.y, 4, 0, Math.PI * 2);
				context.fillStyle = '#ffffff';
				context.fill();
				context.lineWidth = 2;
				context.strokeStyle = this.style.stroke;
				context.stroke();
			}
		},
		// 生成渐变或纯色
		makeGradient(context, start, end, color, direction) {
			if (direction === 'none' || !start) return color;
			var gx1 = start.x, gy1 = start.y, gx2 = end.x, gy2 = end.y;
			if (direction === 'horizontal') { gy1 = gy2 = start.y; gx2 = end.x; }
			if (direction === 'vertical') { gx1 = gx2 = start.x; gy2 = end.y; }
			var g = context.createLinearGradient(gx1, gy1, gx2, gy2);
			g.addColorStop(0, color);
			g.addColorStop(1, this.hexToRgba(color, 0.4));
			return g;
		},
		hexToRgba(hex, alpha) {
			var h = hex.replace('#', '');
			if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
			var r = parseInt(h.substring(0, 2), 16) || 0;
			var g = parseInt(h.substring(2, 4), 16) || 0;
			var b = parseInt(h.substring(4, 6), 16) || 0;
			return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
		},
		// 设置模式并进入/退出绘制
		setMode(mode) {
			var self = this;
			if (self.drawMode === mode && self.isDrawing) {
				// 再次点击同模式则退出绘制
				self.exitDrawing();
				return;
			}
			self.drawMode = mode;
			self.currentPath = [];
			self.isDrawing = true;
			self.measureResult.show = false;
			// 所有绘制模式均锁定地图拖动，避免与绘制事件冲突
			if (mode === 'freedraw') {
				self.map.setStatus({ dragEnable: false, doubleClickZoom: false, zoomEnable: true });
				self.showToast('success', '手绘模式：按住鼠标拖动绘制');
			} else {
				self.map.setStatus({ dragEnable: false, doubleClickZoom: false, zoomEnable: true });
				self.showToast('success', mode === 'measure' ? '测距模式：点击取点，双击结束' : '多边形模式：点击取点，双击或完成闭合');
			}
			self.render();
		},
		exitDrawing() {
			var self = this;
			self.isDrawing = false;
			self.isFreeDrawing = false;
			self.currentPath = [];
			self.map.setStatus({ dragEnable: true, doubleClickZoom: true, zoomEnable: true });
			self.render();
		},
		// 完成当前图形
		finishShape() {
			var self = this;
			if (!self.isDrawing) return;
			if (self.currentPath.length < 2) {
				self.showToast('error', '至少需要 2 个点');
				return;
			}
			if (self.drawMode === 'measure') {
				self.updateMeasure();
				self.measureResult.show = true;
				self.showToast('success', '测量完成');
				// 测量不存为图形，保留当前路径展示，退出绘制
				self.isDrawing = false;
				self.map.setStatus({ dragEnable: true, doubleClickZoom: true, zoomEnable: true });
				return;
			}
			self.shapeSeq++;
			var modeName = self.drawMode === 'freedraw' ? '手绘' : '多边形';
			self.shapes.push({
				name: modeName + ' ' + self.shapeSeq,
				path: self.currentPath.slice(),
				style: {
					width: self.style.width,
					stroke: self.style.stroke,
					fill: self.style.fill,
					opacity: self.style.opacity,
					gradient: self.style.gradient
				},
				visible: true
			});
			self.currentPath = [];
			self.isDrawing = false;
			self.map.setStatus({ dragEnable: true, doubleClickZoom: true, zoomEnable: true });
			self.showToast('success', '图形已添加');
			self.render();
		},
		undo() {
			var self = this;
			if (self.isDrawing && self.currentPath.length > 0) {
				// 撤销当前路径最后一个点
				self.currentPath.pop();
				if (self.drawMode === 'measure') self.updateMeasure();
				self.render();
				self.showToast('success', '已撤销一个点');
			} else if (self.shapes.length > 0) {
				self.shapes.pop();
				self.render();
				self.showToast('success', '已撤销上一个图形');
			} else {
				self.showToast('error', '没有可撤销的内容');
			}
		},
		clearAll() {
			var self = this;
			self.shapes = [];
			self.currentPath = [];
			self.measureResult.show = false;
			self.exitDrawing();
			self.showToast('success', '已清空');
		},
		toggleShape(i) {
			this.shapes[i].visible = !this.shapes[i].visible;
			this.render();
		},
		removeShape(i) {
			this.shapes.splice(i, 1);
			this.render();
			this.showToast('success', '已删除');
		},
		focusShape(i) {
			var s = this.shapes[i];
			if (!s.path.length) return;
			// 取所有点的外接矩形中心
			var lngs = s.path.map(function (p) { return p.x; });
			var lats = s.path.map(function (p) { return p.y; });
			var clng = (Math.min.apply(null, lngs) + Math.max.apply(null, lngs)) / 2;
			var clat = (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2;
			this.map.setZoomAndCenter(13, [clng, clat]);
		},
		// 计算周长与面积
		updateMeasure() {
			var self = this;
			var path = self.currentPath;
			if (path.length < 2) {
				self.measureResult.length = '0 m';
				self.measureResult.area = '0 m²';
				return;
			}
			var length = 0;
			for (var i = 1; i < path.length; i++) {
				length += self.distance(path[i - 1], path[i]);
			}
			self.measureResult.length = self.formatLength(length);
			if (path.length >= 3) {
				self.measureResult.area = self.formatArea(self.area(path));
			} else {
				self.measureResult.area = '0 m²';
			}
		},
		// 两点距离（米），简化用经纬度差 × 每度米数
		distance(a, b) {
			var R = 6371000;
			var dLat = (b.y - a.y) * Math.PI / 180;
			var dLng = (b.x - a.x) * Math.PI / 180;
			var lat1 = a.y * Math.PI / 180;
			var lat2 = b.y * Math.PI / 180;
			var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
			return 2 * R * Math.asin(Math.sqrt(h));
		},
		// 多边形面积（球面近似，平方米）
		area(path) {
			var R = 6371000;
			var total = 0;
			for (var i = 0; i < path.length; i++) {
				var p1 = path[i];
				var p2 = path[(i + 1) % path.length];
				total += (p2.x - p1.x) * Math.PI / 180 * (2 + Math.sin(p1.y * Math.PI / 180) + Math.sin(p2.y * Math.PI / 180));
			}
			return Math.abs(total * R * R / 2);
		},
		formatLength(m) {
			if (m > 1000) return (m / 1000).toFixed(2) + ' km';
			return m.toFixed(1) + ' m';
		},
		formatArea(a) {
			if (a > 1000000) return (a / 1000000).toFixed(2) + ' km²';
			return a.toFixed(1) + ' m²';
		},
		drawDemo() {
			var self = this;
			self.exitDrawing();
			self.shapeSeq++;
			self.shapes.push({
				name: '演示区域 ' + self.shapeSeq,
				path: self.testData.slice(),
				style: { width: 4, stroke: '#42b983', fill: '#80d8ff', opacity: 0.5, gradient: 'none' },
				visible: true
			});
			self.map.setZoomAndCenter(12, [118.779611, 32.016625]);
			setTimeout(function () { self.render(); }, 300);
			self.showToast('success', '已加载演示图形');
		},
		// 导出为 PNG 图片
		exportPng() {
			var self = this;
			if (self.shapes.length === 0 && self.currentPath.length === 0) {
				self.showToast('error', '没有可导出的图形');
				return;
			}
			try {
				var dataUrl = self.Canvas.toDataURL('image/png');
				var link = document.createElement('a');
				link.download = 'mapcanvas-' + Date.now() + '.png';
				link.href = dataUrl;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				self.showToast('success', '图片已导出');
			} catch (e) {
				self.showToast('error', '导出失败：' + e.message);
			}
		},
		// 导出坐标 JSON
		exportJson() {
			var self = this;
			if (self.shapes.length === 0) {
				self.showToast('error', '没有已完成的图形');
				return;
			}
			var data = self.shapes.map(function (s) {
				return {
					name: s.name,
					style: s.style,
					coordinates: s.path.map(function (p) { return [p.x, p.y]; })
				};
			});
			var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			var url = URL.createObjectURL(blob);
			var link = document.createElement('a');
			link.download = 'mapcanvas-' + Date.now() + '.json';
			link.href = url;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			self.showToast('success', '坐标 JSON 已导出');
		},
		showToast(type, text) {
			var self = this;
			if (self.toastTimer) clearTimeout(self.toastTimer);
			self.toast.type = type;
			self.toast.text = text;
			self.toast.show = true;
			self.toastTimer = setTimeout(function () {
				self.toast.show = false;
			}, 2500);
		}
	}
};
</script>

<style lang="less" scoped>
.mapcanvas {
	width: 100%;
	height: 100%;
	position: relative;
	background: #f5f9f7;
	.ban-user-select();

	#map-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
}

/* 左侧工具面板 */
.panel {
	position: absolute;
	top: 18px;
	left: 24px;
	z-index: 1000;
	width: 240px;
	// 高度上限留出上下边距，box-sizing 让 padding 计入高度，内容超出时内部可滚动
	max-height: calc(~'100% - 36px');
	box-sizing: border-box;
	overflow-y: auto;
	overflow-x: hidden;
	background: rgba(255, 255, 255, 0.88);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 12px;
	padding: 14px;
	box-shadow: 0 6px 24px rgba(66, 185, 131, 0.15);

	&::-webkit-scrollbar {
		width: 5px;
	}
	&::-webkit-scrollbar-thumb {
		background: rgba(66, 185, 131, 0.4);
		border-radius: 3px;
	}

	.panel-title {
		display: flex;
		align-items: center;
		gap: 6px;
		padding-bottom: 10px;
		margin-bottom: 10px;
		border-bottom: 1px solid rgba(66, 185, 131, 0.2);

		.panel-title-icon {
			font-size: 18px;
		}
		.panel-title-text {
			font-size: 15px;
			font-weight: bold;
			color: @green;
		}
		.status-badge {
			margin-left: auto;
			font-size: 10px;
			padding: 2px 8px;
			border-radius: 8px;
			font-weight: bold;
			white-space: nowrap;
		}
		.status-idle {
			background: rgba(186, 186, 186, 0.2);
			color: @grey;
		}
		.status-drawing {
			background: rgba(66, 185, 131, 0.2);
			color: @green;
			animation: status-pulse 1.4s infinite;
		}
		.status-paused {
			background: rgba(239, 142, 129, 0.2);
			color: @red;
		}
	}

	@keyframes status-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.panel-section {
		margin-bottom: 14px;

		.section-label {
			font-size: 11px;
			color: @grey;
			margin-bottom: 8px;

			.count {
				margin-left: 4px;
				background: rgba(66, 185, 131, 0.2);
				color: @green;
				padding: 0 6px;
				border-radius: 8px;
				font-size: 10px;
			}
		}

		.mode-grid {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			gap: 6px;
		}
		.mode-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 8px 2px;
			border: 1px solid rgba(66, 185, 131, 0.3);
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-size: 11px;
			color: @grey;

			.mode-icon {
				font-size: 16px;
				margin-bottom: 3px;
				color: @green;
			}
			&:hover {
				background: rgba(66, 185, 131, 0.1);
			}
			&.active {
				background: @green;
				color: #ffffff;
				border-color: @green;
				.mode-icon {
					color: #ffffff;
				}
			}
		}
		.mode-tip {
			margin-top: 6px;
			font-size: 11px;
			color: @grey;
			line-height: 1.4;
			background: rgba(66, 185, 131, 0.06);
			padding: 4px 6px;
			border-radius: 6px;
		}

		.style-row {
			display: flex;
			align-items: center;
			margin-bottom: 8px;
			font-size: 12px;

			.style-key {
				width: 46px;
				color: @grey;
			}
			.range {
				flex: 1;
				margin: 0 6px;
				height: 4px;
				-webkit-appearance: none;
				appearance: none;
				background: rgba(66, 185, 131, 0.2);
				border-radius: 2px;
				outline: none;
			}
			.range::-webkit-slider-thumb {
				-webkit-appearance: none;
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: @green;
				cursor: pointer;
			}
			.color {
				width: 28px;
				height: 22px;
				padding: 0;
				border: 1px solid rgba(66, 185, 131, 0.3);
				border-radius: 4px;
				background: none;
				cursor: pointer;
			}
			.select {
				flex: 1;
				height: 24px;
				border: 1px solid rgba(66, 185, 131, 0.3);
				border-radius: 6px;
				font-size: 12px;
				color: #2c3e50;
				outline: none;
				padding: 0 4px;
			}
			.style-val {
				width: 60px;
				text-align: right;
				font-size: 11px;
				color: #2c3e50;
			}
		}

		.btn-row {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			gap: 6px;
			margin-bottom: 6px;
		}
		.op-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 3px;
			padding: 7px 2px;
			font-size: 11px;
			color: @green;
			border: 1px solid rgba(66, 185, 131, 0.4);
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s ease;
			white-space: nowrap;
		}
		.op-btn:hover {
			background: @green;
			color: #ffffff;
		}
		.op-btn-ghost {
			color: @grey;
			border-color: rgba(186, 186, 186, 0.4);
		}
		.op-btn-ghost:hover {
			background: @grey;
			color: #ffffff;
		}

		.shape-list {
			max-height: 140px;
			overflow-y: auto;
		}
		.shape-empty {
			font-size: 11px;
			color: @grey;
			text-align: center;
			padding: 12px 0;
		}
		.shape-item {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 5px 4px;
			border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
			font-size: 12px;

			.shape-dot {
				width: 10px;
				height: 10px;
				border-radius: 50%;
				flex-shrink: 0;
			}
			.shape-name {
				flex: 1;
				color: #2c3e50;
				cursor: pointer;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
			.shape-name:hover {
				color: @green;
			}
			.shape-toggle,
			.shape-del {
				cursor: pointer;
				font-size: 12px;
				color: @grey;
			}
			.shape-del:hover {
				color: @red;
			}
		}

		.measure-row {
			font-size: 12px;
			color: @grey;
			margin-bottom: 4px;
			b {
				color: @green;
			}
		}
	}
}

/* 地图右上角绘制状态浮层（置于返回按钮下方，避免遮挡） */
.draw-hint {
	position: absolute;
	top: 68px;
	right: 24px;
	z-index: 1000;
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 7px 14px;
	border-radius: 16px;
	background: rgba(255, 255, 255, 0.88);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.4);
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
	.ban-user-select();

	.hint-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.hint-text {
		font-size: 12px;
		font-weight: bold;
		color: #2c3e50;
		white-space: nowrap;
	}
	&.hint-drawing {
		.hint-dot {
			background: @green;
			animation: status-pulse 1.2s infinite;
			box-shadow: 0 0 6px @green;
		}
	}
	&.hint-paused {
		.hint-dot {
			background: @red;
		}
	}
}

/* toast */
.mc-toast {
	position: absolute;
	top: 18px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1001;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 18px;
	border-radius: 10px;
	backdrop-filter: blur(10px);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	.ban-user-select();

	.toast-icon {
		width: 18px;
		height: 18px;
		line-height: 18px;
		text-align: center;
		border-radius: 50%;
		font-size: 12px;
		font-weight: bold;
	}
	.toast-text {
		font-size: 13px;
		font-weight: bold;
		color: #ffffff;
	}
	&.toast-success {
		background: rgba(66, 185, 131, 0.92);
		border: 1px solid rgba(66, 185, 131, 0.6);
		.toast-icon {
			background: #ffffff;
			color: @green;
		}
	}
	&.toast-error {
		background: rgba(239, 142, 129, 0.92);
		border: 1px solid rgba(239, 142, 129, 0.6);
		.toast-icon {
			background: #ffffff;
			color: @red;
		}
	}
}

.toast-fade-enter-active,
.toast-fade-leave-active {
	transition: all 0.3s ease;
}
.toast-fade-enter,
.toast-fade-leave-to {
	opacity: 0;
	transform: translate(-50%, -8px);
}

@media screen and (max-width: 960px) {
	.panel {
		width: 200px;
		padding: 10px;
	}
}
</style>
