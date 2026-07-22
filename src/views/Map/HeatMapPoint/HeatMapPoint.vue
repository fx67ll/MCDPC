<!-- @name: HeatMapPoint -->
<!-- @author: fx67ll -->
<!-- @version: 1.1.0-->
<!-- @description：基于高德地图 JS API 2.0 的热力图 Demo，以南京为中心，24小时时间轴动画、强度调节、主题色渐变。懒加载 AMap.HeatMap 插件。-->

<template>
	<div class="heatmap">
		<!-- 顶部标题（左上角，避开右上角返回按钮） -->
		<div class="title-box">
			<span class="title-main">南京各区人口热力分布</span>
			<span class="title-sub">24小时动态热力图 · 随时间推移观察人口聚集变化</span>
		</div>

		<!-- 图例（右上角，置于返回按钮下方避免遮挡） -->
		<div class="legend-box">
			<span class="legend-label">低</span>
			<div class="legend-bar"></div>
			<span class="legend-label">高</span>
		</div>

		<!-- 时间轴控制 -->
		<div class="time-box">
			<div class="time-display">
				<span class="time-hour">{{ formatHour }}</span>
				<span class="time-colon">:</span>
				<span class="time-min">00</span>
			</div>
			<div class="time-slider-wrap">
				<input class="time-slider" type="range" min="0" max="23" step="1" v-model.number="currentHour"
					@input="onHourChange" />
				<div class="time-ticks">
					<span v-for="h in [0, 6, 12, 18, 23]" :key="h">{{ h }}时</span>
				</div>
			</div>
			<div class="time-controls">
				<div class="ctrl-btn" :class="{ active: isPlaying }" @click="togglePlay">
					<span v-if="!isPlaying">▶ 播放</span>
					<span v-else>❚❚ 暂停</span>
				</div>
				<div class="ctrl-btn" @click="resetTime">↺ 重置</div>
			</div>
		</div>

		<!-- 强度调节 -->
		<div class="opacity-box">
			<span class="opacity-label">热力强度</span>
			<input class="opacity-slider" type="range" min="20" max="100" step="5" v-model.number="intensity"
				@input="onIntensityChange" />
			<span class="opacity-val">{{ intensity }}%</span>
		</div>

		<div id="heatmap-container" ref="map"></div>
	</div>
</template>

<script>
import { loadAMap } from '@/utils/amapLoader.js';
import { NANJING_CENTER, NANJING_DISTRICTS } from '../nanjingData.js';

export default {
	name: 'HeatMapPoint',
	data() {
		return {
			AMap: null,
			map: null,
			heatMap: null,
			currentHour: 9,
			isPlaying: false,
			playTimer: null,
			intensity: 80,
			// 24小时人口活跃度权重（典型城市曲线）
			hourWeights: [
				0.12, 0.08, 0.05, 0.05, 0.08, 0.15, 0.3, 0.55, 0.78, 0.92, 0.85, 0.8,
				0.75, 0.82, 0.86, 0.9, 0.95, 1.0, 0.98, 0.88, 0.76, 0.6, 0.42, 0.22
			]
		};
	},
	computed: {
		formatHour() {
			return this.currentHour < 10 ? '0' + this.currentHour : '' + this.currentHour;
		}
	},
	mounted() {
		this.mapInit();
	},
	beforeDestroy() {
		this.stopPlay();
		if (this.map) {
			this.map.destroy();
			this.map = null;
		}
	},
	methods: {
		mapInit() {
			var self = this;
			loadAMap(['AMap.HeatMap']).then(function (AMap) {
				self.AMap = AMap;
				self.map = new AMap.Map('heatmap-container', {
					center: NANJING_CENTER,
					zoom: 10,
					mapStyle: 'amap://styles/dark'
				});

				self.heatMap = new AMap.HeatMap(self.map, {
					radius: 38,
					opacity: [0, 0.8],
					gradient: {
						0.1: '#1a9850',
						0.3: '#91cf60',
						0.5: '#fee08b',
						0.7: '#fc8d59',
						0.9: '#d73027'
					}
				});

				// 地图底图加载完成后渲染热力，避免图层未就绪导致不显示
				self.map.on('complete', function () {
					self.updateHeat();
				});
				// 兜底：complete 未触发时也尝试渲染
				setTimeout(function () {
					if (self.heatMap) {
						self.updateHeat();
					}
				}, 800);
			}).catch(function (err) {
				console.error('HeatMap 加载失败:', err);
			});
		},
		// 根据当前小时生成热力数据
		generateData() {
			var self = this;
			var weight = self.hourWeights[self.currentHour];
			var factor = self.intensity / 100;
			var data = [];
			for (var i = 0; i < NANJING_DISTRICTS.length; i++) {
				var d = NANJING_DISTRICTS[i];
				var value = Math.round(d.base * weight * factor);
				data.push({ lng: d.center[0], lat: d.center[1], count: value });
				// 在区中心周围撒几个点让热力更饱满
				data.push({ lng: d.center[0] + 0.02, lat: d.center[1] + 0.012, count: Math.round(value * 0.7) });
				data.push({ lng: d.center[0] - 0.018, lat: d.center[1] - 0.01, count: Math.round(value * 0.6) });
				data.push({ lng: d.center[0] + 0.01, lat: d.center[1] - 0.02, count: Math.round(value * 0.55) });
			}
			return data;
		},
		updateHeat() {
			if (!this.heatMap) return;
			this.heatMap.setDataSet({
				data: this.generateData(),
				max: 100
			});
		},
		onHourChange() {
			this.updateHeat();
		},
		onIntensityChange() {
			this.updateHeat();
		},
		togglePlay() {
			if (this.isPlaying) {
				this.stopPlay();
			} else {
				this.startPlay();
			}
		},
		startPlay() {
			var self = this;
			self.isPlaying = true;
			self.playTimer = setInterval(function () {
				self.currentHour = (self.currentHour + 1) % 24;
				self.updateHeat();
			}, 1000);
		},
		stopPlay() {
			this.isPlaying = false;
			if (this.playTimer) {
				clearInterval(this.playTimer);
				this.playTimer = null;
			}
		},
		resetTime() {
			this.stopPlay();
			this.currentHour = 9;
			this.updateHeat();
		}
	}
};
</script>

