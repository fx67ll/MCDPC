<template>
	<div class="doc-box">
		<div class="doc-title">{{ docData.description }}</div>
		<div class="doc-section" v-if="docData.Attributes.length > 0">
			<div class="section-title">属性 Attributes</div>
			<el-table :data="docData.Attributes" border class="doc-table">
				<el-table-column prop="param" label="参数"></el-table-column>
				<el-table-column prop="descrbition" label="说明"></el-table-column>
				<el-table-column prop="type" label="类型"></el-table-column>
				<el-table-column prop="chooseValue" label="可选值"></el-table-column>
				<el-table-column prop="defaultValue" label="默认值"></el-table-column>
			</el-table>
		</div>
		<div class="doc-section" v-if="docData.Methods.length > 0">
			<div class="section-title">方法 Methods</div>
			<el-table :data="docData.Methods" border class="doc-table">
				<el-table-column prop="methods" label="方法名"></el-table-column>
				<el-table-column prop="descrbition" label="说明"></el-table-column>
				<el-table-column prop="methods2" label="参数"></el-table-column>
			</el-table>
		</div>
		<div class="doc-section" v-if="docData.Events.length > 0">
			<div class="section-title">事件 Events</div>
			<el-table :data="docData.Events" border class="doc-table">
				<el-table-column prop="events" label="事件名"></el-table-column>
				<el-table-column prop="descrbition" label="说明"></el-table-column>
				<el-table-column prop="events2" label="参数"></el-table-column>
			</el-table>
		</div>
		<div class="doc-section" v-if="docData.Slot.length > 0">
			<div class="section-title">插槽 Slot</div>
			<el-table :data="docData.Slot" border class="doc-table">
				<el-table-column prop="slot" label="插槽名"></el-table-column>
				<el-table-column prop="descrbition" label="说明"></el-table-column>
			</el-table>
		</div>
	</div>
</template>

<script>
import { getDoc } from '@a/file/doc/index.js';
export default {
	name: 'codedoc',
	data() {
		return {
			docData: null
		};
	},
	mounted() {
		this.initData();
	},
	methods: {
		initData() {
			this.docData = getDoc(this.$route.query.code);
		}
	}
};
</script>

<style lang="less" scoped="scoped">
.doc-box {
	width: 100%;
	max-width: 1280px;
	height: 100%;
	margin: 0 auto;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 20px 24px 60px 24px;
	box-sizing: border-box;

	.doc-title {
		width: 100%;
		min-height: 60px;
		line-height: 60px;
		text-align: center;
		font-size: 24px;
		color: #2c3e50;
		margin-bottom: 20px;
		.ban-user-select();
	}

	.doc-section {
		margin-bottom: 24px;

		.section-title {
			font-size: 15px;
			font-weight: bold;
			color: @green;
			margin-bottom: 10px;
			padding-left: 8px;
			border-left: 3px solid @green;
		}
	}

	.doc-table {
		width: 100%;
	}

	/deep/ .el-table {
		table-layout: auto;
		.el-table__cell {
			.cell {
				word-break: break-all;
				white-space: normal;
			}
		}
	}
}

.doc-box::-webkit-scrollbar {
	width: 6px;
}
.doc-box::-webkit-scrollbar-thumb {
	background: rgba(66, 185, 131, 0.4);
	border-radius: 3px;
}

@media screen and (max-width: 960px) {
	.doc-box {
		.doc-title {
			font-size: 18px;
		}
		padding: 16px 14px 30px 14px;
	}
}
</style>
