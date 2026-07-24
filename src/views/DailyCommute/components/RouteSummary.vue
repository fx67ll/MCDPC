<!-- 路线总览：总耗时 / 总距离 / 拥堵状态 / 过路费 -->
<template>
	<div class="route-summary" v-if="data">
		<div class="rs-title" v-if="showTitle"><span class="title-icon">📊</span> 路线概览</div>
		<div class="rs-grid">
			<div class="rs-item">
				<span class="rs-label">总耗时</span>
				<span class="rs-value">{{ data.durationText }}</span>
			</div>
			<div class="rs-item">
				<span class="rs-label">总距离</span>
				<span class="rs-value">{{ data.distanceText }}</span>
			</div>
			<div class="rs-item">
				<span class="rs-label">拥堵</span>
				<span class="rs-value" :class="'congestion-' + data.congestionCls">{{ data.congestionText }}</span>
			</div>
			<div class="rs-item">
				<span class="rs-label">过路费</span>
				<span class="rs-value toll" :class="{ free: data.tollText === '免费' }">{{ data.tollText }}</span>
			</div>
		</div>
		<div class="rs-toll-road" v-if="data.tollRoadsText">
			<span class="toll-icon">💰</span>收费路段：{{ data.tollRoadsText }}
		</div>
	</div>
</template>

<script>
export default {
	name: 'RouteSummary',
	props: {
		data: { type: Object, default: null },
		showTitle: { type: Boolean, default: true }
	}
};
</script>

<style lang="less" scoped>
.route-summary {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);

	.rs-title {
		font-size: 13px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		gap: 6px;

		.title-icon {
			font-size: 12px;
			line-height: 1.1;
			flex-shrink: 0;
			position: relative;
			top: 2px;
		}
	}

	.rs-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 10px;
	}

	.rs-item {
		flex: 1 1 40%;
		min-width: 70px;
		text-align: center;

		.rs-label {
			display: block;
			font-size: 11px;
			color: #bababa;
			margin-bottom: 4px;
		}

		.rs-value {
			font-size: 15px;
			font-weight: bold;
			color: #2c3e50;
			white-space: nowrap;
		}

		.congestion-smooth {
			color: #42b983;
		}

		.congestion-slow {
			color: #f5af19;
		}

		.congestion-jam {
			color: #fc8d59;
		}

		.congestion-bad {
			color: #d73027;
		}

		.congestion-unknown {
			color: #bababa;
		}

		&.toll.free {
			color: #42b983;
		}
	}

	.rs-toll-road {
		margin-top: 10px;
		padding-top: 8px;
		border-top: 1px dashed rgba(0, 0, 0, 0.08);
		font-size: 12px;
		color: #fc8d59;

		.toll-icon {
			margin-right: 4px;
		}
	}
}

/* 窄屏每行 2 个 */
@media screen and (max-width: 380px) {
	.route-summary {
		.rs-item {
			flex: 1 1 45%;

			.rs-value {
				font-size: 14px;
			}
		}
	}
}
</style>
