<!-- 道路封闭/异常醒目提示 -->
<template>
	<div class="alert-banner" v-if="text">
		<span class="alert-banner-icon">⚠</span>
		<span class="alert-banner-text">{{ text }}</span>
	</div>
</template>

<script>
export default {
	name: 'AlertBanner',
	props: {
		text: { type: String, default: '' }
	}
};
</script>

<style lang="less" scoped>
.alert-banner {
	flex-shrink: 0;
	margin: 10px 16px 0 16px;
	padding: 10px 14px;
	border-radius: 10px;
	background: #fff5f5;
	border: 1px solid #ef8e81;
	color: #c0392b;
	font-size: 13px;
	display: flex;
	align-items: center;
	gap: 8px;
	animation: pulse 1.5s infinite;

	.alert-banner-icon {
		font-size: 16px;
	}
}

@keyframes pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.6;
	}
}
</style>
