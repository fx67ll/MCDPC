<!-- 路段拥堵明细：彩色条 + 图例 -->
<template>
	<div class="segments" v-if="data && data.segments && data.segments.length">
		<div class="seg-title">路段拥堵明细</div>
		<div class="seg-bar">
			<div class="seg-block" v-for="(s, i) in data.segments" :key="i" :class="'seg-' + s.level"
				:style="{ flex: s.weight }" :title="s.name + ' · ' + s.statusText"></div>
		</div>
		<div class="seg-legend">
			<span class="seg-leg"><i class="leg-dot seg-1"></i>畅通</span>
			<span class="seg-leg"><i class="leg-dot seg-2"></i>缓行</span>
			<span class="seg-leg"><i class="leg-dot seg-3"></i>拥堵</span>
			<span class="seg-leg"><i class="leg-dot seg-4"></i>严重拥堵</span>
		</div>
	</div>
</template>

<script>
export default {
	name: 'SegmentsBar',
	props: {
		data: { type: Object, default: null }
	}
};
</script>

<style lang="less" scoped>
.segments {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);

	.seg-title {
		font-size: 13px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 8px;
	}

	.seg-bar {
		display: flex;
		height: 14px;
		border-radius: 7px;
		overflow: hidden;

		.seg-block {
			height: 100%;
		}

		.seg-0 {
			background: #c0c0c0;
		}

		// 未知：灰色
		.seg-1 {
			background: #42b983;
		}

		// 畅通：绿
		.seg-2 {
			background: #f5af19;
		}

		// 缓行：黄
		.seg-3 {
			background: #fc8d59;
		}

		// 拥堵：橙
		.seg-4 {
			background: #d73027;
		}

		// 严重拥堵：红
	}

	.seg-legend {
		display: flex;
		gap: 14px;
		margin-top: 8px;
		flex-wrap: wrap;

		.seg-leg {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 11px;
			color: #bababa;

			.leg-dot {
				width: 10px;
				height: 10px;
				border-radius: 2px;
				display: inline-block;
			}
		}
	}
}
</style>
