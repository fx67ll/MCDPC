<template>
	<div id="app">
		<transition :name="transitionName" mode="out-in">
			<router-view></router-view>
		</transition>
		<!-- 全站统一返回按钮：悬浮玻璃质感，hover 微动效，淡入出现 -->
		<transition name="backbtn-fade">
			<div v-if="this.$store.state.isShowbckbtn" class="fx67ll-backbtn" @click="back" title="返回">
				<span class="fx67ll-backbtn-arrow">‹</span>
				<span class="fx67ll-backbtn-text">返回</span>
			</div>
		</transition>
	</div>
</template>

<script>
import vueCanvasNest from 'vue-canvas-nest';

// 可用的随机过渡效果集合
const TRANSITIONS = ['fade', 'slide-left', 'slide-up', 'zoom', 'fade-zoom'];

export default {
	name: 'app',
	components: {
		vueCanvasNest
	},
	data() {
		return {
			transitionName: 'fade',
			// nestConfig: {
			// 	color: 'rgb(186, 186, 186)', // the canvas line color, default: '255,0,0'; the color is (R,G,B)
			// 	opacity: 0.7, // the opacity of line (0~1), default: 0.7
			// 	count: 33, // the number of lines, default: 99
			// 	zIndex: -1 // the index of z space, default: -1
			// },
			// isLoadingCompleted: false
		};
	},
	watch: {
		// 每次路由切换随机选一种过渡动画
		$route() {
			var next = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
			this.transitionName = next;
		}
	},
	mounted() {
		// var self = this;
		// var loadingTimer = setTimeout(function() {
		// 	self.isLoadingCompleted = true;
		// 	clearTimeout(loadingTimer);
		// }, 100);
		// // 在控制台输出一下canvas-nest展开的时间
		// // 不过好像异步处理一下的canvas-nest会自己全部展开了
		// this.showSeconds(1);
	},
	methods: {
		// showSeconds(time) {
		// 	var self = this;
		// 	var consoleTimer = setTimeout(function() {
		// 		// console.log(`Waiting canvas-nest spread out......${time}s`);
		// 		// console.log(`canvas-nest is spread out!`);
		// 		console.log('code is magic!');
		// 		console.log('https://fx67ll.xyz');
		// 		if (!self.isLoadingCompleted) {
		// 			self.showSeconds(time + 1);
		// 		} else {
		// 			clearTimeout(consoleTimer);
		// 		}
		// 	}, 100);
		// },
		back() {
			if (window.history.length <= 1) {
				this.$router.push({ path: '/' });
				return false;
			} else {
				this.$router.go(-1);
			}
			// 上面都没执行就说明卡在当前页不是最后一条， histroy记录数量大于1，又没有回退记录，只能返回首页，
			// 如果上面都执行了 页面都跳走了，这个也就不用管了
			// setTimeout(() => {
			// 	this.$router.push({ path: '/' });
			// }, 1000);
		}
	}
};
</script>

<style lang="less">
html,
body {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	overflow: hidden; // 避免页面出现双滚动条，滚动交给内部容器
	font-family: 'PFR';
	color: @grey;
}

#app {
	width: 100%;
	height: 100%;
}

/* 全站统一返回按钮：悬浮玻璃质感按钮 */
.fx67ll-backbtn {
	position: absolute;
	top: 20px;
	right: 24px;
	z-index: 9999;
	display: inline-flex;
	align-items: center;
	gap: 2px;
	height: 32px;
	padding: 2px 16px 0 14px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.82);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.4);
	box-shadow: 0 4px 14px rgba(66, 185, 131, 0.18);
	cursor: pointer;
	.ban-user-select();
	transition: all 0.25s ease;

	.fx67ll-backbtn-arrow {
		font-size: 22px;
		color: @green;
		line-height: 1;
		font-weight: bold;
		transition: transform 0.25s ease;
		position: relative;
		top: -1px;
	}

	.fx67ll-backbtn-text {
		font-size: 14px;
		color: @green;
		font-weight: bold;
		line-height: 1;
	}
}

.fx67ll-backbtn:hover {
	background: @green;
	border-color: @green;
	box-shadow: 0 6px 20px rgba(66, 185, 131, 0.4);
	transform: translateY(-1px);

	.fx67ll-backbtn-arrow {
		color: #ffffff;
		transform: translateX(-3px);
	}

	.fx67ll-backbtn-text {
		color: #ffffff;
	}
}

.fx67ll-backbtn:active {
	transform: translateY(0);
}

/* 返回按钮淡入出现 */
.backbtn-fade-enter-active {
	transition: all 0.4s ease;
}
.backbtn-fade-leave-active {
	transition: all 0.25s ease;
}
.backbtn-fade-enter,
.backbtn-fade-leave-to {
	opacity: 0;
	transform: translateX(20px);
}

/* ===== 路由切换随机过渡动画 ===== */

/* 淡入 */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.35s ease;
}
.fade-enter,
.fade-leave-to {
	opacity: 0;
}

/* 左滑 */
.slide-left-enter-active,
.slide-left-leave-active {
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter {
	opacity: 0;
	transform: translateX(40px);
}
.slide-left-leave-to {
	opacity: 0;
	transform: translateX(-40px);
}

/* 上滑 */
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter {
	opacity: 0;
	transform: translateY(40px);
}
.slide-up-leave-to {
	opacity: 0;
	transform: translateY(-40px);
}

/* 缩放 */
.zoom-enter-active,
.zoom-leave-active {
	transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.zoom-enter {
	opacity: 0;
	transform: scale(0.95);
}
.zoom-leave-to {
	opacity: 0;
	transform: scale(1.05);
}

/* 淡入缩放 */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-zoom-enter {
	opacity: 0;
	transform: scale(0.92);
}
.fade-zoom-leave-to {
	opacity: 0;
	transform: scale(1.03);
}
</style>
