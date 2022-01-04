// 参考地址：https://blog.csdn.net/weixin_43703162/article/details/90482805
// 异步创建高德地图的script标签，appendChild方法在页面刷新之后会消失，所以可以实现需要的页面加载，不需要的页面不加载
export default function GDMapLoader(key) {
	return new Promise((resolve, reject) => {
		if (window.AMap) {
			resolve(window.AMap);
		} else {
			window._AMapSecurityConfig = {
				securityJsCode: '1bbf5900634af8099563f9b57d30235b', //仅作演示用所以不考虑安全问题
			}
			let script = document.createElement('script');
			script.src =
				`http://webapi.amap.com/maps?v=2.0&callback=initAMap&key=${key}
				&&plugin=AMap.Scale,AMap.HawkEye,AMap.ToolBar,AMap.ControlBar`;
			script.type = 'text/javascript';
			script.charset = 'utf-8';
			script.async = true;
			script.onerror = reject;
			document.head.appendChild(script);
		}
		window.initAMap = () => {
			resolve(window.AMap);
		}
	})
}
