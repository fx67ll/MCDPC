<!-- @name: SplitArea -->
<!-- @author: fx67ll -->
<!-- @version: 2.1.0-->
<!-- @description：基于高德地图 JS API 2.0 的行政区划逐级下钻工具，全国→省→市→区县，懒加载 AMap.DistrictSearch 插件。-->
<!-- @update: 升级 JS API 2.0 + AMapLoader 按需加载，修复进入无数据问题，统一返回按钮与样式-->

<template>
	<div class="splitarea">
		<!-- 面包屑导航 -->
		<div class="crumb-box">
			<div class="crumb-title">
				<span class="crumb-label">行政区划下钻</span>
				<span class="crumb-level" v-if="currentLevelName">{{ levelText }}</span>
			</div>
			<div class="crumb-list">
				<span class="crumb-item" :class="{ 'is-last': index === crumbList.length - 1 }"
					v-for="(item, index) in crumbList" :key="index" @click="drillUp(index)">
					<span class="crumb-name">{{ item.name }}</span>
					<span class="crumb-sep" v-if="index < crumbList.length - 1">/</span>
				</span>
			</div>
		</div>

		<!-- 模式开关：全国通用 / 个人私用 -->
		<div class="mode-box">
			<span class="mode-label">显示模式</span>
			<div class="mode-switch">
				<span class="mode-option" :class="{ active: mode === 'lite' }" @click="switchMode('lite')">个人私用</span>
				<span class="mode-option" :class="{ active: mode === 'full' }" @click="switchMode('full')">全国通用</span>
			</div>
		</div>

		<!-- 加载提示 -->
		<div class="loading-tip" v-show="isLoading">
			<div class="loading-dot"></div>
			<div class="loading-dot"></div>
			<div class="loading-dot"></div>
			<span class="loading-text">{{ loadingText }}</span>
		</div>

		<!-- 错误提示 -->
		<div class="error-tip" v-show="errorMsg">
			<span>{{ errorMsg }}</span>
			<span class="error-retry" @click="retry">重试</span>
		</div>

		<!-- 当前层级信息卡 -->
		<div class="info-card" v-show="hoverInfo.name">
			<div class="info-name">{{ hoverInfo.name }}</div>
			<div class="info-row" v-if="hoverInfo.level">
				<span class="info-key">层级</span>
				<span class="info-val">{{ hoverInfo.level }}</span>
			</div>
			<div class="info-row" v-if="hoverInfo.adcode">
				<span class="info-key">编码</span>
				<span class="info-val">{{ hoverInfo.adcode }}</span>
			</div>
			<div class="info-tip" v-if="hoverInfo.canDrill">点击下钻至下级行政区</div>
			<div class="info-tip info-tip-end" v-else>已是最底层行政区</div>
		</div>

		<div id="splitarea-container" ref="map"></div>
	</div>
</template>

<script>
import { loadAMap } from '@/utils/amapLoader.js';

// 视觉中心（南京）
const NANJING_CENTER = [118.7969, 32.0603];
// 初始缩放级别，覆盖安徽+江苏
const INIT_ZOOM = 7;

// ===== 个人私用模式配置（全国通用模式不受此限制）=====
// 初始优先展示的省份（仅安徽、江苏，避免一次拉取全国导致卡顿）
const PRIORITY_PROVINCES = [
	{ name: '江苏省', adcode: '320000', level: 'province' },
	{ name: '安徽省', adcode: '340000', level: 'province' }
];
// 精简模式：某省下钻时仅查询/展示的市（名称+adcode），未配置则查询该省全部市
// 用 adcode 直接查询单个市，避免请求整个省的所有市数据
const LITE_PROVINCE_CITIES = {
	'320000': [{ name: '南京市', adcode: '320100' }], // 江苏只查南京
	'340000': [{ name: '马鞍山市', adcode: '340500' }] // 安徽只查马鞍山
};

