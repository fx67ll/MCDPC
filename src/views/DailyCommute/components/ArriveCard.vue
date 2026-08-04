<!-- 抵达信息卡：预计抵达终点时间 + 总耗时 + 拥堵（上下班通用，关键信息）
     纯抵达信息展示，不整合倒计时（倒计时由 CountdownCard 独立负责），不用迟到脉冲动效 -->
<template>
	<div class="arrive-card" v-if="data" :class="['cong-' + data.congestionCls, 'tab-' + tab, { compact: compact, mini: mini, copied: copied, 'is-late': isLate }]"
		@click="onCardClick" :title="!mini ? '点击复制抵达时间' : ''">
		<!-- mini 模式：仅抵达时间 -->
		<div class="ac-mini" v-if="mini">
			<span class="ac-mini-time" :class="{ loading: !data.endArriveText || data.endArriveText === '--:--' }">{{ data.endArriveText || '--:--' }}</span>
			<span class="ac-mini-label">{{ tab === 'go' ? '到达' : '到家' }}</span>
		</div>
		<!-- 标准模式：抵达时间 + 总耗时/拥堵 + 副文案 -->
		<template v-else>
			<div class="ac-main">
				<div class="ac-arrive">
					<span class="ac-arrive-label">{{ tab === 'go' ? '预计到达' : '预计到家' }}</span>
					<span class="ac-arrive-time" :class="{ loading: !data.endArriveText || data.endArriveText === '--:--' }">
						{{ data.endArriveText || '--:--' }}
					</span>
				</div>
				<div class="ac-meta">
					<span class="ac-dur">{{ data.durationText }}</span>
					<span class="ac-sep">·</span>
					<span class="ac-cong" :class="'cong-' + data.congestionCls">{{ data.congestionText }}</span>
				</div>
			</div>
			<div class="ac-sub" v-if="subText">{{ subText }}</div>
			<!-- 复制成功提示 -->
			<transition name="ac-copy-fade">
				<div class="ac-copied" v-if="copied">✓ 已复制抵达时间</div>
			</transition>
		</template>
	</div>
</template>

