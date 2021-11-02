// 参考地址：https://blog.csdn.net/weixin_43703162/article/details/90482805
export default function MapLoader(key) {
	return new Promise((resolve, reject) => {
		if (window.AMap) {
			resolve(window.AMap)
		} else {
			var script = document.createElement('script')
			script.type = 'text/javascript'
			script.async = true
			script.src = 'http://webapi.amap.com/maps?v=1.3&callback=initAMap&key=' + key
			script.onerror = reject
			document.head.appendChild(script)
		}
		window.initAMap = () => {
			resolve(window.AMap)
		}
	})
}