export default {
	name: 'SplitArea',
	data() {
		return {
			AMap: null,
			map: null,
			polygons: [],
			isLoading: false,
			loadingText: '正在加载行政区划数据...',
			errorMsg: '',
			// 显示模式：lite 个人私用（仅安徽+江苏+南京+马鞍山），full 全国通用（节流查全国省市区）
			mode: 'lite',
			// 已加载省份 adcode 集合，避免拖动时重复请求
			loadedProvinceCodes: {},
			// 是否处于「全国概览」层级（拖动懒加载其他省份的判断依据）
			isOverviewLevel: true,
			// 懒加载版本号，每次重绘时自增，过期回调不再绘制
			loadToken: 0,
			crumbList: [
				{ name: '全国', adcode: '100000', level: 'country' }
			],
			hoverInfo: {}
		};
	},
	computed: {
		// 是否个人私用模式
		isLiteMode() {
			return this.mode === 'lite';
		},
		currentLevelName() {
			if (this.crumbList.length === 0) return '';
			return this.crumbList[this.crumbList.length - 1].name;
		},
		levelText() {
			var len = this.crumbList.length;
			if (len <= 1) return '· 省级行政区';
			if (len === 2) return '· 市级行政区';
			if (len === 3) return '· 区县级行政区';
			return '';
		}
	},
	mounted() {
		this.mapInit();
	},
	beforeDestroy() {
		this.loadToken++; // 使进行中的异步回调失效
		if (this.map) {
			this.map.destroy();
			this.map = null;
		}
	},
	methods: {
		mapInit() {
			var self = this;
			self.isLoading = true;
			self.loadingText = '正在加载地图...';
			// 按需加载 DistrictSearch 插件
			loadAMap(['AMap.DistrictSearch']).then(function (AMap) {
				self.AMap = AMap;
				self.map = new AMap.Map('splitarea-container', {
					center: NANJING_CENTER,
					zoom: INIT_ZOOM,
					mapStyle: 'amap://styles/whitesmoke'
				});
				self.map.setLimitBounds(new AMap.Bounds([72, 0], [138, 56]));

				self.map.on('mousemove', function () {
					if (self.hoverInfo.name) {
						self.hoverInfo = {};
					}
				});

				// 地图拖动结束后，若仍在「全国概览」层级且视口中心不在江浙沪，则懒加载该省份
				self.map.on('moveend', function () {
					self.lazyLoadProvinceByViewport();
				});

				self.isLoading = false;
				// 按当前模式加载初始区域
				self.loadInitial();
			}).catch(function (err) {
				self.isLoading = false;
				self.errorMsg = '地图加载失败：' + (err && err.message ? err.message : '请检查网络');
			});
		},
		// 按当前模式加载初始区域
		loadInitial() {
			var self = this;
			if (self.isLiteMode) {
				self.drawPriorityProvinces();
			} else {
				self.loadAllProvinces();
			}
		},
		// 切换显示模式
		switchMode(mode) {
			var self = this;
			if (self.mode === mode) return;
			self.mode = mode;
			// 重置面包屑到全国概览
			self.crumbList = [{ name: '全国', adcode: '100000', level: 'country' }];
			self.hoverInfo = {};
			// 重新加载初始区域
			if (self.map) {
				self.loadInitial();
			}
		},
		// 全国通用模式：节流加载全国所有省份边界
		loadAllProvinces() {
			var self = this;
			self.isLoading = true;
			self.loadingText = '正在加载全国省级行政区...';
			self.isOverviewLevel = true;
			self.loadToken++;
			var myToken = self.loadToken;
			self.map.remove(self.polygons);
			self.polygons = [];
			self.loadedProvinceCodes = {};

			// 先查全国，拿到所有省的 adcode 列表
			var countrySearch = new self.AMap.DistrictSearch({
				showbiz: false,
				level: 'country',
				extensions: 'all',
				subdistrict: 1
			});
			countrySearch.search('中华人民共和国', function (status, result) {
				if (myToken !== self.loadToken || !self.map) return;
				if (status !== 'complete' || !result || !result.districtList || !result.districtList[0]) {
					self.isLoading = false;
					self.errorMsg = '未获取到全国行政区划数据';
					return;
				}
				var provinces = result.districtList[0].districtList || [];
				// 分组节流逐个查各省自身边界（subdistrict:0）
				function fetchOne(prov, done) {
					var fetcher = new self.AMap.DistrictSearch({
						showbiz: false,
						level: 'province',
						extensions: 'all',
						subdistrict: 0
					});
					fetcher.search(prov.adcode, function (s, r) {
						if (myToken !== self.loadToken || !self.map) { done(); return; }
						if (s === 'complete' && r && r.districtList && r.districtList.length > 0) {
							var info = r.districtList[0];
							var bounds = info.boundaries;
							if (bounds && bounds.length > 0) {
								var areaInfo = { name: prov.name, adcode: prov.adcode, level: 'province' };
								for (var j = 0; j < bounds.length; j++) {
									self.createPolygon(bounds[j], areaInfo, true);
								}
							}
							self.loadedProvinceCodes[prov.adcode] = true;
						}
						done();
					});
				}
				self.runGrouped(provinces, fetchOne, myToken, function () {
					if (myToken === self.loadToken) self.isLoading = false;
				});
			});
		},
		// 初始加载优先省份（分组并发：每组 3 个，组间间隔 1.23 秒，规避高德并发限制）
		drawPriorityProvinces() {
			var self = this;
			self.isLoading = true;
			self.loadingText = '正在加载行政区划...';
			self.isOverviewLevel = true;
			// 版本号自增，使进行中的懒加载回调失效
			self.loadToken++;
			var myToken = self.loadToken;
			// 清除已有绘制
			self.map.remove(self.polygons);
			self.polygons = [];
			self.loadedProvinceCodes = {};

			// 查询单个省并绘制
			function fetchOne(prov, done) {
				var fetcher = new self.AMap.DistrictSearch({
					showbiz: false,
					level: 'province',
					extensions: 'all',
					subdistrict: 0
				});
				fetcher.search(prov.adcode, function (status, result) {
					if (myToken !== self.loadToken || !self.map) { done(); return; }
					if (status === 'complete' && result && result.districtList && result.districtList.length > 0) {
						var info = result.districtList[0];
						var bounds = info.boundaries;
						if (bounds && bounds.length > 0) {
							var areaInfo = { name: prov.name, adcode: prov.adcode, level: 'province' };
							for (var j = 0; j < bounds.length; j++) {
								self.createPolygon(bounds[j], areaInfo, true);
							}
						}
						self.loadedProvinceCodes[prov.adcode] = true;
					}
					done();
				});
			}
			// 分组节流：每组 GROUP_SIZE 个并发，组间间隔 GROUP_INTERVAL 毫秒
			self.runGrouped(PRIORITY_PROVINCES, fetchOne, myToken, function () {
				if (myToken === self.loadToken) self.isLoading = false;
			});
		},
		// 通用分组节流执行器：每组 GROUP_SIZE 个并发，一组全部回调返回后，间隔 GROUP_INTERVAL 毫秒再执行下一组
		// token 用于在层级切换/组件销毁时中断后续分组
		runGrouped(items, taskFn, token, onAllDone) {
			var self = this;
			var GROUP_SIZE = 3; // 每组并发数（高德并发限制 3）
			var GROUP_INTERVAL = 1230; // 组间间隔 1.23 秒
			var index = 0;
			function runNextGroup() {
				if (token !== self.loadToken || !self.map) { return; }
				if (index >= items.length) {
					if (onAllDone) onAllDone();
					return;
				}
				var group = items.slice(index, index + GROUP_SIZE);
				index += group.length;
				var remaining = group.length;
				group.forEach(function (item) {
					taskFn(item, function () {
						remaining--;
						if (remaining === 0) {
							// 本组全部完成，间隔后执行下一组
							if (token !== self.loadToken || !self.map) return;
							setTimeout(runNextGroup, GROUP_INTERVAL);
						}
					});
				});
			}
			runNextGroup();
		},
		// 拖动结束后，若视口中心落在未加载的省份，则懒加载该省
		lazyLoadProvinceByViewport() {
			var self = this;
			// 仅在全国概览层级才懒加载，下钻到省/市/区县时不触发
			if (!self.isOverviewLevel) return;
			// 个人私用模式：彻底筛选，拖到全国其他省市也不加载，只认安徽+江苏
			if (self.isLiteMode) return;
			var center = self.map.getCenter();
			var lng = center.getLng();
			var lat = center.getLat();
			// 已加载的省不再重复请求
			var target = self.guessProvinceByLocation(lng, lat);
			if (!target || self.loadedProvinceCodes[target.adcode]) return;
			self.loadSingleProvince(target);
		},
		// 根据经纬度粗略推断所在省份（覆盖全国，仅作懒加载触发依据，不要求精确）
		guessProvinceByLocation(lng, lat) {
			if (lat >= 35 && lng >= 114 && lng <= 123) return { name: '山东省', adcode: '370000' };
			if (lat >= 33 && lat < 35 && lng >= 114 && lng <= 120) return { name: '安徽省', adcode: '340000' };
			if (lat >= 24 && lat < 28 && lng >= 112 && lng < 118) return { name: '江西省', adcode: '360000' };
			if (lat >= 20 && lat < 28 && lng >= 105 && lng < 112) return { name: '福建省', adcode: '350000' };
			if (lat >= 28 && lat < 33 && lng >= 108 && lng < 114) return { name: '湖北省', adcode: '420000' };
			if (lat >= 24 && lat < 28 && lng >= 108 && lng < 112) return { name: '湖南省', adcode: '430000' };
			if (lat >= 28 && lat < 35 && lng >= 104 && lng < 108) return { name: '重庆市', adcode: '500000' };
			if (lat >= 28 && lat < 34 && lng >= 100 && lng < 104) return { name: '四川省', adcode: '510000' };
			if (lat >= 35 && lat < 43 && lng >= 100 && lng < 110) return { name: '陕西省', adcode: '610000' };
			if (lat >= 35 && lat < 43 && lng >= 110 && lng < 120) return { name: '山西省', adcode: '140000' };
			if (lat >= 35 && lat < 43 && lng >= 114 && lng < 119) return { name: '河北省', adcode: '130000' };
			if (lat >= 39 && lng >= 115 && lng < 120) return { name: '北京市', adcode: '110000' };
			if (lat >= 38 && lng >= 116 && lng < 120) return { name: '天津市', adcode: '120000' };
			if (lat >= 43 && lng >= 118 && lng < 126) return { name: '内蒙古自治区', adcode: '150000' };
			if (lat >= 40 && lng >= 120 && lng < 130) return { name: '辽宁省', adcode: '210000' };
			if (lat >= 40 && lng >= 126 && lng < 131) return { name: '吉林省', adcode: '220000' };
			if (lat >= 43 && lng >= 122 && lng < 136) return { name: '黑龙江省', adcode: '230000' };
			if (lat >= 20 && lng >= 108 && lng < 112) return { name: '广西壮族自治区', adcode: '450000' };
			if (lat >= 20 && lng >= 105 && lng < 108) return { name: '广东省', adcode: '440000' };
			if (lat >= 18 && lng >= 108 && lng < 111) return { name: '海南省', adcode: '460000' };
			if (lat >= 20 && lat < 30 && lng >= 97 && lng < 106) return { name: '云南省', adcode: '530000' };
			if (lat >= 24 && lng >= 103 && lng < 109) return { name: '贵州省', adcode: '520000' };
			if (lat >= 35 && lat < 42 && lng >= 92 && lng < 100) return { name: '青海省', adcode: '630000' };
			if (lat >= 37 && lat < 43 && lng >= 104 && lng < 108) return { name: '宁夏回族自治区', adcode: '640000' };
			if (lat >= 42 && lng >= 73 && lng < 96) return { name: '新疆维吾尔自治区', adcode: '650000' };
			if (lat >= 28 && lng >= 78 && lng < 100) return { name: '西藏自治区', adcode: '540000' };
			if (lat >= 35 && lng >= 73 && lng < 96) return { name: '甘肃省', adcode: '620000' };
			return null;
		},
		// 加载单个省份边界并叠加到当前图层（不清除已有）
		loadSingleProvince(prov) {
			var self = this;
			self.loadingText = '正在加载「' + prov.name + '」...';
			self.isLoading = true;
			var myToken = self.loadToken; // 记录当前版本，重绘后过期
			var fetcher = new self.AMap.DistrictSearch({
				showbiz: false,
				level: 'province',
				extensions: 'all',
				subdistrict: 0
			});
			fetcher.search(prov.adcode, function (status, result) {
				// 已切换层级或重绘，丢弃过期回调
				if (myToken !== self.loadToken || !self.isOverviewLevel) {
					return;
				}
				self.isLoading = false;
				if (status !== 'complete' || !result || !result.districtList || result.districtList.length === 0) return;
				var bounds = result.districtList[0].boundaries;
				if (!bounds || bounds.length === 0) return;
				var areaInfo = { name: prov.name, adcode: prov.adcode, level: 'province' };
				for (var j = 0; j < bounds.length; j++) {
					self.createPolygon(bounds[j], areaInfo, true);
				}
				self.loadedProvinceCodes[prov.adcode] = true;
			});
		},
		// 绘制指定行政区的下级区域
		// adcode 行政区编码，level 当前所在级别
		drawArea(adcode, level) {
			var self = this;
			self.isLoading = true;
			self.errorMsg = '';
			self.loadingText = '正在加载行政区划数据...';
			// 版本号自增，使上一层级进行中的下钻回调失效，避免过期回调操作已切换的地图状态
			self.loadToken++;
			var myToken = self.loadToken;

			// 全国用关键字「中华人民共和国」查询最稳，省/市/区用 adcode
			var keyword = adcode === '100000' ? '中华人民共和国' : adcode;
			// 2.0 下 level 只能在构造时设置（setLevel 已移除），每次按 level 新建实例
			var district = self.createDistrictSearch(level);
			district.search(keyword, function (status, result) {
				if (status !== 'complete' || !result || !result.districtList || result.districtList.length === 0) {
					// 兜底：关键字失败再用 adcode 重试一次（全国场景）
					if (keyword !== adcode) {
						district.search(adcode, function (s2, r2) {
							self.handleSearchResult(s2, r2, level, myToken);
						});
						return;
					}
					if (myToken !== self.loadToken) return;
					self.isLoading = false;
					self.errorMsg = '未获取到「' + self.crumbList[self.crumbList.length - 1].name + '」的行政区划数据';
					return;
				}
				self.handleSearchResult(status, result, level, myToken);
			});
		},
		// 创建指定 level 的 DistrictSearch 实例（2.0 level 仅构造时生效）
		createDistrictSearch(level) {
			return new this.AMap.DistrictSearch({
				showbiz: false,
				level: level,
				extensions: 'all',
				subdistrict: 1
			});
		},
		// 处理 DistrictSearch 查询结果并绘制
		handleSearchResult(status, result, level, token) {
			var self = this;
			// 防御：组件已销毁、地图未就绪、或该回调已过期（层级已切换），直接丢弃
			if (!self.map || !self.AMap) return;
			if (token !== undefined && token !== self.loadToken) return;
			if (status !== 'complete' || !result || !result.districtList || result.districtList.length === 0) {
				self.isLoading = false;
				self.errorMsg = '未获取到「' + self.crumbList[self.crumbList.length - 1].name + '」的行政区划数据';
				return;
			}

			// 清除上次绘制（2.0 用 map 实例方法 remove）
			self.map.remove(self.polygons);
			self.polygons = [];

			var top = result.districtList[0];

			// 区县层级（最末层）：直接画区县自身边界，不再查询下级行政区
			if (level === 'district') {
				var distBounds = top.boundaries;
				if (distBounds && distBounds.length > 0) {
					var distInfo = { name: top.name, adcode: top.adcode, level: 'district' };
					for (var d = 0; d < distBounds.length; d++) {
						self.createPolygon(distBounds[d], distInfo, false);
					}
				}
				self.finishDraw();
				return;
			}

			var subList = top.districtList || [];

			// 没有下级行政区，已是末层
			if (subList.length === 0) {
				self.isLoading = false;
				return;
			}

			var canDrill = level !== 'district';
			// 统计子级里有多少已带 boundaries（2.0 子级可能不带，需逐个补查）
			var needFetch = [];
			for (var i = 0; i < subList.length; i++) {
				var sub = subList[i];
				var bounds = sub.boundaries;
				if (bounds && bounds.length > 0) {
					self.drawSubArea(sub, canDrill);
				} else {
					needFetch.push(sub);
				}
			}

			if (needFetch.length === 0) {
				self.finishDraw();
			} else {
				// 2.0 子级不带 boundaries 时，逐个补查其自身边界
				// 分组节流：每组 2 个并发，组间间隔 2.3 秒，规避高德并发限制
				var fetcher = new self.AMap.DistrictSearch({
					showbiz: false,
					level: self.nextLevel(level),
					extensions: 'all',
					subdistrict: 0
				});
				var subToken = self.loadToken;
				function fetchSub(sub, done) {
					fetcher.search(sub.adcode, function (s2, r2) {
						if (subToken !== self.loadToken || !self.map) { done(); return; }
						if (s2 === 'complete' && r2 && r2.districtList && r2.districtList.length > 0) {
							var subBounds = r2.districtList[0].boundaries;
							if (subBounds && subBounds.length > 0) {
								sub.boundaries = subBounds;
								self.drawSubArea(sub, canDrill);
							}
						}
						done();
					});
				}
				self.runGrouped(needFetch, fetchSub, subToken, function () {
					if (subToken === self.loadToken) self.finishDraw();
				});
			}
		},
		// 绘制单个子级行政区（可能多环）
		drawSubArea(sub, canDrill) {
			var self = this;
			var bounds = sub.boundaries;
			if (!bounds || bounds.length === 0) return;
			for (var j = 0; j < bounds.length; j++) {
				self.createPolygon(bounds[j], sub, canDrill);
			}
		},
		// 绘制收尾：视口自适应到当前绘制的所有区域（2.0 用 map.setFitView）
		finishDraw() {
			var self = this;
			self.isLoading = false;
			if (self.map && self.polygons.length > 0) {
				// immediately=true 立即调整中心点和缩放，适配当前内容；maxZoom 限制避免过度放大
				self.map.setFitView(self.polygons, true, [80, 80, 80, 80], 16);
			}
		},
		createPolygon(path, areaInfo, canDrill) {
			var self = this;
			// 防御：组件已销毁或地图未就绪时跳过，避免异步回调触发 null 报错
			if (!self.map || !self.AMap) return;
			var polygon = new self.AMap.Polygon({
				path: path,
				strokeColor: '#42b983',
				strokeWeight: 1,
				strokeOpacity: 0.9,
				strokeStyle: 'solid',
				fillColor: '#80d8ff',
				fillOpacity: 0.25,
				cursor: canDrill ? 'pointer' : 'default'
			});

			polygon._areaInfo = areaInfo;
			polygon._canDrill = canDrill;

			polygon.on('mouseover', function () {
				polygon.setOptions({
					fillOpacity: 0.55,
					strokeWeight: 2,
					strokeColor: '#2c8c63'
				});
				self.hoverInfo = {
					name: areaInfo.name,
					adcode: areaInfo.adcode,
					level: self.levelName(areaInfo.level),
					canDrill: canDrill
				};
			});

			polygon.on('mouseout', function () {
				polygon.setOptions({
					fillOpacity: 0.25,
					strokeWeight: 1,
					strokeColor: '#42b983'
				});
			});

			polygon.on('click', function () {
				if (!canDrill) {
					self.pulsePolygon(polygon);
					return;
				}
				self.drillDown(areaInfo);
			});

			self.polygons.push(polygon);
			self.map.add(polygon);
		},
		levelName(level) {
			var map = {
				country: '国家',
				province: '省级',
				city: '市级',
				district: '区县级'
			};
			return map[level] || level || '';
		},
		drillDown(areaInfo) {
			var self = this;
			// 个人私用模式：点击省时，若该省配置了限定市，则直接下钻到该市的区县，
			// 跳过"全市列表"层级，只请求单个市数据，避免查询整个省
			if (self.isLiteMode && areaInfo.level === 'province') {
				var liteCities = LITE_PROVINCE_CITIES[areaInfo.adcode];
				if (liteCities && liteCities.length === 1) {
					var city = liteCities[0];
					// 面包屑：省 → 市（仅一个市，直接进入其区县）
					self.crumbList.push({ name: areaInfo.name, adcode: areaInfo.adcode, level: 'province' });
					self.crumbList.push({ name: city.name, adcode: city.adcode, level: 'city' });
					self.isOverviewLevel = false;
					// 直接查询该市的区县（subdistrict:1 取区县）
					self.drawArea(city.adcode, 'city');
					return;
				}
			}
			var nextLevel = self.nextLevel(areaInfo.level);
			self.crumbList.push({
				name: areaInfo.name,
				adcode: areaInfo.adcode,
				level: nextLevel
			});
			// 下钻后离开全国概览层级，停止拖动懒加载
			self.isOverviewLevel = false;
			self.drawArea(areaInfo.adcode, nextLevel);
		},
		drillUp(index) {
			var self = this;
			if (index === self.crumbList.length - 1) {
				return;
			}
			self.crumbList = self.crumbList.slice(0, index + 1);
			var target = self.crumbList[self.crumbList.length - 1];
			// 回到全国或省层级时，按当前模式重新加载省界并恢复概览懒加载
			if (target.level === 'country' || target.level === 'province') {
				self.loadInitial();
				if (target.level === 'country') {
					self.map.setZoomAndCenter(INIT_ZOOM, NANJING_CENTER);
				}
				return;
			}
			self.isOverviewLevel = false;
			self.drawArea(target.adcode, target.level);
		},
		nextLevel(level) {
			var map = {
				country: 'province',
				province: 'city',
				city: 'district',
				district: 'district'
			};
			return map[level] || 'district';
		},
		// 最底层多边形呼吸高亮动画
		pulsePolygon(polygon) {
			if (polygon._pulsing) return;
			polygon._pulsing = true;
			var count = 0;
			var max = 6;
			var timer = setInterval(function () {
				if (count >= max) {
					clearInterval(timer);
					polygon.setOptions({
						fillOpacity: 0.25,
						strokeColor: '#42b983',
						strokeWeight: 1
					});
					polygon._pulsing = false;
					return;
				}
				if (count % 2 === 0) {
					polygon.setOptions({
						fillOpacity: 0.75,
						strokeColor: '#ef8e81',
						strokeWeight: 3
					});
				} else {
					polygon.setOptions({
						fillOpacity: 0.3,
						strokeColor: '#42b983',
						strokeWeight: 1
					});
				}
				count++;
			}, 180);
		},
		retry() {
			var target = this.crumbList[this.crumbList.length - 1];
			if (!this.map) {
				this.mapInit();
				return;
			}
			// 全国层级重试时按当前模式重新加载
			if (target.level === 'country') {
				this.loadInitial();
			} else {
				this.drawArea(target.adcode, target.level);
			}
		}
	}
};
</script>

