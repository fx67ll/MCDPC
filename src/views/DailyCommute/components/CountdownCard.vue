<!-- 上班倒计时卡：距 09:00 倒计时 + 出发建议 -->
<template>
	<div class="countdown-box" :class="{ 'is-late': isLate }">
		<div class="cd-main">
			<span class="cd-label">距离 09:00 上班</span>
			<span class="cd-time" :class="{ urgent: urgent }">{{ countdownText }}</span>
		</div>
		<div class="cd-sub" :class="{ late: isLate }">{{ subText }}</div>
	</div>
</template>

<script>
import { fmtDuration } from '@/utils/commuteUtils.js';;
export default {
	name: 'CountdownCard',
	props: {
		now: { type: Date, default: () => new Date() },
		// 当前选中路线总耗时（秒）
		duration: { type: Number, default: 0 },
		// 是否有可选更快的路线及其耗时
		bestDuration: { type: Number, default: 0 }
	},
	computed: {
		// 当前时段：before 9点前 / today 9~18点 / nextday 18点后
		period() {
			var h = this.now.getHours();
			if (h < 9) return 'before';
			if (h < 18) return 'today';
			return 'nextday';
		},
		// 目标上班时间：9点前=今日9点，18点后=次日9点，9~18点=今日9点（已过）
		target() {
			if (this.period === 'nextday') {
				var d = new Date(this.now);
				d.setDate(d.getDate() + 1);
				d.setHours(9, 0, 0, 0);
				return d;
			}
			return this.todayAt(9, 0);
		},
		remainSeconds() {
			return Math.floor((this.target - this.now) / 1000);
		},
		countdownText() {
			var r = this.remainSeconds;
			if (this.period === 'today') {
				// 9~18点：已过上班时间，不显示倒计时
				return '已到上班时间';
			}
			if (r <= 0) return '已到上班时间';
			var h = Math.floor(r / 3600);
			var m = Math.floor((r % 3600) / 60);
			var s = r % 60;
			return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
		},
		urgent() {
			return this.period !== 'today' && this.remainSeconds > 0 && this.remainSeconds <= 1800;
		},
		// 迟到仅在 9~18点 且现在出发会晚于9点时判定
		isLate() {
			if (this.period !== 'today') return false;
			var arrive = new Date(this.now.getTime() + this.duration * 1000);
			return arrive > this.todayAt(9, 0);
		},
		subText() {
			if (this.period === 'today') {
				// 9~18点：已过上班时间，按是否迟到给简短状态
				return this.isLate ? '已迟到，建议尽快出发' : '已到上班时间，现在出发可准时';
			}
			// 9点前 / 次日：倒计时模式，按剩余时间紧迫度给行动建议
			// 最晚出发时间由抵达卡展示，这里聚焦倒计时语境
			var r = this.remainSeconds;
			if (this.duration > 0 && r > 0) {
				// 剩余时间相对通勤耗时的富余度
				var buffer = r - this.duration;
				if (buffer <= 0) {
					return '剩余时间已不足通勤，建议立即出发';
				}
				if (buffer <= 1800) {
					return '时间偏紧，建议尽快出发';
				}
				return '时间充裕，可从容出发';
			}
			return '';
		}
	},
	methods: {
		todayAt(h, m) {
			var d = new Date(this.now);
			d.setHours(h, m, 0, 0);
			return d;
		}
	}
};
</script>

<style lang="less" scoped>
.countdown-box {
	flex-shrink: 0;
	margin: 8px 16px 0 16px;
	padding: 14px 18px;
	border-radius: 12px;
	background: linear-gradient(135deg, var(--accent, #42b983), rgba(66, 185, 131, 0.6));
	color: #fff;
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 22px rgba(0, 0, 0, 0.15);
	}

	.cd-main {
		display: flex;
		align-items: baseline;
		gap: 10px;

		.cd-label {
			font-size: 13px;
			opacity: 0.9;
		}

		.cd-time {
			font-size: 28px;
			font-weight: bold;
			font-family: 'Courier New', monospace;

			&.urgent {
				color: #fff3cd;
				animation: pulse 1s infinite;
			}
		}
	}

	.cd-sub {
		margin-top: 6px;
		font-size: 12px;
		opacity: 0.95;

		&.late {
			color: #fff;
			font-weight: bold;
		}
	}

	// 迟到状态：整体换成小清新红，关键信息醒目
	&.is-late {
		background: linear-gradient(135deg, #ef6b5a, #f08a7a);
		box-shadow: 0 4px 14px rgba(239, 107, 90, 0.35);
		animation: pulse 1.2s infinite;

		.cd-time {
			color: #fff;
		}
	}
}

@keyframes pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.7;
	}
}
</style>
