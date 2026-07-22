<!-- @name: GlowWall3D -->
<!-- @author: fx67ll -->
<!-- @version: 1.3.0-->
<!-- @description：基于高德地图 JS API 2.0 的 3D 安防态势 Demo，以南京为中心。3D 倾斜地图 + 区域发光描边
                + 旋转雷达扫描扇形 + 告警点位监控。监控区域为南京 11 个区，使用 DistrictSearch 取区界。
                注：JS API 2.0 已移除 AMap.Object3D 系列，区域光墙改用 AMap.Polygon 发光描边模拟，雷达/告警用稳定覆盖物。-->

<template>
	<div class="glowwall">
		<!-- 顶部标题 -->
		<div class="top-box">
			<span class="title-main">南京城区安防态势感知</span>
			<span class="title-sub">3D 倾斜 · 区域光墙 · 雷达扫描 · 告警监控</span>
		</div>

		<!-- 源码/文档入口（右边缘收缩胶囊） -->
		<view-source-btn code="GlowWall3D"></view-source-btn>

		<!-- 监控区域切换（南京 11 区） -->
		<div class="city-box">
			<span class="city-label">监控区域</span>
			<div class="city-list">
				<div class="city-item" :class="{ active: currentCity === index }" v-for="(city, index) in cities"
					:key="index" @click="switchCity(index)">
					{{ city.name }}
				</div>
			</div>
		</div>

		<!-- 告警列表 -->
		<div class="alert-box">
			<div class="alert-header">
				<span class="alert-dot"></span>
				<span class="alert-title">实时告警</span>
				<span class="alert-count">{{ alertList.length }}</span>
			</div>
			<div class="alert-list">
				<div class="alert-item" :class="'level-' + item.level" v-for="(item, idx) in alertList" :key="idx">
					<span class="alert-time">{{ item.time }}</span>
					<span class="alert-name">{{ item.name }}</span>
					<span class="alert-tag">{{ item.levelText }}</span>
				</div>
			</div>
		</div>

		<!-- 扫描状态 -->
		<div class="scan-box">
			<div class="scan-ring"></div>
			<span class="scan-text">雷达扫描中</span>
		</div>

		<div id="glowwall-container" ref="map"></div>
	</div>
</template>

<script>
import { loadAMap, loadLoca } from '@/utils/amapLoader.js';
import { NANJING_CENTER, NANJING_DISTRICTS } from '../nanjingData.js';

