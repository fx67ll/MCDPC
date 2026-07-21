<template>
	<div id="app">
		<router-view></router-view>
		<!-- 全站统一返回按钮：悬浮玻璃质感，hover 微动效 -->
		<div
			v-show="this.$store.state.isShowbckbtn"
			class="fx67ll-backbtn"
			@click="back"
			title="返回"
		>
			<span class="fx67ll-backbtn-arrow">‹</span>
			<span class="fx67ll-backbtn-text">返回</span>
		</div>
	</div>
</template>

<script>
import vueCanvasNest from 'vue-canvas-nest';

export default {
	name: 'app',
	components: {
		vueCanvasNest
	},
	data() {
		return {
			// nestConfig: {
			// 	color: 'rgb(186, 186, 186)', // the canvas line color, default: '255,0,0'; the color is (R,G,B)
			// 	opacity: 0.7, // the opacity of line (0~1), default: 0.7
			// 	count: 33, // the number of lines, default: 99
			// 	zIndex: -1 // the index of z space, default: -1
			// },
			// isLoadingCompleted: false
		};
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
	height: 36px;
	padding: 0 16px 0 8px;
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
</style>
