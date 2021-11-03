<template>
	<div class="fx67ll-box">
		<div class="fx67ll-clock"></div>
	</div>
</template>

<script>
	import FlipClock from 'flipclock';
	import 'flipclock/dist/flipclock.css';
	export default {
		name: 'fx67llIndex',
		data() {
			return {};
		},
		mounted() {
			this.initClock();
		},
		methods: {
			initClock() {
				const el = document.querySelector('.fx67ll-clock');
				const clock = new FlipClock(el, new Date('2021/12/31 24:00:00'), {
					face: 'DayCounter', // 类型  
					showSeconds: true, // 显示秒数  
					showLabels: true, // 显示文字标识  
					// language: 'jp', // 文字标识语言  
					language: {
						'years': '年',
						'months': '月',
						'days': '预计上线日',
						'hours': '時',
						'minutes': '分',
						'seconds': '秒'
					},  
					// autoStart: false, // 是否自动开始计时，默认是true  
					// showSeconds: false, // 是否显示秒数，默认是true  
					// stopAt: 10,  // 多少秒后停止，不能是倒计时模式  
					countdown: true, // true为倒计时
				});
				// 切换主题
				// setTimeout(function() {
				// 	clock.face = 'Counter';
				// }, 3000);
				// 监听开始
				// clock.on('start', () => {
				// 	console.log("时钟开始运行");
				// });
				// 监听结束
				// clock.on('stop', function() {
				// 	console.log("时钟停止运行");
				// });
			}
		}
	};
</script>
<style type="text/css">
	.flip-clock {
		width: auto;
		font-size: 2vw;
		left: 10vw;
	}
</style>
<style lang="less" scoped="scoped">
	.fx67ll-box {
		width: 100%;
		height: 100%;
		.ban-user-select();

		.fx67ll-clock {
			position: relative;
			top: 50%;
			margin-top: -10vw;
		}
	}
</style>