export default {
	name: 'GlowWall3D',
	data() {
		return {
			AMap: null,
			Loca: null,
			map: null,
			areaPolygons: [], // 区域发光描边多边形
			prismLayer: null, // 立体光墙 Loca.PrismLayer
			radarSector: null, // 雷达扫描扇形
			radarMarkers: [], // 雷达圆环 + 中心点
			alertMarkers: [], // 告警点
			rotateTimer: null,
			currentCity: 4, // 默认浦口区
			districtSearch: null
		};
	},
	computed: {
		cities() {
			return NANJING_DISTRICTS.map(function (d, i) {
				return {
					name: d.name,
					adcode: d.adcode,
					center: d.center,
					alerts: GlowWall3D_buildAlerts(d.name, i)
				};
			});
		},
		alertList() {
			var city = this.cities[this.currentCity];
			return city ? city.alerts : [];
		}
	},
	mounted() {
		this.mapInit();
	},
	beforeDestroy() {
		this.clearRotate();
		this.clearObjects();
		if (this.map) {
			this.map.destroy();
			this.map = null;
		}
	},
	methods: {
		mapInit() {
			var self = this;
			loadAMap(['AMap.DistrictSearch']).then(function (AMap) {
				self.AMap = AMap;
				self.map = new AMap.Map('glowwall-container', {
					center: NANJING_CENTER,
					zoom: 10.5,
					pitch: 45,
					viewMode: '3D',
					mapStyle: 'amap://styles/dark'
				});

				// 行政区查询实例（subdistrict=0，只查自身边界）
				self.districtSearch = new AMap.DistrictSearch({
					showbiz: false,
					level: 'district',
					extensions: 'all',
					subdistrict: 0
				});

				// 加载 Loca 可视化库用于立体光墙
				return loadLoca(AMap);
			}).then(function (Loca) {
				self.Loca = Loca;
				self.drawCity();
				self.startRotate();
			}).catch(function (err) {
				console.error('GlowWall3D 加载失败:', err);
			});
		},
		// 绘制当前监控区域的光墙、雷达、告警点
		drawCity() {
			var self = this;
			self.clearObjects();

			var city = self.cities[self.currentCity];
			var center = city.center;
			self.map.setZoomAndCenter(12, center);

			// 查询区边界画发光描边 + 立体光墙（带兜底）
			self.fetchDistrictBoundary(city.adcode, function (bounds) {
				if (!self.map) return;
				if (bounds && bounds.length > 0) {
					for (var j = 0; j < bounds.length; j++) {
						self.addGlowWall(bounds[j]);
					}
					// 用区界构建立体光墙（Loca.PrismLayer 沿边界拉伸）
					self.addPrismWall(bounds);
				}
			});

			self.addRadar(center);
			self.addAlertPoints(city, center);
		},
		// 立体光墙：用区界多边形作为 PrismLayer 数据，向上拉伸固定高度
		addPrismWall(bounds) {
			var self = this;
			if (!self.Loca) return;
			// 取所有边界环作为多边形特征
			var features = bounds.map(function (path, idx) {
				return {
					type: 'Feature',
					geometry: { type: 'Polygon', coordinates: [path] },
					properties: { ringIdx: idx }
				};
			});
			var source = new self.Loca.GeoJSONSource({
				data: { type: 'FeatureCollection', features: features }
			});
			self.prismLayer = new self.Loca.PrismLayer({
				map: self.map,
				zIndex: 120,
				depth: true,
				visible: true,
				zooms: [3, 20]
			});
			self.prismLayer.setSource(source);
			self.prismLayer.setStyle({
				// 围墙高度（米），拉出立体感
				height: 1500,
				// 侧面顶部/底部颜色渐变（发光感）
				sideTopColor: 'rgba(66, 185, 131, 0.9)',
				sideBottomColor: 'rgba(66, 185, 131, 0.1)',
				// 顶面颜色
				topColor: 'rgba(254, 224, 139, 0.6)'
			});
			try { self.prismLayer.render(); } catch (e) { }
		},
		// 取单个区的边界坐标
		fetchDistrictBoundary(adcode, callback) {
			var self = this;
			self.districtSearch.search(adcode, function (status, result) {
				if (!self.map) return;
				if (status === 'complete' && result && result.districtList && result.districtList.length > 0) {
					var bounds = result.districtList[0].boundaries;
					if (bounds && bounds.length > 0) {
						callback(bounds);
						return;
					}
				}
				callback(null);
			});
		},
		// 区域发光描边（模拟立体光墙效果）
		addGlowWall(path) {
			var self = this;
			var polygon = new self.AMap.Polygon({
				path: path,
				strokeColor: '#42b983',
				strokeWeight: 3,
				strokeOpacity: 0.9,
				strokeStyle: 'solid',
				fillColor: '#42b983',
				fillOpacity: 0.08,
				zIndex: 50
			});
			polygon.setMap(self.map);
			self.areaPolygons.push(polygon);
		},
		// 雷达扫描：多层圆环 + 旋转扇形 + 中心点
		addRadar(center) {
			var self = this;
			var radiuses = [800, 1600, 2400];
			for (var i = 0; i < radiuses.length; i++) {
				var circle = new self.AMap.Circle({
					center: center,
					radius: radiuses[i],
					strokeColor: '#42b983',
					strokeWeight: 1,
					strokeOpacity: 0.5 - i * 0.12,
					fillColor: '#42b983',
					fillOpacity: 0.03,
					zIndex: 50
				});
				circle.setMap(self.map);
				self.radarMarkers.push(circle);
			}

			var centerMarker = new self.AMap.CircleMarker({
				center: center,
				radius: 8,
				fillColor: '#ef8e81',
				fillOpacity: 1,
				strokeColor: '#ffffff',
				strokeWeight: 2,
				zIndex: 120
			});
			centerMarker.setMap(self.map);
			self.radarMarkers.push(centerMarker);

			self.radarSector = new self.AMap.Polygon({
				path: self.buildSectorPath(center, 2400, 0, 36),
				strokeColor: 'rgba(66, 185, 131, 0.8)',
				strokeWeight: 1,
				fillColor: '#42b983',
				fillOpacity: 0.18,
				zIndex: 60
			});
			self.radarSector._center = center;
			self.radarSector._radius = 2400;
			self.radarSector._angle = 0;
			self.radarSector.setMap(self.map);
		},
		buildSectorPath(center, radius, startAngle, angleSpan) {
			var path = [center];
			var steps = 24;
			for (var i = 0; i <= steps; i++) {
				var a = ((startAngle + (angleSpan * i) / steps) * Math.PI) / 180;
				var dx = (radius / 111320) * Math.cos(a);
				var dy = (radius / 111320) * Math.sin(a);
				var lng = center[0] + dx / Math.cos((center[1] * Math.PI) / 180);
				var lat = center[1] + dy;
				path.push([lng, lat]);
			}
			return path;
		},
		// 告警点（围绕区中心分布）
		addAlertPoints(city, center) {
			var self = this;
			var colors = { 1: '#d73027', 2: '#fc8d59', 3: '#fee08b' };
			var count = city.alerts.length;
			for (var i = 0; i < count; i++) {
				var alert = city.alerts[i];
				var angle = ((i * 360) / count + 30) * (Math.PI / 180);
				var r = 0.015 + (i % 2) * 0.006;
				var lng = center[0] + r * Math.cos(angle);
				var lat = center[1] + r * Math.sin(angle);

				var marker = new self.AMap.CircleMarker({
					center: [lng, lat],
					radius: 8 + (3 - alert.level) * 2,
					fillColor: colors[alert.level],
					fillOpacity: 0.9,
					strokeColor: '#ffffff',
					strokeWeight: 1,
					zIndex: 100
				});
				marker.setMap(self.map);
				self.alertMarkers.push(marker);
			}
		},
		startRotate() {
			var self = this;
			self.rotateTimer = setInterval(function () {
				if (!self.radarSector || !self.map) return;
				self.radarSector._angle = (self.radarSector._angle + 4) % 360;
				self.radarSector.setPath(
					self.buildSectorPath(self.radarSector._center, self.radarSector._radius, self.radarSector._angle, 36)
				);
			}, 50);
		},
		switchCity(index) {
			if (index === this.currentCity) return;
			this.currentCity = index;
			this.drawCity();
		},
		clearObjects() {
			var self = this;
			for (var i = 0; i < self.areaPolygons.length; i++) {
				try { self.areaPolygons[i].setMap(null); } catch (e) { }
			}
			self.areaPolygons = [];
			if (self.prismLayer) {
				try { self.prismLayer.setMap(null); } catch (e) { }
				try { self.prismLayer.destroy(); } catch (e) { }
				self.prismLayer = null;
			}
			for (var j = 0; j < self.radarMarkers.length; j++) {
				try { self.radarMarkers[j].setMap(null); } catch (e) { }
			}
			self.radarMarkers = [];
			if (self.radarSector) {
				try { self.radarSector.setMap(null); } catch (e) { }
				self.radarSector = null;
			}
			for (var k = 0; k < self.alertMarkers.length; k++) {
				try { self.alertMarkers[k].setMap(null); } catch (e) { }
			}
			self.alertMarkers = [];
		},
		clearRotate() {
			if (this.rotateTimer) {
				clearInterval(this.rotateTimer);
				this.rotateTimer = null;
			}
		}
	}
};

