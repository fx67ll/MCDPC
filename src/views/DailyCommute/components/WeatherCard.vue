<!-- 天气信息卡：实时天气 + 未来4天预报 -->
<template>
	<div class="weather-card">
		<!-- 实时天气 -->
		<div class="wc-live" v-if="live">
			<div class="wc-live-main">
				<span class="wc-temp">{{ live.temperature }}°</span>
				<div class="wc-live-meta">
					<span class="wc-weather">{{ live.weather }}</span>
					<span class="wc-city">{{ live.city }}</span>
				</div>
				<div class="wc-extra">
					<span class="wc-humidity">湿度{{ live.humidity }}%</span>
					<span class="wc-extra-sep">·</span>
					<span class="wc-wind">{{ live.windDirection }}风{{ live.windPower }}级</span>
				</div>
			</div>
		</div>
		<!-- 未来预报 -->
		<div class="wc-forecast" v-if="forecast.length">
			<div class="wc-fc-item" v-for="(f, i) in forecast" :key="i">
				<div class="fc-day">{{ f.week }}</div>
				<div class="fc-w">{{ f.dayWeather }}</div>
				<div class="fc-temp">{{ f.nightTemp }}°~{{ f.dayTemp }}°</div>
			</div>
		</div>
		<!-- 加载/错误 -->
		<div class="wc-empty" v-if="!live && !forecast.length">{{ loadingText }}</div>
	</div>
</template>

<script>
export default {
	name: 'WeatherCard',
	props: {
		live: { type: Object, default: null },
		forecast: { type: Array, default: () => [] },
		loadingText: { type: String, default: '天气加载中...' },
		lastUpdate: { type: String, default: '' }
	}
};
</script>

<style lang="less" scoped>
.weather-card {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);

	.wc-live {
		padding-bottom: 10px;
		border-bottom: 1px dashed rgba(0, 0, 0, 0.06);

		.wc-live-main {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.wc-temp {
			font-size: 32px;
			font-weight: bold;
			color: var(--accent, #42b983);
			font-family: 'Courier New', monospace;
			line-height: 1;
			flex-shrink: 0;
		}
		.wc-live-meta {
			flex: 1;
			min-width: 0;
			display: flex;
			align-items: baseline;
			gap: 6px;
			.wc-weather {
				font-size: 15px;
				color: #2c3e50;
				font-weight: bold;
			}
			.wc-city {
				font-size: 13px;
				color: #bababa;
			}
		}
		.wc-extra {
			flex-shrink: 0;
			font-size: 11px;
			color: #bababa;
			white-space: nowrap;
			.wc-humidity {
				color: #2c3e50;
			}
			.wc-extra-sep {
				margin: 0 4px;
				color: #d4d4d4;
			}
			.wc-wind {
				color: #2c3e50;
			}
		}
	}

	.wc-forecast {
		display: flex;
		gap: 6px;
		margin-top: 10px;
	}
	.wc-fc-item {
		flex: 1;
		min-width: 0;
		text-align: center;
		padding: 8px 2px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.03);
		transition: all 0.25s ease;
		&:hover {
			background: rgba(66, 185, 131, 0.08);
			transform: translateY(-2px);
		}
		.fc-day {
			font-size: 11px;
			color: #bababa;
			margin-bottom: 4px;
		}
		.fc-w {
			font-size: 12px;
			font-weight: bold;
			color: #2c3e50;
			margin-bottom: 4px;
		}
		.fc-temp {
			font-size: 10px;
			color: var(--accent, #42b983);
			font-weight: bold;
		}
	}

	.wc-empty {
		font-size: 12px;
		color: #bababa;
		text-align: center;
		padding: 16px 0;
	}
}
</style>
