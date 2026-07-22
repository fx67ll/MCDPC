<template>
	<div class="fx67ll-box">
		<div class="fx67ll-header">
			<div class="fx67ll-title"><span @click="linktoFx67ll">fx67ll's AI 大数据地图服务 Demo 合集</span></div>
			<div class="fx67ll-subtitle">基于高德地图 JS API 2.0 · AI 驱动的可视化示例</div>
		</div>

		<div class="fx67ll-link">
			<!-- 地图 Demo 卡片 -->
			<div class="card-grid">
				<div class="demo-card" v-for="(item, index) in mapDemos" :key="'map' + index"
					@click="goRoute(item.path)">
					<div class="card-icon" :style="{ background: item.bg }">
						<span class="icon-emoji">{{ item.icon }}</span>
					</div>
					<div class="card-body">
						<div class="card-title">{{ item.title }}</div>
						<div class="card-desc">{{ item.desc }}</div>
						<div class="card-tags">
							<span class="card-tag" v-for="(t, i) in item.tags" :key="i">{{ t }}</span>
						</div>
					</div>
					<div class="card-arrow">›</div>
				</div>
			</div>

			<!-- AI 外链卡片 -->
			<div class="card-grid">
				<a class="demo-card external" v-for="(item, index) in aiDemos" :key="'ai' + index" :href="item.path"
					target="_blank" rel="noopener">
					<div class="card-icon" :style="{ background: item.bg }">
						<span class="icon-emoji">{{ item.icon }}</span>
					</div>
					<div class="card-body">
						<div class="card-title">{{ item.title }}</div>
						<div class="card-desc">{{ item.desc }}</div>
						<div class="card-tags">
							<span class="card-tag tag-ai" v-for="(t, i) in item.tags" :key="i">{{ t }}</span>
						</div>
					</div>
					<div class="card-arrow">↗</div>
				</a>
			</div>

			<!-- 工具卡片（仅开发环境显示，build 发布后不展示） -->
			<div class="card-grid" v-show="isDev">
				<div class="demo-card tool" v-for="(item, index) in toolDemos" :key="'tool' + index"
					@click="goRoute(item.path)">
					<div class="card-icon" :style="{ background: item.bg }">
						<span class="icon-emoji">{{ item.icon }}</span>
					</div>
					<div class="card-body">
						<div class="card-title">{{ item.title }}</div>
						<div class="card-desc">{{ item.desc }}</div>
					</div>
					<div class="card-arrow">›</div>
				</div>
			</div>

			<!-- <div class="fx67ll-link-item"><span class="fx67ll-devTip">持续开发更新中......</span></div> -->
		</div>

		<iframe class="fx67ll-background"
			src="https://test.fx67ll.com/fx67ll-background-collection/html/borealSky/borealSky.html" width="100%"
			height="100%" frameborder="0" scrolling="no"></iframe>
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
			year: moment().format('YYYY'),
			// 高德地图 Demo 卡片
			mapDemos: [
				{
					path: '/mapcanvas',
					icon: '✏️',
					title: 'CanvasMap',
					desc: '自定义 Canvas 绘图工具，支持渐变线条与闭合区域填充',
					tags: ['2D', 'Canvas'],
					bg: 'linear-gradient(135deg, #667eea, #764ba2)'
				},
				{
					path: '/splitarea',
					icon: '🗂️',
					title: 'SplitArea',
					desc: '行政区划逐级下钻，全国→省→市→区县，支持模式切换',
					tags: ['2D', '行政区'],
					bg: 'linear-gradient(135deg, #42b983, #2c8c63)'
				},
				{
					path: '/heatmap',
					icon: '🔥',
					title: 'HeatMapPoint',
					desc: '24 小时动态热力图，时间轴播放 + 强度调节',
					tags: ['2D', '热力图'],
					bg: 'linear-gradient(135deg, #f12711, #f5af19)'
				},
				{
					path: '/flyline3d',
					icon: '✈️',
					title: 'FlyLine2D',
					desc: '2D 贝塞尔关联飞线，实时光点流动可视化',
					tags: ['2D', '飞线'],
					bg: 'linear-gradient(135deg, #0091ea, #42b983)'
				},
				{
					path: '/glowwall3d',
					icon: '🛡️',
					title: 'GlowWall3D',
					desc: '3D 立体光墙 + 雷达扫描 + 告警点位安防态势',
					tags: ['3D', 'Loca'],
					bg: 'linear-gradient(135deg, #0d1117, #42b983)'
				}
			],
			// AI 外链卡片
			aiDemos: [
				{
					path: 'https://ai.fx67ll.com/national-day-self-driving-plan',
					icon: '🚗',
					title: 'National Day Self Driving',
					desc: 'AI 驱动的国庆自驾行程规划',
					tags: ['AI', '行程规划'],
					bg: 'linear-gradient(135deg, #ef8e81, #f5af19)'
				},
				{
					path: 'https://ai.fx67ll.com/map-lushu/2025-12/yuan-dan-hot-spring-ski-plan/',
					icon: '⛷️',
					title: 'YuanDan Hot Spring Ski',
					desc: 'AI 生成的元旦温泉滑雪出行方案',
					tags: ['AI', '出行方案'],
					bg: 'linear-gradient(135deg, #a8edea, #43cea2)'
				}
			],
			// 工具卡片
			toolDemos: [
				{
					path: '/test',
					icon: '💻',
					title: 'Code Mirror',
					desc: '在线代码编辑预览工具',
					bg: 'linear-gradient(135deg, #614385, #516395)'
				}
			]
		};
	},
	computed: {
		// 判断是否是开发环境，组件测试页面仅在开发环境开放
		isDev() {
			return process.env.VUE_APP_ENV === 'development';
		}
	},
	methods: {
		goRoute(path) {
			this.$router.push(path);
		},
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
	display: flex;
	flex-direction: column;
	overflow: hidden;
	.ban-user-select();

	.fx67ll-header {
		flex-shrink: 0;
		padding: 40px 20px 20px 20px;
		text-align: center;
		position: relative;
		z-index: @textZindex;

		.fx67ll-title {
			span {
				display: inline-block;
				font-size: 36px;
				color: @green;
				text-shadow: 0 2px 18px rgba(66, 185, 131, 0.4);
				cursor: pointer;
				transition: all 0.3s ease;
			}

			span:hover {
				color: #ffffff;
				text-shadow: 0 2px 24px rgba(66, 185, 131, 0.7);
				transform: translateY(-2px);
			}
		}

		.fx67ll-subtitle {
			margin-top: 10px;
			font-size: 14px;
			color: rgba(255, 255, 255, 0.75);
			letter-spacing: 1px;
		}
	}

	.fx67ll-link {
		flex: 1;
		min-height: 0; // flex 子项允许收缩到内容以下，从而内部滚动生效
		overflow-y: auto;
		overflow-x: hidden;
		padding: 10px 24px 0 24px;
		position: relative;
		z-index: @textZindex;

		// 卡片网格
		.card-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
			gap: 16px;
			margin-bottom: 24px;
			max-width: 1080px;
			margin-left: auto;
			margin-right: auto;
		}

		.demo-card {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 16px 18px;
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(12px);
			border: 1px solid rgba(255, 255, 255, 0.15);
			border-radius: 14px;
			cursor: pointer;
			text-decoration: none;
			color: #ffffff;
			transition: all 0.3s ease;
			position: relative;
			overflow: hidden;

			// 悬浮高光层
			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.12), transparent);
				transition: left 0.6s ease;
			}

			&:hover {
				background: rgba(255, 255, 255, 0.18);
				border-color: rgba(66, 185, 131, 0.6);
				transform: translateY(-4px);
				box-shadow: 0 10px 30px rgba(66, 185, 131, 0.25);

				&::before {
					left: 100%;
				}

				.card-arrow {
					color: @green;
					transform: translateX(4px);
				}
			}

			.card-icon {
				flex-shrink: 0;
				width: 48px;
				height: 48px;
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

				.icon-emoji {
					font-size: 24px;
					line-height: 1;
				}
			}

			.card-body {
				flex: 1;
				min-width: 0;

				.card-title {
					font-size: 16px;
					font-weight: bold;
					color: #ffffff;
					margin-bottom: 4px;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.card-desc {
					font-size: 12px;
					color: rgba(255, 255, 255, 0.7);
					line-height: 1.5;
					margin-bottom: 8px;
					display: -webkit-box;
					line-clamp: 2;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}

				.card-tags {
					display: flex;
					gap: 6px;
					flex-wrap: wrap;

					.card-tag {
						font-size: 11px;
						padding: 2px 8px;
						border-radius: 8px;
						background: rgba(66, 185, 131, 0.2);
						color: @green;
						border: 1px solid rgba(66, 185, 131, 0.3);
						line-height: 16px;
					}

					.card-tag.tag-ai {
						background: rgba(239, 142, 129, 0.2);
						color: #ffb3a8;
						border-color: rgba(239, 142, 129, 0.3);
					}
				}
			}

			.card-arrow {
				flex-shrink: 0;
				font-size: 22px;
				color: rgba(255, 255, 255, 0.5);
				transition: all 0.3s ease;
			}
		}

		// 外链卡片轻微区分
		.demo-card.external {
			border-style: dashed;
		}

		.fx67ll-link-item {
			width: 100%;
			text-align: center;
			margin: 16px 0;

			.fx67ll-devTip {
				color: @red;
				font-size: 14px;
			}
		}
	}

	.fx67ll-link::-webkit-scrollbar {
		width: 6px;
	}

	.fx67ll-link::-webkit-scrollbar-thumb {
		background: rgba(66, 185, 131, 0.4);
		border-radius: 3px;
	}

	.fx67ll-background {
		position: absolute;
		top: 0;
		z-index: @textZindex - 1;
	}

	.fx67ll-footer {
		position: relative; // 覆盖全局 absolute，进入 flex 流自然贴底，不被卡片遮挡
		flex-shrink: 0;
		z-index: @textZindex;
	}

	@media screen and (max-width: 960px) {
		.fx67ll-footer {
			font-size: 12px;
			padding: 12px 0;
		}

		.fx67ll-header {
			padding: 24px 16px 14px 16px;

			.fx67ll-title span {
				font-size: 24px;
			}

			.fx67ll-subtitle {
				font-size: 12px;
			}
		}

		.fx67ll-link {
			padding: 0 14px;
		}
	}
}
</style>
