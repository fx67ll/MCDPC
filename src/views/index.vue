<template>
	<div id="map-container" class="fx67ll-box"></div>
</template>

<script>
import GDMapLoader from '@u/GDMapLoader.js';
export default {
	name: 'fx67llIndex',
	data() {
		return {
			GDMap: null,
			GDMapKey: '06861bd40c54f88bbac136a8b2a1f307', //仅作演示用所以不考虑安全问题
			GDMapStyle: '0a2873aa35b80c00c917252d0d4fd260'
		};
	},
	mounted() {
		this.initMap();
	},
	methods: {
		// 初始化地图服务
		initMap() {
			let self = this;
			GDMapLoader(this.GDMapKey).then(
				AMap => {
					self.map = new AMap.Map('map-container', {
						center: [118.796624, 32.059344], //南京市
						zoom: 12.5, //放大级别
						// pitch: 50, //俯仰角度
						viewMode: '3D', //开启3D模式
						mapStyle: `amap://styles/${self.GDMapStyle}` //自定义样式
					});
					let scale = new AMap.Scale({
						visible: true
					});
					let toolBar = new AMap.ToolBar({
						visible: true,
						position: {
							bottom: '30px',
							right: '40px'
						}
					});
					let controlBar = new AMap.ControlBar({
						visible: true,
						position: {
							bottom: '110px',
							right: '10px'
						}
					});
					self.map.addControl(scale);
					self.map.addControl(toolBar);
					self.map.addControl(controlBar);
				},
				e => {
					console.error('地图加载失败', e);
				}
			);
		}
	}
};
</script>

<style lang="less" scoped="scoped">
.fx67ll-box {
	width: 100%;
	height: 100%;
	.ban-user-select();
}
</style>
