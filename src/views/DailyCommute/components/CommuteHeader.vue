<!-- 顶部栏：标题 / 当前时间 / 刷新 -->
<template>
	<header class="d-header">
		<div class="d-header-left">
			<div class="d-title">每日通勤</div>
			<div class="d-now">{{ nowText }}</div>
		</div>
		<div class="d-header-right">
			<div class="d-refresh" @click="$emit('refresh')" :class="{ loading: loading }">
				<span class="d-refresh-icon">{{ loading ? '⟳' : '↻' }}</span>
				<span class="d-refresh-text">刷新</span>
			</div>
		</div>
	</header>
</template>

<script>
import { formatTime } from '../commuteData.js';
export default {
	name: 'CommuteHeader',
	props: {
		now: { type: Date, default: () => new Date() },
		loading: { type: Boolean, default: false }
	},
	computed: {
		nowText() {
			return formatTime(this.now);
		}
	}
};
</script>

<style lang="less" scoped>
.d-header {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px;
	background: #ffffff;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);

	.d-title {
		font-size: 18px;
		font-weight: bold;
		color: #2c3e50;
	}
	.d-now {
		font-size: 13px;
		color: var(--accent, #42b983);
		margin-top: 2px;
		font-family: 'Courier New', monospace;
		font-weight: bold;
	}
	.d-refresh {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 14px;
		border-radius: 16px;
		background: var(--accent, #42b983);
		color: #fff;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s ease;
		.d-refresh-icon {
			display: inline-block;
		}
		&.loading .d-refresh-icon {
			animation: spin 1s linear infinite;
		}
		&:hover {
			opacity: 0.9;
		}
	}
}
@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
