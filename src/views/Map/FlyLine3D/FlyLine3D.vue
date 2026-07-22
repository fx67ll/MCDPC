<!-- @name: FlyLine3D -->
<!-- @author: fx67ll -->
<!-- @version: 3.0.0-->
<!-- @description：基于高德地图 JS API 2.0 的 2D 关联飞线 Demo，以南京为中心（默认浦口）。
                使用 AMap.Polyline 贝塞尔曲线 + 移动光点 Marker 实现飞线效果，纯 2D 覆盖物，
                无需 Loca/Object3D，稳定可靠。中心区切换时重绘飞线。-->

<template>
	<div class="flyline">
		<!-- 顶部标题 -->
		<div class="top-box">
			<span class="title-main">南京各区关联流向</span>
			<span class="title-sub">2D 贝塞尔飞线 · 实时光点流动 · 点击切换中心</span>
		</div>

		<!-- 中心区域切换（全部 11 区） -->
		<div class="hub-box">
			<span class="hub-label">中心区域</span>
			<div class="hub-list">
				<div class="hub-item" :class="{ active: currentHub === index }" v-for="(hub, index) in hubs"
					:key="index" @click="switchHub(index)">
					{{ hub.name }}
				</div>
			</div>
		</div>

		<!-- 流向统计面板 -->
		<div class="stat-box" v-if="currentHubData">
			<div class="stat-title">{{ currentHubData.name }} 关联排行</div>
			<div class="stat-list">
				<div class="stat-row" v-for="(item, idx) in currentStats" :key="idx">
					<span class="stat-rank">{{ idx + 1 }}</span>
					<span class="stat-name">{{ item.name }}</span>
					<div class="stat-bar-bg">
						<div class="stat-bar" :style="{ width: item.percent + '%' }"></div>
					</div>
					<span class="stat-val">{{ item.val }}</span>
				</div>
			</div>
		</div>

		<div id="flyline-container" ref="map"></div>
	</div>
</template>

<script>
import { loadAMap } from '@/utils/amapLoader.js';
import { NANJING_CENTER, NANJING_DISTRICTS, NANJING_HUBS } from '../nanjingData.js';

export default {
	name: 'FlyLine3D',
	data() {
		return {
			AMap: null,
			map: null,
			lines: [], // 飞线 Polyline 集合
			dots: [], // 移动光点 Marker 集合
			endMarkers: [], // 端点标记
			animTimer: null,
			currentHub: 4, // 默认浦口区
			hubs: NANJING_HUBS,
			allDistricts: NANJING_DISTRICTS
		};
	},
	computed: {
		currentHubData() {
			return this.hubs[this.currentHub];
		},
		currentStats() {
			var self = this;
			var hub = self.currentHubData;
			if (!hub) return [];
			var targets = self.allDistricts
				.filter(function (d) {
					return d.adcode !== hub.adcode;
				})
				.map(function (d) {
					return { name: d.name, base: d.base };
				})
				.sort(function (a, b) {
					return b.base - a.base;
				})
				.slice(0, 8);
			var max = targets[0] ? targets[0].base : 100;
			return targets.map(function (t, i) {
				var val = t.base - i * 2;
				return { name: t.name, val: val + '次', percent: Math.round((val / max) * 100) };
			});
		}
	},
	mounted() {
		this.mapInit();
	},
	beforeDestroy() {
		this.clearAnim();
		this.clearAll();
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
				var pukou = self.allDistricts.find(function (d) { return d.name === '浦口区'; });
				var center = pukou ? pukou.center : NANJING_CENTER;
				self.map = new AMap.Map('flyline-container', {
					center: center,
					zoom: 9.5,
					mapStyle: 'amap://styles/dark'
				});
				self.drawFlyLines();
				self.startAnim();
			}).catch(function (err) {
				console.error('FlyLine3D 加载失败:', err);
			});
		},
		// 绘制飞线 + 端点
		drawFlyLines() {
			var self = this;
			if (!self.map) return;
			self.clearAll();

			var hub = self.currentHubData;
			// 中心端点标记（暖色，较大）
			self.addEndMarker(hub.center, '#ef8e81', 9);

			var targets = self.allDistricts.filter(function (d) {
				return d.adcode !== hub.adcode;
			});

			for (var i = 0; i < targets.length; i++) {
				self.addEndMarker(targets[i].center, '#42b983', 7);
				self.addBezierLine(hub.center, targets[i].center, i);
			}
		},
		// 端点标记
		addEndMarker(coord, color, radius) {
			var self = this;
			var marker = new self.AMap.CircleMarker({
				center: [coord[0], coord[1]],
				radius: radius,
				fillColor: color,
				fillOpacity: 0.9,
				strokeColor: '#ffffff',
				strokeWeight: 1,
				zIndex: 110
			});
			marker.setMap(self.map);
			self.endMarkers.push(marker);
		},
		// 贝塞尔飞线 + 流动光点
		addBezierLine(start, end, idx) {
			var self = this;
			var segments = 40;
			var path = [];
			var sx = start[0],
				sy = start[1];
			var ex = end[0],
				ey = end[1];
			// 二次贝塞尔控制点：中点 + 垂直偏移，制造弧度
			var mx = (sx + ex) / 2;
			var my = (sy + ey) / 2;
			var dx = ex - sx;
			var dy = ey - sy;
			var dist = Math.sqrt(dx * dx + dy * dy);
			// 垂直方向偏移（弧高）
			var offset = dist * 0.15;
			var cx = mx - dy / (dist || 1) * offset;
			var cy = my + dx / (dist || 1) * offset;

			for (var i = 0; i <= segments; i++) {
				var t = i / segments;
				var lng = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex;
				var lat = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
				path.push([lng, lat]);
			}

			// 飞线主体（渐变色折线）
			var line = new self.AMap.Polyline({
				path: path,
				strokeColor: '#42b983',
				strokeWeight: 2,
				strokeOpacity: 0.7,
				strokeStyle: 'solid',
				lineJoin: 'round',
				zIndex: 50
			});
			line.setMap(self.map);
			self.lines.push(line);

			// 流动光点（小 CircleMarker 沿路径移动）
			var dot = new self.AMap.CircleMarker({
				center: [sx, sy],
				radius: 4,
				fillColor: '#fee08b',
				fillOpacity: 1,
				strokeColor: '#ffffff',
				strokeWeight: 1,
				zIndex: 120
			});
			dot._path = path;
			dot._progress = idx * 0.1; // 错开起点
			dot.setMap(self.map);
			self.dots.push(dot);
		},
		startAnim() {
			var self = this;
			self.animTimer = setInterval(function () {
				for (var i = 0; i < self.dots.length; i++) {
					var dot = self.dots[i];
					dot._progress += 0.012;
					if (dot._progress >= 1) {
						dot._progress = 0;
					}
					var idx = Math.floor(dot._progress * (dot._path.length - 1));
					var p = dot._path[idx];
					dot.setCenter([p[0], p[1]]);
				}
			}, 30);
		},
		switchHub(index) {
			if (index === this.currentHub) return;
			this.currentHub = index;
			this.drawFlyLines();
		},
		clearAll() {
			var self = this;
			for (var i = 0; i < self.lines.length; i++) {
				try { self.lines[i].setMap(null); } catch (e) { }
			}
			self.lines = [];
			for (var j = 0; j < self.dots.length; j++) {
				try { self.dots[j].setMap(null); } catch (e) { }
			}
			self.dots = [];
			for (var k = 0; k < self.endMarkers.length; k++) {
				try { self.endMarkers[k].setMap(null); } catch (e) { }
			}
			self.endMarkers = [];
		},
		clearAnim() {
			if (this.animTimer) {
				clearInterval(this.animTimer);
				this.animTimer = null;
			}
		}
	}
};
</script>

