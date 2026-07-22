<template>
	<div class="code-box">
		<codemirror ref="mycode" :value="curCode" :options="cmOptions" class="code-codemirror"></codemirror>
		<div class="code-btn" v-show="isDev" @click="getCode">
			<span class="code-btn-arrow">⎘</span>
			<span class="code-btn-text">获取转义代码</span>
		</div>

		<!-- 操作提示 toast -->
		<transition name="toast-fade">
			<div class="code-toast" :class="'toast-' + toast.type" v-if="toast.show">
				<span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
				<span class="toast-text">{{ toast.text }}</span>
			</div>
		</transition>
	</div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
// import 'codemirror/theme/idea.css'; // 这里引入的是主题样式，根据设置的theme的主题引入，一定要引入！！
import 'codemirror/theme/3024-day.css';
// require('codemirror/mode/javascript/javascript'); // 这里引入的模式的js，根据设置的mode引入，一定要引入！！
require('codemirror/mode/vue/vue');
export default {
	name: 'Test',
	components: {
		codemirror
	},
	data() {
		return {
			// curCode: MapCanvasCode,
			curCode: 'Powered By CodeMirror!\nhttps://codemirror.net\n\nThanks "Marijn Haverbeke" !!!\nhttps://github.com/marijnh',
			cmOptions: {
				value: '',
				// mode: 'text/javascript',
				mode: 'text/x-vue', // 这里的模式设置，请查看源码中mode下的index.html，那里有分发链接
				// theme: 'idea',
				theme: '3024-day',
				smartIndent: true, // 智能缩进
				lineNumbers: true,
				lineWrapping: true, // 代码过长换行而不是显示滚动条，默认是false显示滚动条
				lineWiseCopyCut: true,
				scrollbarStyle: null, // 隐藏滚动条，默认是native默认样式的滚动条
				readOnly: false
			},
			isShowBtn: false,
			// toast 提示状态
			toast: {
				show: false,
				type: 'success', // success | error
				text: ''
			},
			toastTimer: null
		};
	},
	computed: {
		// 判断是否是开发环境，以决定是否显示获取转义字符的按钮，不然每次都需要注释掉再发布简直反人类
		isDev() {
			return process.env.VUE_APP_ENV === 'development';
		}
	},
	beforeDestroy() {
		if (this.toastTimer) {
			clearTimeout(this.toastTimer);
		}
	},
	methods: {
		// 获取转义代码并复制到剪贴板，同时给出操作提示
		getCode() {
			var self = this;
			var content = self.$refs.mycode.content;
			if (!content || JSON.stringify(content).length <= 2) {
				self.showToast('error', '您还没输入测试代码~');
				return;
			}
			var escaped = JSON.stringify(content);
			// 同时在控制台打印一份，保留原行为
			console.log(escaped);
			self.copyToClipboard(escaped).then(function (ok) {
				if (ok) {
					self.showToast('success', '转义代码已复制到剪贴板');
				} else {
					// 复制失败时提示用户去控制台查看
					self.showToast('error', '复制失败，请查看控制台输出');
				}
			});
		},
		// 复制文本到剪贴板，优先用现代 API，降级 execCommand
		copyToClipboard(text) {
			return new Promise(function (resolve) {
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(text).then(function () {
						resolve(true);
					}).catch(function () {
						resolve(fallbackCopy(text));
					});
				} else {
					resolve(fallbackCopy(text));
				}
			});
		},
		// 显示 toast 提示，2.5 秒后自动消失
		showToast(type, text) {
			var self = this;
			if (self.toastTimer) {
				clearTimeout(self.toastTimer);
			}
			self.toast.type = type;
			self.toast.text = text;
			self.toast.show = true;
			self.toastTimer = setTimeout(function () {
				self.toast.show = false;
			}, 2500);
		}
	}
};

// 兼容性兜底复制方案
function fallbackCopy(text) {
	try {
		var textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.top = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		var ok = document.execCommand('copy');
		document.body.removeChild(textarea);
		return ok;
	} catch (e) {
		return false;
	}
}
</script>

<style lang="less" scoped="scoped">
/deep/ .CodeMirror {
	height: 100% !important;
	// background-color: transparent !important;
}

/* 获取转义代码按钮：与全站统一的玻璃质感胶囊按钮 */
.code-btn {
	position: absolute;
	top: 64px;
	right: 20px;
	z-index: 999;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	height: 35px;
	padding: 2px 12px 0 16px;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.82);
	-webkit-backdrop-filter: blur(10px);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(66, 185, 131, 0.4);
	box-shadow: 0 4px 14px rgba(66, 185, 131, 0.18);
	cursor: pointer;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	user-select: none;
	transition: all 0.25s ease;

	.code-btn-arrow {
		font-size: 16px;
		color: @green;
		line-height: 1;
	}

	.code-btn-text {
		font-size: 13px;
		color: @green;
		font-weight: bold;
		line-height: 1;
	}
}

.code-btn:hover {
	background: @green;
	border-color: @green;
	box-shadow: 0 6px 20px rgba(66, 185, 131, 0.4);
	transform: translateY(-1px);

	.code-btn-arrow,
	.code-btn-text {
		color: #ffffff;
	}
}

.code-btn:active {
	transform: translateY(0);
}

/* 操作提示 toast：玻璃质感，绿/红配色 */
.code-toast {
	position: absolute;
	top: 110px;
	right: 30px;
	z-index: 1000;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: 10px;
	backdrop-filter: blur(10px);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	.ban-user-select();

	.toast-icon {
		width: 18px;
		height: 18px;
		line-height: 18px;
		text-align: center;
		border-radius: 50%;
		font-size: 12px;
		font-weight: bold;
		color: #ffffff;
	}

	.toast-text {
		font-size: 13px;
		font-weight: bold;
	}

	&.toast-success {
		background: rgba(66, 185, 131, 0.92);
		border: 1px solid rgba(66, 185, 131, 0.6);

		.toast-icon {
			background: #ffffff;
			color: @green;
		}

		.toast-text {
			color: #ffffff;
		}
	}

	&.toast-error {
		background: rgba(239, 142, 129, 0.92);
		border: 1px solid rgba(239, 142, 129, 0.6);

		.toast-icon {
			background: #ffffff;
			color: @red;
		}

		.toast-text {
			color: #ffffff;
		}
	}
}

/* toast 进出场动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
	transition: all 0.3s ease;
}

.toast-fade-enter,
.toast-fade-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}
</style>
