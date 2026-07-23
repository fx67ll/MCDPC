<!-- 路线对比：两条路线耗时并排，推荐更快的那条 -->
<template>
	<div class="route-compare" v-if="routes.length">
		<div class="rc-title"><span class="title-icon">🔀</span> 路线对比</div>
		<div class="rc-list">
			<div class="rc-item" v-for="(r, i) in routes" :key="i"
				:class="{ active: current === i, best: bestIdx === i, loading: !r }" @click="r && $emit('select', i)">
				<template v-if="r">
					<span class="rc-dot" :style="{ background: r.color }"></span>
					<div class="rc-info">
						<div class="rc-name">{{ r.name }}<span class="rc-best" v-if="bestIdx === i">最快</span></div>
						<div class="rc-meta">{{ r.durationText }} · {{ r.congestionText }}</div>
					</div>
					<span class="rc-save" v-if="bestIdx !== -1 && i !== bestIdx && r.duration > 0 && routes[bestIdx]">
						慢 {{ fmtDuration(r.duration - routes[bestIdx].duration) }}
					</span>
				</template>
				<template v-else>
					<span class="rc-dot loading-dot"></span>
					<div class="rc-info">
						<div class="rc-name">规划中...</div>
						<div class="rc-meta">正在获取路线</div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script>
import { fmtDuration } from '../commuteData.js';
export default {
	name: 'RouteCompare',
	props: {
		routes: { type: Array, default: () => [] },
		current: { type: Number, default: 0 }
	},
	computed: {
		bestIdx() {
			if (!this.routes.length) return -1;
			var best = -1;
			var min = Infinity;
			this.routes.forEach(function (r, i) {
				if (r && r.duration > 0 && r.duration < min) {
					min = r.duration;
					best = i;
				}
			});
			return best;
		}
	},
	methods: {
		fmtDuration: fmtDuration
	}
};
</script>

<style lang="less" scoped>
.route-compare {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);

	.rc-title {
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

	.rc-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.rc-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		cursor: pointer;
		transition: all 0.2s ease;

		&.active {
			border-color: var(--accent, #42b983);
			background: rgba(66, 185, 131, 0.06);
			box-shadow: 0 2px 8px rgba(66, 185, 131, 0.15);
		}

		&.loading {
			cursor: default;
			opacity: 0.6;
		}

		.rc-dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			flex-shrink: 0;
		}

		.loading-dot {
			background: #bababa;
			animation: dot-pulse 1s infinite;
		}

		.rc-info {
			flex: 1;

			.rc-name {
				font-size: 13px;
				font-weight: bold;
				color: #2c3e50;

				.rc-best {
					display: inline-block;
					margin-left: 6px;
					padding: 1px 6px;
					border-radius: 6px;
					font-size: 10px;
					background: #42b983;
					color: #fff;
				}
			}

			.rc-meta {
				font-size: 12px;
				color: #bababa;
				margin-top: 2px;
			}
		}

		.rc-save {
			font-size: 11px;
			color: #fc8d59;
			white-space: nowrap;
		}
	}
}

@keyframes dot-pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.3;
	}
}
</style>
