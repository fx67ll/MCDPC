<template>
	<div class="fx67ll-box">
		<div class="fx67ll-title"><span @click="linktoFx67ll">fx67ll's 大数据可视化地图示例</span></div>
		<div class="fx67ll-link">
			<div class="fx67ll-link-item"><router-link tag="span" to="/mapcanvas">CanvasMap Tool Based on
					GaoDeMap</router-link></div>
			<div class="fx67ll-link-item"><router-link tag="span" to="/splitarea">SpliteArea Tool Based on
					GaoDeMap</router-link></div>
			<!-- <div class="fx67ll-link-item"><router-link tag="span" to="/hellothree">Threejs Hello World</router-link></div>
			<div class="fx67ll-link-item"><router-link tag="span" to="/testthree">Threejs Test For The Miku</router-link></div>
			<div class="fx67ll-link-item"><router-link tag="span" to="/testthree-FBX">Threejs Test For The FBX-Loader</router-link></div>
			<div class="fx67ll-link-item">
				<span><a target="_blank" href="https://www.yuque.com/docs/share/50146b98-8656-40b5-bbf9-c008bb31530f?# 《fx67llVueUI》">fx67llVueUI</a></span>
				<span>&nbsp; | | &nbsp;</span>
				<span><a target="_blank" href="https://www.yuque.com/docs/share/66ee9f75-5135-445f-a997-b476a5f342bf?# 《fx67llQuickEcharts》">fx67llQuickEcharts</a></span>
			</div>
			<div class="fx67ll-link-item">
				<span><a target="_blank" href="https://www.yuque.com/docs/share/50146b98-8656-40b5-bbf9-c008bb31530f?# 《fx67llVueUI》">fx67llVueUI</a></span>
			</div>
			<div class="fx67ll-link-item">
				<span><a target="_blank" href="https://www.yuque.com/docs/share/66ee9f75-5135-445f-a997-b476a5f342bf?# 《fx67llQuickEcharts》">fx67llQuickEcharts</a></span>
			</div> -->
			<div class="fx67ll-link-item"><router-link tag="span" to="/test">Code Mirror</router-link></div>
			<div class="fx67ll-link-item" v-show="isDev"><router-link tag="span" to="/devtest">Component Test
					Tool</router-link></div>
			<div class="fx67ll-link-item"><span class="fx67ll-devTip">持续开发更新中......</span></div>
		</div>
		<iframe class="fx67ll-background" src="https://test.fx67ll.com/fx67ll-background-collection/html/borealSky/borealSky.html" width="100%" height="100%" frameborder="0" scrolling="no"></iframe>
		<div class="fx67ll-footer">
			Designed & Powered by
			<a href="https://fx67ll.com" target="_blank">fx67ll</a>
			&#12288; Copyright© 2018-{{ this.year }}&#12288;
			<a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank">皖ICP备18017174号</a>
		</div>
	</div>
</template>

<script>
	import moment from 'moment';
	export default {
		name: 'fx67llIndex',
		data() {
			return {
				year: moment().format('YYYY')
			};
		},
		computed: {
			// 判断是否是开发环境，组件测试页面仅在开发环境开放
			isDev() {
				return process.env.VUE_APP_ENV === 'development';
			}
		},
		methods: {
			linktoFx67ll() {
				console.log(
					'####### #     #  #####  ####### #       #     \n#        #   #  #     # #    #  #       #       \n#         # #   #           #   #       #       \n#####      #    ######     #    #       #       \n#         # #   #     #   #     #       #\n#        #   #  #     #   #     #       #\n#       #     #  #####    #     ####### ####### '
				);
				window.open('https://fx67ll.xyz');
			}
		}
	};
</script>

<style lang="less" scoped="scoped">
	@textZindex: 2;
	@textColor: #ffff00;

	.fx67ll-box {
		width: 100%;
		height: 100%;
		.ban-user-select();

		.fx67ll-title {
			padding: 36px 20px 28px 20px;
			text-align: center;
			position: relative;
			z-index: @textZindex;
			color: @green;

			span {
				display: inline-block;
				font-size: 36px;
			}

			span:hover {
				color: @green;
			}
		}

		@linkMarginTop: 10px;
		@linkMarginBotton: 20px;

		.fx67ll-link {
			max-height: calc(~'100% - @{linkMarginTop} - @{linkMarginBotton} - 113px');
			overflow: auto;
			padding: 0 20px;
			margin: @linkMarginTop 0 @linkMarginBotton 0;
			position: relative;
			z-index: @textZindex;

			.fx67ll-link-item {
				width: 100%;
				margin-bottom: 25px;
				text-align: center;
				color: @textColor;

				span {
					display: inline-block;
					font-size: 24px;
				}

				span:hover {
					color: @green;
				}

				a {
					text-decoration: none;
					color: @textColor;
				}

				.fx67ll-devTip {
					// color: #ff5500;
					color: @red;
					font-size: 14px;
				}
			}
		}

		.fx67ll-background {
			position: absolute;
			top: 0;
			z-index: @textZindex - 1;
		}

		.fx67ll-footer {
			z-index: @textZindex;
		}

		@media screen and (max-width: 960px) {
			.fx67ll-footer {
				font-size: 12px;
			}
		}
	}
</style>