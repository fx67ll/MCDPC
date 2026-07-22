<template>
	<div class="code-box">
		<codemirror ref="mycode" :value="curCode" :options="cmOptions" class="code-codemirror"></codemirror>
	</div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/theme/3024-day.css';
require('codemirror/mode/vue/vue');
import { getCode } from '@a/file/code/index.js';

export default {
	name: 'CodeMirror',
	components: {
		codemirror
	},
	data() {
		return {
			curCode: '// 暂无源码，请通过组件的「查看源码」按钮进入',
			cmOptions: {
				value: '',
				mode: 'text/x-vue',
				theme: '3024-day',
				smartIndent: true,
				lineNumbers: true,
				lineWrapping: true,
				lineWiseCopyCut: true,
				scrollbarStyle: null,
				readOnly: true // 源码查看页只读
			}
		};
	},
	mounted() {
		this.initData();
	},
	methods: {
		initData() {
			var code = this.$route.query.code;
			var src = getCode(code);
			if (src) {
				this.curCode = src;
			}
		}
	}
};
</script>

<style lang="less" scoped="scoped">
/deep/ .CodeMirror {
	height: 100% !important;
}
</style>