<style lang="less" scoped>
.splitarea {
	width: 100%;
	height: 100%;
	position: relative;
	background: #f5f9f7;

	#splitarea-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
}

/* 模式开关 */
.mode-box {
	position: absolute;
	top: 76px;
	right: 24px;
	z-index: 1000;
	background: rgba(255, 255, 255, 0.88);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 8px 12px;
	box-shadow: 0 4px 18px rgba(66, 185, 131, 0.15);
	.ban-user-select();

	.mode-label {
		display: block;
		font-size: 11px;
		color: @grey;
		margin-bottom: 6px;
		text-align: center;
	}

	.mode-switch {
		display: flex;
		background: rgba(66, 185, 131, 0.08);
		border-radius: 8px;
		padding: 2px;

		.mode-option {
			padding: 5px 12px;
			font-size: 12px;
			color: @grey;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.25s ease;
			white-space: nowrap;
		}

		.mode-option:hover {
			color: @green;
		}

		.mode-option.active {
			background: @green;
			color: #ffffff;
			font-weight: bold;
			box-shadow: 0 2px 6px rgba(66, 185, 131, 0.4);
		}
	}
}

/* 面包屑导航 */
.crumb-box {
	position: absolute;
	top: 18px;
	left: 24px;
	z-index: 1000;
	background: rgba(255, 255, 255, 0.88);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-radius: 10px;
	padding: 10px 16px;
	box-shadow: 0 4px 18px rgba(66, 185, 131, 0.15);
	.ban-user-select();

	.crumb-title {
		display: flex;
		align-items: baseline;
		margin-bottom: 6px;

		.crumb-label {
			font-size: 15px;
			font-weight: bold;
			color: @green;
			letter-spacing: 0.5px;
		}

		.crumb-level {
			margin-left: 8px;
			font-size: 12px;
			color: @grey;
		}
	}

	.crumb-list {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		max-width: 560px;

		.crumb-item {
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			transition: all 0.2s ease;

			.crumb-name {
				font-size: 13px;
				color: @grey;
				padding: 2px 4px;
				border-radius: 4px;
				transition: all 0.2s ease;
			}

			.crumb-sep {
				margin: 0 2px;
				color: #d4d4d4;
			}

			.crumb-name:hover {
				color: @green;
				background: rgba(66, 185, 131, 0.1);
			}

			&.is-last {
				.crumb-name {
					color: #ffffff;
					background: @green;
					font-weight: bold;
				}

				.crumb-name:hover {
					color: #ffffff;
					background: @green;
				}
			}
		}
	}
}