// 为每个区生成一组告警点（数据驱动）
function GlowWall3D_buildAlerts(districtName, idx) {
	var landmarks = {
		'玄武区': [['新街口·德基广场', 1], ['紫金山·天文台', 2], ['南京站·北广场', 3]],
		'秦淮区': [['夫子庙·秦淮河', 1], ['老门东', 2], ['大光路', 3]],
		'建邺区': [['河西·万达广场', 1], ['奥体中心', 2], ['南京眼·步行桥', 3]],
		'鼓楼区': [['湖南路·商圈', 1], ['颐和路·民国街区', 2], ['下关·滨江', 3], ['玄武门·入口', 3]],
		'浦口区': [['弘阳广场', 1], ['老山国家森林公园', 2], ['桥北·商圈', 3]],
		'栖霞区': [['仙林大学城', 1], ['燕子矶', 2], ['马群', 3]],
		'雨花台区': [['雨花客厅', 1], ['软件大道', 2], ['铁心桥', 3]],
		'江宁区': [['百家湖·商圈', 1], ['东山·万达', 2], ['江宁大学城', 3]],
		'六合区': [['雄州·中心', 1], ['金牛湖', 2], ['大厂', 3]],
		'溧水区': [['溧水·万达', 1], ['天生桥', 2], ['石湫', 3]],
		'高淳区': [['高淳老街', 1], ['固城湖', 2], ['桠溪', 3]]
	};
	var list = landmarks[districtName] || [[districtName + '·中心', 2]];
	var levelText = { 1: '高危', 2: '中危', 3: '低危' };
	return list.map(function (item, i) {
		var totalMin = 20 * 60 + idx * 18 + i * 7;
		var h = Math.floor(totalMin / 60) % 24;
		var m = totalMin % 60;
		var hh = h < 10 ? '0' + h : '' + h;
		var mm = m < 10 ? '0' + m : '' + m;
		return {
			time: hh + ':' + mm,
			name: item[0],
			level: item[1],
			levelText: levelText[item[1]]
		};
	});
}
</script>