<script>
import { fmtDuration } from '../commuteData.js';
export default {
	name: 'ArriveCard',
	props: {
		data: { type: Object, default: null },
		tab: { type: String, default: '' },
		now: { type: Date, default: () => new Date() },
		// 可选更快路线耗时（秒），用于上班"切换可省 X"提示
		bestDuration: { type: Number, default: 0 },
		compact: { type: Boolean, default: false },
		mini: { type: Boolean, default: false }
	},
	data() {
		return {
			copied: false,
			copyTimer: null
		};
	},
	computed: {
		duration() {
			return this.data ? this.data.duration : 0;
		},
		// 上班迟到判定（与 CountdownCard 一致）：9~18 点且现在出发会晚于 9 点
		isLate() {
			if (this.tab !== 'go' || !this.duration) return false;
			var h = this.now.getHours();
			if (h < 9 || h >= 18) return false;
			var arrive = new Date(this.now.getTime() + this.duration * 1000);
			return arrive > this.todayAt(9, 0);
		},
		subText() {
			if (!this.duration) return '';
			if (this.tab === 'go') {
				// 上班：最晚出发时间提示（不判定迟到、不脉冲，仅文字提示）
				var h = this.now.getHours();
				var target = new Date(this.now);
				if (h >= 18) {
					target.setDate(target.getDate() + 1);
				}
				target.setHours(9, 0, 0, 0);
				var latest = new Date(target - this.duration * 1000);
				var txt = '';
				if (h >= 9 && h < 18) {
					// 9~18 点：已过上班时间
					var arrive = new Date(this.now.getTime() + this.duration * 1000);
					if (arrive > this.todayAt(9, 0)) {
						var lateSec = Math.floor((arrive - this.todayAt(9, 0)) / 1000);
						txt = '现在出发将迟到 ' + fmtDuration(lateSec);
					} else {
						txt = '现在出发可准时到达';
					}
				} else if (latest > this.now) {
					var lh = latest.getHours();
					var lm = latest.getMinutes();
					var label = h >= 18 ? '最晚明日 ' : '最晚今日 ';
					txt = label + (lh < 10 ? '0' + lh : lh) + ':' + (lm < 10 ? '0' + lm : lm) + ' 出发可准时';
				} else {
					txt = '已超最晚出发时间';
				}
				if (this.bestDuration && this.bestDuration < this.duration) {
					txt += '（切换更快路线可省 ' + fmtDuration(this.duration - this.bestDuration) + '）';
				}
				return txt;
			}
			// 下班：根据到家时段与剩余闲暇时间生成暖心文案，避免与总耗时重复
			return this.backSubText();
		}
	},
	methods: {
		todayAt(h, m) {
			var d = new Date(this.now);
			d.setHours(h, m, 0, 0);
			return d;
		},
		// 点击复制抵达时间到剪贴板
		onCardClick() {
			if (this.mini || !this.data || !this.data.endArriveText) return;
			var text = this.data.endArriveText;
			var self = this;
			if (navigator.clipboard) {
				navigator.clipboard.writeText(text).then(function () {
					self.showCopied();
				}).catch(function () {});
			} else {
				// 降级方案
				var ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				try { document.execCommand('copy'); self.showCopied(); } catch (e) {}
				document.body.removeChild(ta);
			}
		},
		showCopied() {
			var self = this;
			this.copied = true;
			if (this.copyTimer) clearTimeout(this.copyTimer);
			this.copyTimer = setTimeout(function () {
				self.copied = false;
			}, 1500);
		},
		// 下班副文案：到家时段 + 闲暇时长 + 拥堵语气，随时间丰富变化
		// 休息基准 00:00（12点上床睡觉），到家后到午夜的闲暇
		backSubText() {
			var arrive = new Date(this.now.getTime() + this.duration * 1000);
			var ah = arrive.getHours();
			// 午夜 00:00 作为上床时间
			var bedtime = new Date(arrive);
			bedtime.setHours(24, 0, 0, 0); // 当日午夜
			if (arrive.getHours() >= 0 && arrive.getHours() < 6) {
				// 凌晨到家，已过午夜
				return '辛苦了，到家赶紧睡吧 🌙';
			}
			var freeSec = Math.floor((bedtime - arrive) / 1000);
			var freeHours = freeSec / 3600;
			// 拥堵语气点缀
			var cong = this.data.congestionCls;
			var jamPrefix = '';
			if (cong === 'bad') jamPrefix = '路上有点堵，';
			else if (cong === 'jam') jamPrefix = '一路不太顺，';
			else if (cong === 'slow') jamPrefix = '路上稍缓，';

			// 按到家时段 + 闲暇组合
			if (ah < 18) {
				// 傍晚前到家，闲暇充裕
				if (freeHours >= 6) return jamPrefix + '轻松到家，今晚大把时光可以挥霍 ✨';
				return jamPrefix + '轻松到家，今晚属于自己的时间很充裕 😊';
			}
			if (ah < 20) {
				// 18~20 点到家
				if (freeHours >= 5) return jamPrefix + '到家正好，还能好好吃顿晚饭 🍜';
				return jamPrefix + '到家歇会儿，今晚还能放松 ' + Math.floor(freeHours) + ' 小时';
			}
			if (ah < 22) {
				// 20~22 点到家
				if (freeHours >= 3) return jamPrefix + '到家了，追个剧放松下再睡 📺';
				return jamPrefix + '到家洗漱下，今晚还能潇洒 ' + Math.floor(freeHours) + ' 小时';
			}
			// 22~24 点到家
			if (freeHours >= 1) return jamPrefix + '到家冲个澡，今晚还能潇洒 ' + Math.floor(freeHours) + ' 小时 🌙';
			return jamPrefix + '到家快冲个澡，抓紧休息啦 🌙';
		}
	}
};
</script>