<style lang="less" scoped>
.flyline {
	width: 100%;
	height: 100%;
	position: relative;
	background: #0d1117;
	.ban-user-select();

	#flyline-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
}

/* 顶部标题 */
.top-box {
	position: absolute;
	top: 18px;
	left: 24px;
	z-index: 1000;
	background: rgba(13, 17, 23, 0.7);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 10px 16px;

	.title-main {
		display: block;
		font-size: 16px;
		font-weight: bold;
		color: #ffffff;
		letter-spacing: 0.5px;
	}

	.title-sub {
		display: block;
		margin-top: 4px;
		font-size: 12px;
		color: @grey;
	}
}

/* 中心区域切换 */
.hub-box {
	position: absolute;
	top: 78px;
	right: 24px;
	z-index: 1000;
	background: rgba(13, 17, 23, 0.7);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 10px 12px;
	max-width: 320px;

	.hub-label {
		display: block;
		font-size: 12px;
		color: @grey;
		margin-bottom: 8px;
	}

	.hub-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		max-width: 296px;
	}

	.hub-item {
		padding: 4px 10px;
		font-size: 12px;
		color: @green;
		border: 1px solid rgba(66, 185, 131, 0.4);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.hub-item:hover {
		background: rgba(66, 185, 131, 0.18);
	}

	.hub-item.active {
		background: @green;
		color: #0d1117;
		font-weight: bold;
	}
}

/* 统计面板 */
.stat-box {
	position: absolute;
	bottom: 28px;
	left: 24px;
	z-index: 1000;
	width: 280px;
	background: rgba(13, 17, 23, 0.78);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 12px 14px;

	.stat-title {
		font-size: 14px;
		font-weight: bold;
		color: @green;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(66, 185, 131, 0.25);
	}

	.stat-list {
		max-height: 240px;
		overflow-y: auto;
	}

	.stat-list::-webkit-scrollbar {
		width: 4px;
	}

	.stat-list::-webkit-scrollbar-thumb {
		background: rgba(66, 185, 131, 0.4);
		border-radius: 2px;
	}

	.stat-row {
		display: flex;
		align-items: center;
		margin-bottom: 8px;
		animation: row-in 0.4s ease;

		.stat-rank {
			width: 20px;
			font-size: 12px;
			font-weight: bold;
			color: #fee08b;
			text-align: center;
		}

		.stat-name {
			width: 56px;
			font-size: 12px;
			color: #ffffff;
		}

		.stat-bar-bg {
			flex: 1;
			height: 8px;
			margin: 0 8px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 4px;
			overflow: hidden;
		}

		.stat-bar {
			height: 100%;
			border-radius: 4px;
			background: linear-gradient(90deg, #42b983, #fee08b, #ef8e81);
			transition: width 0.6s ease;
		}

		.stat-val {
			width: 44px;
			text-align: right;
			font-size: 12px;
			color: @grey;
		}
	}
}

@keyframes row-in {
	from {
		opacity: 0;
		transform: translateX(-10px);
	}

	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@media screen and (max-width: 960px) {
	.stat-box {
		display: none;
	}

	.hub-box {
		max-width: 240px;
	}
}
</style>
