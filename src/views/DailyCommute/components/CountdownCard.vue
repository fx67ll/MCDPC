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
import { fmtDuration } from '../commuteData.js';
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
		latestStartText() {
			var deadline = this.todayAt(9, 0);
			var latest = new Date(deadline - this.duration * 1000);
			if (latest < this.now) return '已超时';
			var h = latest.getHours();
			var m = latest.getMinutes();
			return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
		},
		subText() {
			if (this.period === 'today') {
				// 9~18点
				if (this.isLate) {
					return '⚠ 现在出发将迟到 ' + fmtDuration(Math.floor((new Date(this.now.getTime() + this.duration * 1000) - this.todayAt(9, 0)) / 1000)) + '，建议尽快出发';
				}
				return '现在出发可准时抵达';
			}
			// 9点前 / 次日：倒计时模式
			var label = this.period === 'nextday' ? '距离明日 09:00 上班' : '距离今日 09:00 上班';
			var txt = label;
			if (this.duration > 0) {
				var latest = new Date(this.target - this.duration * 1000);
				if (latest > this.now) {
					var h = latest.getHours();
					var m = latest.getMinutes();
					txt += '，最晚 ' + (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ' 出发';
				}
			}
			if (this.bestDuration && this.bestDuration < this.duration) {
				txt += '（切换更快路线可省 ' + fmtDuration(this.duration - this.bestDuration) + '）';
			}
			return txt;
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
	transition: background 0.3s ease;

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