/* 加载提示 */
.loading-tip {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 1001;
	background: rgba(255, 255, 255, 0.92);
	border: 1px solid rgba(66, 185, 131, 0.4);
	border-radius: 24px;
	padding: 14px 24px;
	display: flex;
	align-items: center;
	box-shadow: 0 6px 24px rgba(66, 185, 131, 0.2);
	.ban-user-select();

	.loading-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: @green;
		margin: 0 3px;
		animation: bounce-dot 1s infinite ease-in-out;
	}

	.loading-dot:nth-child(2) {
		animation-delay: 0.15s;
	}

	.loading-dot:nth-child(3) {
		animation-delay: 0.3s;
	}

	.loading-text {
		margin-left: 10px;
		font-size: 13px;
		color: @green;
	}
}

@keyframes bounce-dot {

	0%,
	80%,
	100% {
		transform: scale(0.6);
		opacity: 0.6;
	}

	40% {
		transform: scale(1.1);
		opacity: 1;
	}
}

/* 错误提示 */
.error-tip {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 1001;
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid rgba(239, 142, 129, 0.5);
	border-radius: 10px;
	padding: 16px 24px;
	display: flex;
	align-items: center;
	font-size: 14px;
	color: @red;
	box-shadow: 0 6px 24px rgba(239, 142, 129, 0.2);
	.ban-user-select();

	.error-retry {
		margin-left: 12px;
		padding: 4px 12px;
		border: 1px solid @red;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.error-retry:hover {
		background: @red;
		color: #ffffff;
	}
}

/* 信息卡 */
.info-card {
	position: absolute;
	bottom: 30px;
	right: 30px;
	z-index: 1000;
	width: 200px;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(66, 185, 131, 0.35);
	border-left: 4px solid @green;
	border-radius: 8px;
	padding: 12px 14px;
	box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
	animation: card-in 0.25s ease;
	.ban-user-select();

	.info-name {
		font-size: 16px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 8px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		margin-bottom: 4px;

		.info-key {
			color: @grey;
		}

		.info-val {
			color: #2c3e50;
		}
	}

	.info-tip {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed rgba(66, 185, 131, 0.3);
		font-size: 12px;
		color: @green;
		text-align: center;
	}

	.info-tip-end {
		color: @red;
	}
}

@keyframes card-in {
	from {
		opacity: 0;
		transform: translateY(10px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
