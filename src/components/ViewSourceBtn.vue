<!-- @name: ViewSourceBtn -->
<!-- @author: fx67ll -->
<!-- @version: 2.0.0-->
<!-- @description：统一的「查看源码 / 查看文档」入口组件，AI 助手式收缩胶囊。
                默认是一个贴在右边缘的小圆胶囊（带图标），点击展开为完整面板显示「源码/文档」按钮，
                点击空白处或按钮后自动收起。不挤压界面其他元素，各界面风格统一。 -->

<template>
	<div class="vs-wrap" :class="{ open: isOpen }">
		<!-- 展开后的面板 -->
		<transition name="vs-panel">
			<div class="vs-panel" v-if="isOpen">
				<div class="vs-panel-title">组件资料</div>
				<div class="vs-btn" @click="showCode">
					<span class="vs-icon">‹/›</span>
					<span class="vs-text">查看源码</span>
				</div>
				<div class="vs-btn" @click="showDoc">
					<span class="vs-icon">≡</span>
					<span class="vs-text">查看文档</span>
				</div>
			</div>
		</transition>

		<!-- 收缩状态的触发胶囊 -->
		<div class="vs-trigger" @click="toggle" :title="isOpen ? '收起' : '查看源码与文档'">
			<span class="vs-trigger-icon" v-if="!isOpen">‹/›</span>
			<span class="vs-trigger-icon" v-else>✕</span>
		</div>
	</div>
</template>

<script>
export default {
	name: 'ViewSourceBtn',
	props: {
		code: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			isOpen: false
		};
	},
	methods: {
		toggle() {
			this.isOpen = !this.isOpen;
		},
		showCode() {
			this.isOpen = false;
			this.$router.push({ path: '/code', query: { code: this.code } });
		},
		showDoc() {
			this.isOpen = false;
			this.$router.push({ path: '/doc', query: { code: this.code } });
		}
	}
};
</script>

<style lang="less" scoped>
.vs-wrap {
	position: absolute;
	top: 50%;
	right: 0;
	transform: translateY(-50%);
	z-index: 1001;
	display: flex;
	align-items: center;
}

/* 收缩触发胶囊：贴在右边缘的小圆 */
.vs-trigger {
	width: 28px;
	height: 56px;
	border-radius: 14px 0 0 14px;
	background: @green;
	border: 1px solid rgba(66, 185, 131, 0.6);
	border-right: none;
	box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.15);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.25s ease;
	.ban-user-select();

	.vs-trigger-icon {
		font-size: 13px;
		font-weight: bold;
		color: #ffffff;
		writing-mode: vertical-rl;
		letter-spacing: 1px;
	}
}
.vs-trigger:hover {
	width: 32px;
	background: #2c8c63;
}

/* 展开面板 */
.vs-panel {
	background: #ffffff;
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 10px;
	margin-right: 6px;
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
	min-width: 130px;
	.ban-user-select();

	.vs-panel-title {
		font-size: 11px;
		color: @grey;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		text-align: center;
	}

	.vs-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;

		.vs-icon {
			font-size: 13px;
			color: @green;
			font-weight: bold;
		}
		.vs-text {
			font-size: 13px;
			color: #2c3e50;
		}
	}
	.vs-btn:hover {
		background: rgba(66, 185, 131, 0.12);
		.vs-text {
			color: @green;
		}
	}
}

/* 面板展开动画 */
.vs-panel-enter-active,
.vs-panel-leave-active {
	transition: all 0.25s ease;
}
.vs-panel-enter,
.vs-panel-leave-to {
	opacity: 0;
	transform: translateX(20px);
}
</style>
