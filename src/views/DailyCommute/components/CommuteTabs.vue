<!-- 上班/下班 切换 -->
<template>
	<div class="d-tabs">
		<div class="d-tab" :class="{ active: value === 'go' }" @click="$emit('change', 'go')">
			<span class="d-tab-icon">🏢</span><span>上班</span>
		</div>
		<div class="d-tab" :class="{ active: value === 'back' }" @click="$emit('change', 'back')">
			<span class="d-tab-icon">🏠</span><span>下班</span>
		</div>
		<div class="d-tab-tip">{{ tip }}</div>
	</div>
</template>

<script>
export default {
	name: 'CommuteTabs',
	props: {
		value: { type: String, default: 'go' },
		tip: { type: String, default: '' }
	}
};
</script>

<style lang="less" scoped>
.d-tabs {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px 4px 16px;

	.d-tab {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 8px 18px;
		border-radius: 18px;
		background: #fff;
		border: 1px solid rgba(0, 0, 0, 0.08);
		font-size: 14px;
		color: #2c3e50;
		cursor: pointer;
		transition: all 0.2s ease;

		.d-tab-icon {
			font-size: 15px;
			display: inline-block;
			transition: transform 0.3s ease;
		}

		// 上班图标：hover 轻弹跳（工作活力）
		&:hover .d-tab-icon {
			animation: tab-bounce 0.5s ease;
		}

		// 下班图标：hover 左右轻晃（归家放松）
		&:nth-child(2):hover .d-tab-icon {
			animation: tab-sway 0.6s ease;
		}

		&.active {
			background: var(--accent, #42b983);
			color: #fff;
			border-color: var(--accent, #42b983);
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
		}
	}

	.d-tab-tip {
		font-size: 11px;
		color: #bababa;
		white-space: nowrap;
		flex-shrink: 0;
	}
}

// 上班图标弹跳：向上轻跃再回落
@keyframes tab-bounce {
	0% {
		transform: translateY(0);
	}

	40% {
		transform: translateY(-4px);
	}

	60% {
		transform: translateY(-4px);
	}

	100% {
		transform: translateY(0);
	}
}

// 下班图标左右晃：归家摇摆
@keyframes tab-sway {
	0% {
		transform: rotate(0deg);
	}

	25% {
		transform: rotate(-12deg);
	}

	50% {
		transform: rotate(10deg);
	}

	75% {
		transform: rotate(-6deg);
	}

	100% {
		transform: rotate(0deg);
	}
}
</style>