<style lang="less" scoped>
.heatmap {
	width: 100%;
	height: 100%;
	position: relative;
	background: #0d1117;
	.ban-user-select();

	#heatmap-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
}

/* 顶部标题（左上角） */
.title-box {
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

/* 图例（右上角，返回按钮下方） */
.legend-box {
	position: absolute;
	top: 76px;
	right: 24px;
	z-index: 1000;
	display: flex;
	align-items: center;
	background: rgba(13, 17, 23, 0.7);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 10px 14px;

	.legend-label {
		font-size: 12px;
		color: @grey;
	}

	.legend-bar {
		width: 140px;
		height: 10px;
		margin: 0 8px;
		border-radius: 5px;
		background: linear-gradient(to right, #1a9850, #91cf60, #fee08b, #fc8d59, #d73027);
	}
}

/* 时间轴控制 */
.time-box {
	position: absolute;
	bottom: 28px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1000;
	width: 640px;
	max-width: calc(~'100% - 48px');
	background: rgba(13, 17, 23, 0.78);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 14px;
	padding: 14px 20px;
	display: flex;
	align-items: center;
	box-shadow: 0 6px 28px rgba(0, 0, 0, 0.4);

	.time-display {
		font-size: 30px;
		font-weight: bold;
		color: @green;
		font-family: 'Courier New', monospace;
		min-width: 96px;

		.time-colon {
			animation: blink 1s infinite;
		}
	}

	.time-slider-wrap {
		flex: 1;
		margin: 0 18px;

		.time-slider {
			width: 100%;
			height: 6px;
			-webkit-appearance: none;
			appearance: none;
			background: rgba(255, 255, 255, 0.15);
			border-radius: 3px;
			outline: none;
			cursor: pointer;
		}

		.time-slider::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: @green;
			border: 2px solid #ffffff;
			box-shadow: 0 0 8px rgba(66, 185, 131, 0.8);
			cursor: pointer;
		}

		.time-slider::-moz-range-thumb {
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: @green;
			border: 2px solid #ffffff;
			cursor: pointer;
		}

		.time-ticks {
			display: flex;
			justify-content: space-between;
			margin-top: 6px;

			span {
				font-size: 11px;
				color: @grey;
			}
		}
	}

	.time-controls {
		display: flex;
		gap: 8px;

		.ctrl-btn {
			padding: 7px 14px;
			font-size: 13px;
			color: @green;
			border: 1px solid rgba(66, 185, 131, 0.5);
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s ease;
			white-space: nowrap;
		}

		.ctrl-btn:hover {
			background: rgba(66, 185, 131, 0.18);
		}

		.ctrl-btn.active {
			background: @green;
			color: #0d1117;
		}
	}
}

@keyframes blink {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.3;
	}
}

/* 强度调节 */
.opacity-box {
	position: absolute;
	bottom: 28px;
	right: 30px;
	z-index: 1000;
	background: rgba(13, 17, 23, 0.78);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 12px 14px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;

	.opacity-label {
		font-size: 12px;
		color: @grey;
	}

	.opacity-slider {
		width: 110px;
		height: 5px;
		-webkit-appearance: none;
		appearance: none;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	.opacity-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fee08b;
		border: 2px solid #ffffff;
		cursor: pointer;
	}

	.opacity-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fee08b;
		border: 2px solid #ffffff;
		cursor: pointer;
	}

	.opacity-val {
		font-size: 12px;
		color: #ffffff;
		font-weight: bold;
	}
}

@media screen and (max-width: 960px) {
	.opacity-box {
		display: none;
	}

	.time-box {
		width: 90%;
	}
}
</style>