<style lang="less" scoped>
.glowwall {
	width: 100%;
	height: 100%;
	position: relative;
	background: #0d1117;
	.ban-user-select();

	#glowwall-container {
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

/* 监控区域切换 */
.city-box {
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

	.city-label {
		display: block;
		font-size: 12px;
		color: @grey;
		margin-bottom: 8px;
	}

	.city-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		max-width: 296px;
	}

	.city-item {
		padding: 4px 10px;
		font-size: 12px;
		color: @green;
		border: 1px solid rgba(66, 185, 131, 0.4);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.city-item:hover {
		background: rgba(66, 185, 131, 0.18);
	}

	.city-item.active {
		background: @green;
		color: #0d1117;
		font-weight: bold;
	}
}

/* 告警列表 */
.alert-box {
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

	.alert-header {
		display: flex;
		align-items: center;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(66, 185, 131, 0.25);

		.alert-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: @red;
			margin-right: 8px;
			animation: alert-blink 1s infinite;
		}

		.alert-title {
			flex: 1;
			font-size: 14px;
			font-weight: bold;
			color: @green;
		}

		.alert-count {
			font-size: 12px;
			color: @red;
			background: rgba(239, 142, 129, 0.15);
			padding: 2px 8px;
			border-radius: 10px;
		}
	}

	.alert-list {
		margin-top: 8px;
		max-height: 200px;
		overflow-y: auto;
	}

	.alert-list::-webkit-scrollbar {
		width: 4px;
	}

	.alert-list::-webkit-scrollbar-thumb {
		background: rgba(66, 185, 131, 0.4);
		border-radius: 2px;
	}

	.alert-item {
		display: flex;
		align-items: center;
		padding: 6px 4px;
		border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
		animation: row-in 0.4s ease;

		.alert-time {
			width: 42px;
			font-size: 11px;
			color: @grey;
		}

		.alert-name {
			flex: 1;
			font-size: 12px;
			color: #ffffff;
			margin: 0 6px;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.alert-tag {
			font-size: 11px;
			padding: 1px 6px;
			border-radius: 8px;
		}

		&.level-1 .alert-tag {
			color: #d73027;
			background: rgba(215, 48, 39, 0.18);
		}

		&.level-2 .alert-tag {
			color: #fc8d59;
			background: rgba(252, 141, 89, 0.18);
		}

		&.level-3 .alert-tag {
			color: #fee08b;
			background: rgba(254, 224, 139, 0.18);
		}
	}
}

@keyframes alert-blink {

	0%,
	100% {
		opacity: 1;
		box-shadow: 0 0 6px @red;
	}

	50% {
		opacity: 0.3;
		box-shadow: 0 0 0 @red;
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

/* 扫描状态 */
.scan-box {
	position: absolute;
	bottom: 28px;
	right: 30px;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: rgba(13, 17, 23, 0.78);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 12px 16px;

	.scan-ring {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid transparent;
		border-top-color: @green;
		border-right-color: @green;
		animation: scan-rotate 1s linear infinite;
		margin-bottom: 8px;
	}

	.scan-text {
		font-size: 12px;
		color: @green;
	}
}

@keyframes scan-rotate {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}

@media screen and (max-width: 960px) {
	.alert-box {
		display: none;
	}

	.city-box {
		max-width: 240px;
	}
}
</style>
