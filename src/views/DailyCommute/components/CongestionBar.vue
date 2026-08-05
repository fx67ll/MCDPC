<!-- 路线拥堵程度可视化：彩色条 + 图例 + 当前位置"我"标记（移动端详情卡片用） -->
<!-- segments：parseRoute 产出的分段拥堵数组（level 0~4，weight 加权） -->
<!-- mePercent：当前位置在路线上的进度百分比（0~100），null 表示不在路线上（由父组件用 locateOnRoute 计算） -->
<template>
	<div class="cong-bar" v-if="segments && segments.length">
		<div class="cb-head">
			<span class="cb-title"><span class="cb-icon">🚦</span> 路况概览</span>
			<span class="cb-overall" :class="'cb-level-' + overallLevel">{{ overallText }}</span>
		</div>
		<div class="cb-track">
			<div class="cb-block" v-for="(s, i) in segments" :key="i" :class="'cb-' + s.level"
				:style="{ flex: s.weight }" :title="s.name + ' · ' + s.statusText"></div>
			<!-- 当前位置"我"标记 -->
			<div class="cb-me" v-if="mePercent !== null" :style="{ left: mePercent + '%' }" title="我的位置">
				<span class="cb-me-pin">📍</span>
			</div>
		</div>
		<div class="cb-legend">
			<span class="cb-leg"><i class="leg-dot cb-1"></i>畅通</span>
			<span class="cb-leg"><i class="leg-dot cb-2"></i>缓行</span>
			<span class="cb-leg"><i class="leg-dot cb-3"></i>拥堵</span>
			<span class="cb-leg"><i class="leg-dot cb-4"></i>严重拥堵</span>
			<span class="cb-leg cb-leg-me" v-if="mePercent !== null"><i class="leg-dot leg-me">📍</i>我的位置</span>
		</div>
	</div>
</template>

<script>
import { overallCongestionLevel } from '../commuteData.js';
export default {
	name: 'CongestionBar',
	props: {
		segments: { type: Array, default: function () { return []; } },
		mePercent: { type: Number, default: null }
	},
	computed: {
		overallLevel() {
			return overallCongestionLevel(this.segments);
		},
		overallText() {
			var map = { 0: '未知', 1: '整体畅通', 2: '局部缓行', 3: '多处拥堵', 4: '严重拥堵' };
			return map[this.overallLevel] || '未知';
		}
	}
};
</script>

<style lang="less" scoped>
.cong-bar {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 12px 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.06);
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
		border-color: var(--accent, #42b983);
	}

	.cb-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;

		.cb-title {
			font-size: 13px;
			font-weight: bold;
			color: #2c3e50;
			display: flex;
			align-items: center;
			gap: 5px;

			.cb-icon {
				font-size: 12px;
				line-height: 1;
			}
		}

		.cb-overall {
			font-size: 11px;
			font-weight: bold;
			padding: 2px 8px;
			border-radius: 8px;

			&.cb-level-0 {
				background: rgba(0, 0, 0, 0.06);
				color: #bababa;
			}

			&.cb-level-1 {
				background: rgba(66, 185, 131, 0.15);
				color: #42b983;
			}

			&.cb-level-2 {
				background: rgba(245, 175, 25, 0.15);
				color: #d99500;
			}

			&.cb-level-3 {
				background: rgba(252, 141, 89, 0.15);
				color: #fc8d59;
			}

			&.cb-level-4 {
				background: rgba(215, 48, 39, 0.15);
				color: #d73027;
			}
		}
	}

	.cb-track {
		position: relative;
		display: flex;
		height: 14px;
		border-radius: 7px;
		overflow: visible;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);

		.cb-block {
			height: 100%;

			&:first-child {
				border-radius: 7px 0 0 7px;
			}

			&:last-child {
				border-radius: 0 7px 7px 0;
			}
		}

		.cb-0 {
			background: #c0c0c0;
		}

		// 未知：灰
		.cb-1 {
			background: #42b983;
		}

		// 畅通：绿
		.cb-2 {
			background: #f5af19;
		}

		// 缓行：黄
		.cb-3 {
			background: #fc8d59;
		}

		// 拥堵：橙
		.cb-4 {
			background: #d73027;
		}

		// 严重拥堵：红

		// "我"的位置标记
		.cb-me {
			position: absolute;
			top: -4px;
			bottom: -4px;
			transform: translateX(-50%);
			z-index: 2;
			pointer-events: none;
			transition: left 0.3s ease;

			.cb-me-pin {
				position: absolute;
				top: -14px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 13px;
				line-height: 1;
				filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
			}

			// 竖向定位线
			&::after {
				content: '';
				position: absolute;
				top: 0;
				bottom: 0;
				left: 50%;
				width: 2px;
				background: #fff;
				transform: translateX(-50%);
				box-shadow: 0 0 0 1px rgba(44, 62, 80, 0.4);
			}
		}
	}

	.cb-legend {
		display: flex;
		gap: 12px;
		margin-top: 10px;
		flex-wrap: wrap;

		.cb-leg {
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

				&.cb-0 {
					background: #c0c0c0;
				}

				&.cb-1 {
					background: #42b983;
				}

				&.cb-2 {
					background: #f5af19;
				}

				&.cb-3 {
					background: #fc8d59;
				}

				&.cb-4 {
					background: #d73027;
				}
			}
		}

		.cb-leg-me {
			color: #2c3e50;

			.leg-me {
				background: transparent;
				font-size: 11px;
				line-height: 1;
				width: auto;
				height: auto;
			}
		}
	}
}
</style>
