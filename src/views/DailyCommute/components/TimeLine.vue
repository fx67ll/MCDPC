<!-- 关键时间点：动态渲染所有点（起点→途经1→途经2→...→终点） -->
<template>
	<div class="timeline" v-if="data && data.timePoints && data.timePoints.length">
		<div class="tl-title"><span class="title-icon">🕐</span> 关键时间点</div>
		<div class="tl-item" v-for="(pt, i) in data.timePoints" :key="i">
			<div class="tl-dot" :class="pt.dotClass"></div>
			<div class="tl-content">
				<div class="tl-name">{{ pt.isStart ? '' : (pt.dotClass === 'end' ? '终点 · ' : '途经 · ') }}{{ pt.name }}</div>
				<div class="tl-time" v-if="pt.isStart">出发 {{ nowText }}</div>
				<div class="tl-time" v-else>预计抵达 {{ pt.arriveText }}</div>
				<div class="tl-extra" v-if="showRemain && !pt.isStart" :class="{ late: isLate(pt.remainText) }">距 09:00 剩余 {{ pt.remainText }}</div>
			</div>
		</div>
	</div>
</template>

<script>
import { formatTime } from '../commuteData.js';
export default {
	name: 'TimeLine',
	props: {
		data: { type: Object, default: null },
		now: { type: Date, default: () => new Date() },
		showRemain: { type: Boolean, default: false }
	},
	computed: {
		nowText() {
			return formatTime(this.now);
		}
	},
	methods: {
		isLate(text) {
			return !!text && text.indexOf('已迟到') === 0;
		}
	}
};
</script>

<style lang="less" scoped>
.timeline {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);

	.tl-title {
		font-size: 13px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		gap: 6px;
		.title-icon {
			font-size: 14px;
			line-height: 1;
			flex-shrink: 0;
		}
	}

	.tl-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 8px 0;
		&:not(:last-child) {
			border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
		}
		.tl-dot {
			width: 12px;
			height: 12px;
			border-radius: 50%;
			margin-top: 3px;
			flex-shrink: 0;
			border: 2px solid #fff;
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
			&.start { background: #42b983; }
			&.via { background: #f5c542; }
			&.end { background: #ef6b5a; }
		}
		.tl-content {
			flex: 1;
			.tl-name {
				font-size: 14px;
				font-weight: bold;
				color: #2c3e50;
			}
			.tl-time {
				font-size: 13px;
				color: #2c3e50;
				margin-top: 2px;
			}
			.tl-extra {
				font-size: 12px;
				color: var(--accent, #42b983);
				margin-top: 2px;
				font-weight: bold;
				&.late {
					color: #ef6b5a;
				}
			}
		}
	}
}
</style>