<style lang="less" scoped>
.arrive-card {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 14px 18px;
	border-radius: 14px;
	// 白底卡片 + 左侧主题色色条，质感清晰不透明
	background: #fff;
	color: #2c3e50;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	border: 1px solid rgba(0, 0, 0, 0.05);
	position: relative;
	overflow: hidden;

	// 左侧主题色色条（点缀，不抢主体）
	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: var(--card-accent, #42b983);
	}

	.ac-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;

		.ac-arrive {
			display: flex;
			flex-direction: column;
			gap: 2px;

			.ac-arrive-label {
				font-size: 12px;
				color: #95a5a6;
			}

			.ac-arrive-time {
				font-size: 30px;
				font-weight: bold;
				font-family: 'Courier New', monospace;
				line-height: 1.1;
				color: var(--card-accent, #42b983);

				&.loading {
					font-size: 18px;
					opacity: 0.5;
				}
			}
		}

		.ac-meta {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 13px;
			font-weight: bold;
			background: rgba(0, 0, 0, 0.04);
			padding: 6px 12px;
			border-radius: 10px;
			white-space: nowrap;
			color: #2c3e50;

			.ac-sep {
				opacity: 0.4;
			}

			.ac-cong {
				// 拥堵语义色
				&.cong-smooth {
					color: #42b983;
				}

				&.cong-slow {
					color: #f5a623;
				}

				&.cong-jam {
					color: #ef8e81;
				}

				&.cong-bad {
					color: #ef6b5a;
				}

				&.cong-unknown {
					color: #bababa;
				}
			}
		}
	}

	.ac-sub {
		margin-top: 8px;
		font-size: 12px;
		color: #7f8c8d;
	}

	// 上班：白底 + 主题绿点缀（左侧色条 + 抵达时间主题绿）
	&.tab-go {
		--card-accent: #42b983;
	}

	// 上班迟到联动：静态红色背景 + 加强阴影（不脉冲，与倒计时卡片动效互补）
	&.is-late.tab-go {
		background: linear-gradient(135deg, #ef6b5a, #f08a7a);
		border-color: transparent;
		box-shadow: 0 4px 18px rgba(239, 107, 90, 0.4);

		&::before {
			background: #fff;
		}

		.ac-arrive-label {
			color: rgba(255, 255, 255, 0.85);
		}

		.ac-arrive-time {
			color: #fff;
		}

		.ac-meta {
			background: rgba(255, 255, 255, 0.22);
			color: #fff;
		}

		.ac-sub {
			color: rgba(255, 255, 255, 0.95);
			font-weight: bold;
		}
	}

	// 下班：深蓝渐变（同 fx67ll 卡片基调）+ 亮色文字，抵达时间用主题黄醒目
	&.tab-back {
		--card-accent: #f5c542;
		background: linear-gradient(135deg, #2c3e50, #3a4a5e);
		color: #fff;
		border-color: transparent;

		// 隐藏左侧色条（渐变背景已足够）
		&::before {
			display: none;
		}

		.ac-arrive-label {
			color: rgba(255, 255, 255, 0.75);
		}

		// 抵达时间：主题黄，深蓝底上最醒目
		.ac-arrive-time {
			color: #f5c542;
		}

		.ac-meta {
			background: rgba(255, 255, 255, 0.18);
			color: #fff;
		}

		.ac-sub {
			color: rgba(255, 255, 255, 0.88);
		}
	}

	// 上班拥堵：色条 + 抵达时间色随拥堵变化（白底上生效）
	&.cong-bad.tab-go {
		--card-accent: #ef6b5a;
	}

	&.cong-jam.tab-go {
		--card-accent: #f08a4b;
	}

	&.cong-slow.tab-go {
		--card-accent: #f5a623;
	}

	&.cong-unknown.tab-go {
		--card-accent: #95a5a6;
	}

	// 下班拥堵：深蓝底上叠加拥堵色调
	&.cong-bad.tab-back {
		background: linear-gradient(135deg, #3a2c3e, #5a3a3e);
		.ac-arrive-time { color: #ef6b5a; }
	}

	&.cong-jam.tab-back {
		background: linear-gradient(135deg, #3a3340, #5a4538);
		.ac-arrive-time { color: #f08a4b; }
	}

	&.cong-slow.tab-back {
		background: linear-gradient(135deg, #2c3e50, #4a4a3e);
		.ac-arrive-time { color: #f5a623; }
	}

	&.cong-unknown.tab-back {
		background: linear-gradient(135deg, #3a3a40, #4a4a52);
		.ac-arrive-time { color: #95a5a6; }
	}

	// hover 交互：上浮 + 阴影增强（仅标准模式，非 mini）
	&:not(.mini) {
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
		}

		&:active {
			transform: translateY(0);
		}
	}

	// 复制成功提示
	.ac-copied {
		position: absolute;
		top: 8px;
		right: 12px;
		font-size: 11px;
		color: #fff;
		background: rgba(0, 0, 0, 0.4);
		padding: 3px 8px;
		border-radius: 6px;
		pointer-events: none;
	}
}

// 复制提示过渡
.ac-copy-fade-enter-active,
.ac-copy-fade-leave-active {
	transition: opacity 0.25s ease;
}

.ac-copy-fade-enter,
.ac-copy-fade-leave-to {
	opacity: 0;
}

/* 紧凑模式：移动端底部抽屉用，缩小尺寸 */
.arrive-card.compact {
	margin: 10px 12px 0 12px;
	padding: 10px 14px;

	.ac-main {
		gap: 8px;

		.ac-arrive {
			gap: 1px;

			.ac-arrive-label {
				font-size: 11px;
			}

			.ac-arrive-time {
				font-size: 22px;

				&.loading {
					font-size: 14px;
				}
			}
		}

		.ac-meta {
			font-size: 12px;
			padding: 4px 10px;
		}
	}

	.ac-sub {
		margin-top: 6px;
		font-size: 11px;
	}
}

/* mini 模式：移动端左下角悬浮，仅抵达时间 */
.arrive-card.mini {
	margin: 0;
	padding: 8px 14px;
	border-radius: 12px;
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
	color: #fff;
	border: none;

	// mini 用主题色实底（悬浮在地图上需保证对比度）
	&.tab-go {
		background: #42b983;
	}

	&.tab-back {
		background: #f5a623;
	}

	.ac-mini {
		display: flex;
		align-items: baseline;
		gap: 5px;

		.ac-mini-label {
			font-size: 11px;
			opacity: 0.9;
		}

		.ac-mini-time {
			font-size: 20px;
			font-weight: bold;
			font-family: 'Courier New', monospace;
			line-height: 1.1;

			&.loading {
				font-size: 14px;
				opacity: 0.6;
			}
		}
	}
}
</style>
