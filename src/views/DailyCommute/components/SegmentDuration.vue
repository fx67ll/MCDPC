<!-- 分段用时：动态渲染所有区段的实际耗时（支持任意数量途经点） -->
<template>
	<div class="seg-dur" v-if="data && data.segDurations && data.segDurations.length">
		<div class="sd-title" v-if="showTitle"><span class="title-icon">⏱</span> 分段用时</div>
		<div class="sd-row" v-for="(seg, i) in data.segDurations" :key="i">
			<div class="sd-leg">
				<span class="sd-dot" :class="dotClass(i)"></span>
				<span class="sd-from">{{ seg.from }}</span>
			</div>
			<span class="sd-arrow">→</span>
			<div class="sd-leg">
				<span class="sd-dot" :class="dotClass(i + 1)"></span>
				<span class="sd-from">{{ seg.to }}</span>
			</div>
			<span class="sd-dur">{{ seg.durationText }}</span>
		</div>
	</div>
</template>

<script>
export default {
	name: 'SegmentDuration',
	props: {
		data: { type: Object, default: null },
		showTitle: { type: Boolean, default: true }
	},
	methods: {
		// 根据索引返回圆点颜色类（起点绿、途经黄、终点红）
		dotClass(i) {
			var total = this.data && this.data.segDurations ? this.data.segDurations.length : 0;
			if (i === 0) return 'start';
			if (i === total) return 'end';
			return 'via';
		}
	}
};
</script>

<style lang="less" scoped>
.seg-dur {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);

	.sd-title {
		font-size: 13px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 12px;
		display: flex;
		align-items: center;
		gap: 6px;

		.title-icon {
			font-size: 16px;
			line-height: 1;
			flex-shrink: 0;
			position: relative;
			top: 1px;
		}
	}

	.sd-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 0;

		&:not(:last-child) {
			border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
		}

		.sd-leg {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			min-width: 0;
		}

		.sd-dot {
			width: 9px;
			height: 9px;
			border-radius: 50%;
			flex-shrink: 0;

			&.start {
				background: #42b983;
			}

			&.via {
				background: #f5c542;
			}

			&.end {
				background: #ef6b5a;
			}
		}

		.sd-from {
			font-size: 12px;
			color: #2c3e50;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.sd-arrow {
			font-size: 12px;
			color: #bababa;
			flex-shrink: 0;
		}

		.sd-dur {
			margin-left: auto;
			font-size: 14px;
			font-weight: bold;
			color: var(--accent, #42b983);
			white-space: nowrap;
			flex-shrink: 0;
		}
	}
}
</style>
