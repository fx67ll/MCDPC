<!-- @name: DailyCommute -->
<!-- @author: fx67ll -->
<!-- @version: 1.0.0-->
<!-- @description：每日通勤用时查看页。上班/下班双面板，按当前时间自动切换。
                2 条路线（起始点不同），途经南京花神科技广场东门，终点 BeanStar 比星咖啡(江宁纳科东店)。
                展示路线耗时、抵达途经点/终点预估时间点、上班距 9 点倒计时、路段拥堵红绿、道路封闭提示、
                路线对比推荐、出发建议、一键导航。使用高德 AMap.Driving 路径规划。移动端优先，web/移动风格一致。-->

<template>
	<div class="daily" :class="['theme-' + theme, { 'is-mobile': isMobile }]">
		<!-- ===== Web 端：左右分栏（左侧悬浮可收起） ===== -->
		<template v-if="!isMobile">
			<aside class="web-side" :class="{ collapsed: panelCollapsed }">
				<div class="web-side-inner" v-show="!panelCollapsed">
					<div class="web-header">
						<div class="web-header-top">
							<div class="web-header-left">
								<div class="web-title"><span class="web-title-icon">🚗</span> 每日通勤</div>
								<div class="web-now" @click="manualLocate" title="点击获取当前位置">{{ nowText }}{{ locateStatus
									? ' · ' + locateStatus : '' }}</div>
							</div>
							<!-- 自动刷新指示胶囊（点击打开设置） -->
							<div class="web-auto-pill" :class="{ on: refreshInterval > 0 }"
								@click="refreshConfigOpen = !refreshConfigOpen" title="定时刷新设置">
								<span class="pill-dot" :class="{ spinning: isLoading }"></span>
								<span class="pill-text" v-if="refreshInterval > 0">{{ formatInterval(refreshInterval)
								}}</span>
								<span class="pill-text" v-else>手动</span>
							</div>
							<!-- 定时刷新设置弹层 -->
							<div class="web-config-pop" v-if="refreshConfigOpen" @click.stop>
								<div class="cfg-title">⏱ 定时刷新设置</div>
								<div class="cfg-row">
									<span class="cfg-label">刷新间隔</span>
									<select class="cfg-select" :value="refreshInterval"
										@change="onIntervalChange(Number($event.target.value))">
										<option :value="10">10 秒</option>
										<option :value="30">30 秒</option>
										<option :value="60">1 分钟</option>
										<option :value="120">2 分钟</option>
										<option :value="300">5 分钟（默认）</option>
										<option :value="600">10 分钟</option>
										<option :value="0">关闭</option>
									</select>
								</div>
								<div class="cfg-status" v-if="refreshInterval > 0">
									<span class="cfg-dot active"></span>每 {{ formatInterval(refreshInterval) }} 自动刷新
								</div>
								<div class="cfg-status" v-else>
									<span class="cfg-dot inactive"></span>已关闭定时刷新
								</div>
								<div class="cfg-desc">ℹ 配置仅当前会话有效</div>
							</div>
						</div>
						<div class="web-header-bottom">
							<div class="web-refresh-btn" :class="{ loading: isLoading }" @click="refreshAll"
								title="手动刷新">
								<span class="web-refresh-icon">↻</span>
								<span class="web-refresh-text">刷新</span>
							</div>
							<div class="web-last-time" v-if="lastRefreshTime">最后刷新 {{ lastRefreshTime }}</div>
							<div class="web-collapse-btn" @click="togglePanel" title="收起面板">
								<span>收起</span>
								<svg class="collapse-arrow" viewBox="0 0 24 24" width="14" height="14">
									<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.5"
										stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
						</div>
					</div>
					<div class="web-side-scroll">
						<commute-tabs :value="tab" :tip="tabTip" @change="switchTab"></commute-tabs>
						<!-- 加载占位 -->
						<div class="loading-placeholder" v-if="!tab">
							<div class="lp-spinner"></div>
							<div class="lp-text">正在获取定位与路线信息...</div>
						</div>
						<template v-else>
							<countdown-card v-if="tab === 'go'" :now="now"
								:duration="currentRouteData ? currentRouteData.duration : 0"
								:best-duration="bestDuration"></countdown-card>
							<route-compare :routes="routeResults" :current="currentRoute"
								@select="switchRoute"></route-compare>
							<alert-banner :text="closedInfo"></alert-banner>
							<route-summary :data="currentRouteData"></route-summary>
							<segment-duration :data="currentRouteData"></segment-duration>
							<time-line :data="currentRouteData" :now="now" :show-remain="tab === 'go'"></time-line>
							<div class="d-error" v-if="errorMsg">{{ errorMsg }}</div>
						</template>
					</div>
				</div>
				<!-- 收起状态：贴边的竖向小胶囊（展开 + 刷新合一） -->
				<div class="web-edge-bar" v-show="panelCollapsed">
					<div class="edge-item" @click="refreshAll" title="手动刷新">
						<svg viewBox="0 0 24 24" width="16" height="16">
							<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
								:class="{ spinning: isLoading }" />
						</svg>
					</div>
					<div class="edge-divider"></div>
					<div class="edge-item" :class="{ active: weatherFloatOpen }"
						@click="weatherFloatOpen = !weatherFloatOpen" title="天气">
						<svg viewBox="0 0 24 24" width="18" height="18">
							<path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1A4 4 0 0 0 6 18h11z" fill="none"
								stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
					<div class="edge-item" @click="openNav" title="一键导航">
						<svg viewBox="0 0 24 24" width="16" height="16">
							<path d="M3 11l19-9-9 19-2-8-8-2z" fill="none" stroke="currentColor" stroke-width="2"
								stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
					<div class="edge-divider"></div>
					<div class="edge-item" @click="togglePanel" title="展开面板">
						<svg viewBox="0 0 24 24" width="18" height="18">
							<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5"
								stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
				</div>
			</aside>
			<main class="web-map">
				<div id="daily-map-container" ref="map"></div>
				<div class="map-loading" v-show="isLoading">规划路线中...</div>
				<!-- web 端天气浮动卡片（右上角，面板展开时直接显示，收起时需点 edge-bar 按钮打开） -->
				<div class="web-weather-float" v-if="weatherLive && (!panelCollapsed || weatherFloatOpen)">
					<div class="wwf-main">
						<span class="wwf-temp">{{ weatherLive.temperature }}°</span>
						<div class="wwf-info">
							<div class="wwf-city">{{ weatherLive.city }} · {{ weatherLive.weather }}</div>
							<div class="wwf-desc">湿度{{ weatherLive.humidity }}% · {{ weatherLive.windDirection }}风{{
								weatherLive.windPower }}级</div>
						</div>
					</div>
					<div class="wwf-forecast" v-if="weatherForecast.length">
						<div class="wwf-fc" v-for="(f, i) in weatherForecast" :key="i"
							:style="{ animationDelay: i * 0.06 + 's' }">
							<span class="wwf-fc-date">{{ f.week }}</span>
							<span class="wwf-fc-w">{{ f.dayWeather }}</span>
							<span class="wwf-fc-t">{{ f.nightTemp }}~{{ f.dayTemp }}°</span>
						</div>
					</div>
				</div>
				<div class="nav-btn" v-if="currentRouteData && !panelCollapsed" @click="openNav">🧭 一键导航</div>
			</main>
		</template>

		<!-- ===== 移动端：全屏地图 + 浮层 ===== -->
		<template v-else>
			<!-- 全屏地图 -->
			<div class="m-map">
				<div id="daily-map-container" ref="map"></div>
				<div class="map-loading" v-show="isLoading">规划路线中...</div>
			</div>

			<!-- 顶部浮层：tab + 倒计时 -->
			<div class="m-top">
				<div class="m-top-bar">
					<!-- 左侧：占位保持 tab 居中 -->
					<div class="m-top-left">
						<span class="m-now" @click="manualLocate" title="点击获取当前位置">{{ nowText }}{{ locateStatus ? ' · '
							+ locateStatus : '' }}</span>
					</div>
					<!-- 中间：tab（严格居中） -->
					<div class="m-tabs-mini">
						<span class="m-tab-mini" :class="{ active: tab === 'go' }" @click="switchTab('go')">上班</span>
						<span class="m-tab-mini" :class="{ active: tab === 'back' }"
							@click="switchTab('back')">下班</span>
					</div>
					<!-- 右侧：刷新 + 设置（SVG 图标，大小一致） -->
					<div class="m-top-actions">
						<span class="m-icon-btn" :class="{ loading: isLoading }" @click="refreshAll" title="刷新">
							<svg viewBox="0 0 24 24" width="20" height="20">
								<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" fill="none" stroke="currentColor"
									stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</span>
						<span class="m-icon-btn" @click="mRefreshConfigOpen = true" title="定时刷新设置">
							<svg viewBox="0 0 24 24" width="20" height="20">
								<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor"
									stroke-width="2" />
								<path
									d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
									fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
									stroke-linejoin="round" />
							</svg>
						</span>
					</div>
				</div>
				<div class="m-countdown" v-if="tab === 'go'" :class="{ late: countdownLate }">
					<span class="m-cd-label">{{ countdownPeriod === 'nextday' ? '距明日 09:00' : '距 09:00' }}</span>
					<span class="m-cd-time" :class="{ urgent: countdownUrgent }">{{ countdownText }}</span>
				</div>
			</div>

			<!-- 一键导航 -->
			<div class="m-nav-btn" v-if="currentRouteData" @click="openNav">🧭 导航</div>

			<!-- 底部抽屉：路线信息 -->
			<div class="m-sheet" :class="{ expanded: sheetExpanded }">
				<div class="m-sheet-handle" @click="tab && (sheetExpanded = !sheetExpanded)">
					<span class="handle-bar"></span>
					<div class="handle-info" v-if="currentRouteData">
						<span class="handle-title">
							{{ currentRouteData.name }}
							<span class="handle-sep">·</span>
							<span class="handle-dur">{{ currentRouteData.durationText }}</span>
							<span class="handle-sep">·</span>
							<span class="handle-cong" :class="'cong-' + currentRouteData.congestionCls">{{
								currentRouteData.congestionText }}</span>
						</span>
					</div>
					<div class="handle-info" v-else>
						<span class="handle-title">{{ tab ? '路线规划中...' : '正在获取定位信息...' }}</span>
					</div>
				</div>
				<div class="m-sheet-body" v-if="tab">
					<route-compare :routes="routeResults" :current="currentRoute" @select="switchRoute"></route-compare>
					<alert-banner :text="closedInfo"></alert-banner>
					<route-summary :data="currentRouteData"></route-summary>
					<segment-duration :data="currentRouteData"></segment-duration>
					<time-line :data="currentRouteData" :now="now" :show-remain="tab === 'go'"></time-line>
					<div class="d-error" v-if="errorMsg">{{ errorMsg }}</div>
					<weather-card :live="weatherLive" :forecast="weatherForecast"
						:last-update="lastRefreshTime ? '天气更新于 ' + lastRefreshTime : ''"></weather-card>
					<div class="d-foot">数据来源：高德地图实时路径规划 · 仅供参考</div>
				</div>
				<!-- tab 未确定时显示加载占位 -->
				<div class="m-sheet-body loading-placeholder" v-else>
					<div class="lp-spinner"></div>
					<div class="lp-text">正在获取定位与路线信息...</div>
				</div>
			</div>

			<!-- 移动端定时刷新设置弹层 -->
			<transition name="nav-fade">
				<div class="m-cfg-mask" v-if="mRefreshConfigOpen" @click="mRefreshConfigOpen = false">
					<div class="m-cfg-sheet" @click.stop>
						<div class="m-cfg-title">⏱ 定时刷新设置</div>
						<div class="m-cfg-opts">
							<div class="m-cfg-opt" v-for="opt in intervalOptions" :key="opt.value"
								:class="{ active: refreshInterval === opt.value }"
								@click="onIntervalChange(opt.value); mRefreshConfigOpen = false">{{ opt.label }}</div>
						</div>
						<div class="m-cfg-status" v-if="refreshInterval > 0">
							<span class="cfg-dot active"></span>每 {{ formatInterval(refreshInterval) }} 自动刷新
						</div>
						<div class="m-cfg-status" v-else>
							<span class="cfg-dot inactive"></span>已关闭定时刷新
						</div>
						<div class="m-cfg-close" @click="mRefreshConfigOpen = false">关闭</div>
					</div>
				</div>
			</transition>
		</template>

		<!-- 导航确认弹窗（防误触） -->
		<transition name="nav-fade">
			<div class="nav-mask" v-if="navConfirmShow" @click="cancelNav">
				<div class="nav-modal" @click.stop>
					<div class="nav-modal-icon">🧭</div>
					<div class="nav-modal-title">即将打开高德导航</div>
					<div class="nav-modal-desc" v-if="currentRouteData">
						{{ currentRouteData.startName }} → {{ currentRouteData.viaName }} → {{ currentRouteData.endName
						}}
					</div>
					<div class="nav-modal-tip">导航将在新页签打开，可在高德 App 内发送到车机</div>
					<div class="nav-modal-btns">
						<div class="nav-modal-btn cancel" @click="cancelNav">取消</div>
						<div class="nav-modal-btn confirm" @click="confirmNav">确认导航</div>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>

<script>
import { loadAMap } from '@/utils/amapLoader.js';
import { GO_ROUTES, BACK_ROUTES, CONGESTION, formatTime, fmtDuration, fmtDistance, autoTabByHour, enqueueAMapTask } from './commuteData.js';
import CommuteHeader from './components/CommuteHeader.vue';
import CommuteTabs from './components/CommuteTabs.vue';
import CountdownCard from './components/CountdownCard.vue';
import RouteCompare from './components/RouteCompare.vue';
import AlertBanner from './components/AlertBanner.vue';
import RouteSummary from './components/RouteSummary.vue';
import TimeLine from './components/TimeLine.vue';
import SegmentsBar from './components/SegmentsBar.vue';
import SegmentDuration from './components/SegmentDuration.vue';
import WeatherCard from './components/WeatherCard.vue';

export default {
	name: 'DailyCommute',
	components: {
		CommuteHeader,
		CommuteTabs,
		CountdownCard,
		RouteCompare,
		AlertBanner,
		RouteSummary,
		TimeLine,
		SegmentsBar,
		SegmentDuration,
		WeatherCard
	},
	data() {
		return {
			AMap: null,
			map: null,
			driving: null,
			segDriving: null, // 分段规划用（无 map，只算耗时）
			tab: null, // go 上班 / back 下班 / null 未确定（初始化加载中）
			currentRoute: 0,
			routeResults: [],
			isLoading: false,
			errorMsg: '',
			now: new Date(),
			tickTimer: null,
			isMobile: false,
			sheetExpanded: false,
			navConfirmShow: false, // 导航确认弹窗
			markers: [], // 地图标注（起点/途经/终点/当前位置）
			currentLnglat: null, // 当前定位
			// 自动刷新
			refreshInterval: 300, // 刷新间隔秒，默认5分钟，0=关闭
			autoRefreshTimer: null,
			lastRefreshTime: '',
			isAutoRefreshing: false, // 是否正在自动刷新（区别于手动）
			// web 端面板收起
			panelCollapsed: false,
			weatherFloatOpen: false, // 收起状态下天气浮动卡片是否打开
			_tabByLocationDone: false, // 定位判断 tab 是否已执行（仅首次定位成功时切换）
			_initRefreshed: false, // 初始化是否已触发首次刷新
			tabSource: 'time', // tab 来源：time 时间判断 / location 定位判断
			_locating: false, // 是否正在定位
			locateStatus: '', // 定位状态提示
			refreshConfigOpen: false, // web 端刷新设置弹层
			mRefreshConfigOpen: false, // 移动端刷新设置弹层
			// 天气
			weatherLive: null,
			weatherForecast: [],
			_resizeHandler: null
		};
	},
	computed: {
		theme() {
			return this.tab;
		},
		currentRoutes() {
			if (!this.tab) return [];
			return this.tab === 'go' ? GO_ROUTES : BACK_ROUTES;
		},
		currentRouteData() {
			return this.routeResults[this.currentRoute] || null;
		},
		tabTip() {
			if (!this.tab) return '正在判断...';
			var auto = autoTabByHour(this.now);
			if (this.tabSource === 'location') {
				// 走定位判断逻辑
				if (this.tab !== auto) {
					return '按定位自动选择';
				}
				return '按定位自动选择';
			}
			// 走时间判断逻辑
			if (this.tab !== auto) {
				return '已手动切换';
			}
			return '按当前时间自动选择';
		},
		bestDuration() {
			var best = Infinity;
			this.routeResults.forEach(function (r) {
				if (r && r.duration > 0 && r.duration < best) best = r.duration;
			});
			return best === Infinity ? 0 : best;
		},
		closedInfo() {
			if (!this.currentRouteData) return '';
			return this.currentRouteData.closedInfo || '';
		},
		nowText() {
			return formatTime(this.now);
		},
		countdownText() {
			if (this.countdownPeriod === 'today') return '已到上班时间';
			var r = Math.floor((this.countdownTarget - this.now) / 1000);
			if (r <= 0) return '已到上班时间';
			var h = Math.floor(r / 3600);
			var m = Math.floor((r % 3600) / 60);
			var s = r % 60;
			return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
		},
		countdownUrgent() {
			if (this.countdownPeriod === 'today') return false;
			var r = Math.floor((this.countdownTarget - this.now) / 1000);
			return r > 0 && r <= 1800;
		},
		// 移动端倒计时是否迟到：仅 9~18 点且现在出发会晚于 9 点
		countdownLate() {
			var h = this.now.getHours();
			if (h < 9 || h >= 18) return false;
			var r = this.currentRouteData;
			if (!r || !r.duration) return false;
			var arrive = new Date(this.now.getTime() + r.duration * 1000);
			return arrive > this.todayAt(9, 0);
		},
		// 移动端倒计时时段（与 CountdownCard 一致）
		countdownPeriod() {
			var h = this.now.getHours();
			if (h < 9) return 'before';
			if (h < 18) return 'today';
			return 'nextday';
		},
		// 移动端倒计时目标
		countdownTarget() {
			if (this.countdownPeriod === 'nextday') {
				var d = new Date(this.now);
				d.setDate(d.getDate() + 1);
				d.setHours(9, 0, 0, 0);
				return d;
			}
			return this.todayAt(9, 0);
		},
		// 自动刷新间隔选项
		intervalOptions() {
			return [
				{ value: 10, label: '10 秒' },
				{ value: 30, label: '30 秒' },
				{ value: 60, label: '1 分钟' },
				{ value: 120, label: '2 分钟' },
				{ value: 300, label: '5 分钟（默认）' },
				{ value: 600, label: '10 分钟' },
				{ value: 0, label: '关闭' }
			];
		}
	},
	mounted() {
		this.isMobile = window.innerWidth <= 960;
		this.tab = null; // 初始未确定，等定位/时间判断后设置
		this.now = new Date();
		this.initMap();
		this.tickTimer = setInterval(() => {
			this.now = new Date();
		}, 1000);
		// 监听窗口尺寸变化，切换移动/web 布局并重绘地图
		var self = this;
		this._resizeHandler = function () {
			var wasMobile = self.isMobile;
			self.isMobile = window.innerWidth <= 960;
			// 布局切换后地图容器尺寸变化，延迟重绘
			if (wasMobile !== self.isMobile && self.map) {
				self.$nextTick(function () {
					setTimeout(function () {
						try { self.map.setFitView(); } catch (e) { }
					}, 300);
				});
			}
		};
		window.addEventListener('resize', this._resizeHandler);
		// 启动自动刷新
		this.startAutoRefresh();
		this.markRefreshTime();
		// 点击空白处关闭 web 端刷新设置弹层
		var self2 = this;
		this._docClickHandler = function (e) {
			if (self2.refreshConfigOpen && !e.target.closest('.web-auto-pill') && !e.target.closest('.web-config-pop')) {
				self2.refreshConfigOpen = false;
			}
		};
		document.addEventListener('click', this._docClickHandler);
	},
	beforeDestroy() {
		if (this.tickTimer) clearInterval(this.tickTimer);
		this.stopAutoRefresh();
		if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
		if (this._docClickHandler) document.removeEventListener('click', this._docClickHandler);
		if (this.map) {
			this.map.destroy();
			this.map = null;
		}
	},
	methods: {
		initMap() {
			var self = this;
			loadAMap(['AMap.Driving', 'AMap.Geolocation', 'AMap.Weather']).then(function (AMap) {
				self.AMap = AMap;
				self.map = new AMap.Map('daily-map-container', {
					zoom: 11,
					center: [118.75, 32.0],
					mapStyle: 'amap://styles/whitesmoke'
				});
				self.driving = new AMap.Driving({
					map: self.map,
					policy: (AMap.DrivingPolicy && AMap.DrivingPolicy.LEAST_TIME) || 'LEAST_TIME',
					hideMarkers: true,
					showTraffic: true
				});
				// 不带 map 的 Driving 实例，用于分段规划只算耗时（不画图，不覆盖主路线）
				self.segDriving = new AMap.Driving({
					policy: (AMap.DrivingPolicy && AMap.DrivingPolicy.LEAST_TIME) || 'LEAST_TIME',
					hideMarkers: true
				});
				// 获取当前位置并标注（定位成功后由回调触发首次 refreshAll，定位超时则用时间逻辑兜底）
				self._initRefreshed = false;
				self._locateFailed = false;
				self.locateCurrent();
				// 定位超时兜底：8 秒后如果定位还没回来，用时间逻辑确定 tab 并刷新
				// 高德 Geolocation timeout 设为 8 秒，这里与之一致
				setTimeout(function () {
					if (!self._initRefreshed) {
						self._initRefreshed = true;
						self._locateFailed = true;
						if (!self.tab) {
							self.tab = autoTabByHour(new Date());
							self.theme = self.tab;
						}
						self.refreshAll();
					}
				}, 8000);
				// 查询南京天气（独立于路线刷新，走缓存逻辑）
				self.queryWeather();
			}).catch(function (err) {
				self.errorMsg = '地图加载失败：' + (err && err.message ? err.message : err);
				console.error('DailyCommute 加载失败:', err);
			});
		},
		refreshAll() {
			var self = this;
			if (!self.driving || !self.tab) return;
			self.isLoading = true;
			self.errorMsg = '';
			self.markRefreshTime();
			var routes = self.currentRoutes;
			self.routeResults = routes.map(function () { return null; });
			var done = 0;
			// 先规划非选中路线，最后规划选中路线（driving 会画最后一条到地图上，即选中路线）
			var order = routes.map(function (_, i) { return i; });
			order.sort(function (a, b) {
				if (a === self.currentRoute) return 1; // 选中路线排最后
				if (b === self.currentRoute) return -1;
				return 0;
			});
			order.forEach(function (idx) {
				var route = routes[idx];
				// 每条路线独立 10 秒超时，超时只影响该条
				var routeDone = false;
				var routeTimer = setTimeout(function () {
					if (routeDone) return;
					routeDone = true;
					self.$set(self.routeResults, idx, self.buildEmptyRoute(route, '该路线规划超时，请刷新重试'));
					done++;
					if (done === routes.length) {
						self.isLoading = false;
						self.drawMarkersOnly();
					}
				}, 10000);
				self.planRoute(route, function (result) {
					if (routeDone) return;
					routeDone = true;
					clearTimeout(routeTimer);
					self.$set(self.routeResults, idx, result);
					done++;
					if (done === routes.length) {
						self.isLoading = false;
						// 选中路线已最后规划并画到地图，只需画标注
						self.drawMarkersOnly();
					}
				});
			});
		},
		// 获取路线所有途经点坐标数组（支持 via + via2）
		getWaypoints(route) {
			var wps = [route.via.lnglat];
			if (route.via2) wps.push(route.via2.lnglat);
			return wps;
		},
		// 构建关键时间点数组（起点→途经1→途经2→...→终点）
		// 每个点包含：名称、抵达时间、距9点剩余、圆点类型
		buildTimePoints(route, totalDuration) {
			var self = this;
			var viaNames = this.getViaNames(route);
			var wps = this.getWaypoints(route);
			// 所有点名称
			var allNames = [route.start.name].concat(viaNames).concat([route.end.name]);
			var totalSegs = allNames.length - 1;
			var segDur = Math.round(totalDuration / totalSegs); // 均分估算
			var points = [];
			var cumDur = 0;
			for (var i = 0; i < allNames.length; i++) {
				var dotClass = i === 0 ? 'start' : (i === allNames.length - 1 ? 'end' : 'via');
				points.push({
					name: allNames[i],
					isStart: i === 0,
					arriveText: i === 0 ? '' : self.arriveText(cumDur),
					remainText: i === 0 ? '' : self.remainText(cumDur),
					dotClass: dotClass
				});
				if (i < totalSegs) cumDur += segDur;
			}
			return points;
		},
		// 构建分段耗时数组（初始估算，后续由 drawMarkers 实际规划更新）
		buildSegDurations(route, totalDuration) {
			var viaNames = this.getViaNames(route);
			var wps = this.getWaypoints(route);
			var allPoints = [{ name: route.start.name }].concat(
				viaNames.map(function (n) { return { name: n }; })
			).concat([{ name: route.end.name }]);
			var totalSegs = allPoints.length - 1;
			var segDur = Math.round(totalDuration / totalSegs);
			var segs = [];
			for (var i = 0; i < totalSegs; i++) {
				segs.push({
					from: allPoints[i].name,
					to: allPoints[i + 1].name,
					durationText: fmtDuration(segDur)
				});
			}
			return segs;
		},
		// 获取路线所有途经点名称数组
		getViaNames(route) {
			var names = [route.via.name];
			if (route.via2) names.push(route.via2.name);
			return names;
		},
		planRoute(route, callback) {
			var self = this;
			try {
				enqueueAMapTask(function (done) {
					self.driving.search(
						route.start.lnglat,
						route.end.lnglat,
						{ waypoints: self.getWaypoints(route) },
						function (status, result) {
							done();
							if (status !== 'complete' || !result || !result.routes || !result.routes.length) {
								callback(self.buildEmptyRoute(route, '路线规划失败，请稍后重试'));
								return;
							}
							callback(self.parseRoute(route, result.routes[0]));
						}
					);
				});
			} catch (e) {
				callback(self.buildEmptyRoute(route, '路线规划异常：' + e.message));
			}
		},
		parseRoute(route, r) {
			var self = this;
			var duration = r.time || 0;
			var distance = r.distance || 0;
			var segments = [];
			var jamCount = 0;
			var closedInfo = '';
			var totalTolls = 0; // 总过路费（元）
			var tollRoads = []; // 收费路段名
			var hasTmcs = false; // 调试：是否有 tmcs 拥堵数据
			if (r.steps) {
				r.steps.forEach(function (step) {
					// 2.0 拥堵在 step.tmcs（每个 tmc 有 status + length），不是 step.tmc
					if (step.tmcs && step.tmcs.length) {
						hasTmcs = true;
						step.tmcs.forEach(function (t) {
							var st = t.status || 0;
							var cong = CONGESTION[st] || CONGESTION[0];
							segments.push({
								name: step.road || step.instruction || '路段',
								level: cong.level,
								statusText: cong.text,
								weight: Math.max(1, (t.length || 100) / 100)
							});
							if (st >= 3) jamCount++;
						});
					} else {
						// 无 tmcs 时用 step 整体作为一段（status 未知）
						segments.push({
							name: step.road || step.instruction || '路段',
							level: 0,
							statusText: '未知',
							weight: Math.max(1, (step.distance || 100) / 100)
						});
					}
					// 累加过路费：高德 step.tolls 单位为元（部分版本为分，统一处理）
					if (step.tolls && step.tolls > 0) {
						var toll = step.tolls > 1000 ? step.tolls / 100 : step.tolls; // >1000 视为分，转元
						totalTolls += toll;
						if (step.toll_road && tollRoads.indexOf(step.toll_road) === -1) {
							tollRoads.push(step.toll_road);
						}
					}
				});
			}
			// 优先用路线级费用（若高德返回）
			if (r.tolls !== undefined && r.tolls > 0) {
				totalTolls = r.tolls > 1000 ? r.tolls / 100 : r.tolls;
			}
			var tollText = totalTolls > 0 ? ('约 ' + totalTolls.toFixed(1) + ' 元') : '免费';
			// 调试：打印是否有 tmcs 拥堵数据，以及第一条 step 的结构
			console.log('[DailyCommute] hasTmcs=', hasTmcs, 'stepCount=', (r.steps || []).length, 'firstStep=', r.steps && r.steps[0] ? Object.keys(r.steps[0]) : 'none');
			// 打印第一个 step 的 tmcs[0] 完整结构，确认拥堵字段名
			if (r.steps && r.steps[0] && r.steps[0].tmcs && r.steps[0].tmcs[0]) {
				console.log('[DailyCommute] firstTmc=', JSON.stringify(r.steps[0].tmcs[0]));
			}
			var tollRoadsText = tollRoads.length ? tollRoads.join('、') : '';
			// 整体拥堵级别
			var congestionLevel = 1;
			if (segments.length > 0) {
				var jamRatio = jamCount / segments.length;
				if (jamRatio > 0.5) congestionLevel = 4;
				else if (jamRatio > 0.3) congestionLevel = 3;
				else if (jamRatio > 0.1) congestionLevel = 2;
				else congestionLevel = 1;
			}
			// 途经点耗时估算（按距离比例）
			var viaRatio = 0.5;
			var viaDuration = Math.round(duration * viaRatio);
			var cong = CONGESTION[congestionLevel];

			return {
				name: route.name,
				color: route.color,
				startName: route.start.name,
				viaName: self.getViaNames(route).join(' → '),
				endName: route.end.name,
				startLnglat: route.start.lnglat,
				endLnglat: route.end.lnglat,
				duration: duration,
				durationText: fmtDuration(duration),
				distanceText: fmtDistance(distance),
				congestionLevel: congestionLevel,
				congestionCls: cong.cls,
				congestionText: cong.text,
				tollText: tollText,
				tollRoadsText: tollRoadsText,
				segments: segments,
				viaArriveText: this.arriveText(viaDuration),
				endArriveText: this.arriveText(duration),
				viaRemainText: this.remainText(viaDuration),
				endRemainText: this.remainText(duration),
				viaDurationText: fmtDuration(viaDuration),
				endDurationText: fmtDuration(duration),
				// 分段耗时数组（动态，支持多途经点）
				segDurations: self.buildSegDurations(route, duration),
				// 关键时间点数组（动态，起点→途经1→途经2→...→终点）
				timePoints: self.buildTimePoints(route, duration),
				closedInfo: closedInfo,
				rawRoute: r
			};
		},
		buildEmptyRoute(route, msg) {
			return {
				name: route.name,
				color: route.color,
				startName: route.start.name,
				viaName: this.getViaNames(route).join(' → '),
				endName: route.end.name,
				startLnglat: route.start.lnglat,
				endLnglat: route.end.lnglat,
				duration: 0,
				durationText: '--',
				distanceText: '--',
				congestionLevel: 0,
				congestionCls: 'unknown',
				congestionText: '未知',
				tollText: '--',
				tollRoadsText: '',
				segments: [],
				viaArriveText: '--:--',
				endArriveText: '--:--',
				viaRemainText: '--',
				endRemainText: '--',
				viaDurationText: '--',
				endDurationText: '--',
				segDurations: [],
				timePoints: [],
				closedInfo: msg,
				rawRoute: null
			};
		},
		// refreshAll 完成后调用：选中路线已最后规划并画到地图，只需画标注+分段+刷新视图
		drawMarkersOnly() {
			var self = this;
			var route = self.currentRoutes[self.currentRoute];
			if (!route || !self.currentRouteData) return;
			var result = { routes: [self.currentRouteData.rawRoute] };
			// 如果 rawRoute 为空（规划失败），传空 result
			if (!self.currentRouteData.rawRoute) {
				result = { routes: [] };
			}
			self.drawMarkers(route, result);
		},
		drawCurrentRoute() {
			var self = this;
			// 不再重复 search（refreshAll 已用带 map 的 driving 规划并绘制路线）
			// 切换路线时只需重新规划当前选中路线绘制到地图 + 画标注
			var route = self.currentRoutes[self.currentRoute];
			if (!self.driving || !route) return;
			// 用当前已有结果画标注（避免重复 search 增加请求量）
			var existingResult = self.currentRouteData && self.currentRouteData.rawRoute;
			if (existingResult) {
				// 已有规划结果，直接画标注 + 分段
				// 但需要 driving 重新画当前选中路线到地图（切换路线时需要）
				enqueueAMapTask(function (done) {
					self.driving.search(
						route.start.lnglat,
						route.end.lnglat,
						{ waypoints: self.getWaypoints(route) },
						function (status, result) {
							done();
							self.drawMarkers(route, result);
							self.restoreMapView();
						}
					);
				});
			} else {
				// 无已有结果（首次或切换 tab），正常规划
				enqueueAMapTask(function (done) {
					self.driving.search(
						route.start.lnglat,
						route.end.lnglat,
						{ waypoints: self.getWaypoints(route) },
						function (status, result) {
							done();
							self.drawMarkers(route, result);
						}
					);
				});
			}
		},
		// 查询南京天气（实时 + 4天预报）
		queryWeather() {
			var self = this;
			if (!self.AMap || !self.AMap.Weather) return;
			// 缓存逻辑：刷新间隔 = 当前自动刷新时间 + 1h23min
			// 未超过间隔则使用缓存，不重新查询
			var cacheKey = 'daily_commute_weather';
			var cached = null;
			try {
				cached = JSON.parse(localStorage.getItem(cacheKey));
			} catch (e) { }
			// 计算需要的缓存间隔（毫秒）= 当前刷新间隔秒 + 1h23min(4980秒)
			var minInterval = (self.refreshInterval + 4980) * 1000;
			if (cached && cached.timestamp) {
				var elapsed = Date.now() - cached.timestamp;
				if (elapsed < minInterval) {
					// 使用缓存
					self.weatherLive = cached.live;
					self.weatherForecast = cached.forecast || [];
					return;
				}
			}
			// 超过间隔或无缓存，重新查询
			try {
				var weather = new self.AMap.Weather();
				// 实时天气
				weather.getLive('南京', function (err, data) {
					if (!err && data) {
						self.weatherLive = data;
						// 存缓存
						try {
							localStorage.setItem(cacheKey, JSON.stringify({
								timestamp: Date.now(),
								live: data,
								forecast: self.weatherForecast
							}));
						} catch (e) { }
					}
				});
				// 4天预报
				weather.getForecast('南京', function (err, data) {
					if (!err && data && data.length) {
						self.weatherForecast = data;
						// 更新缓存的 forecast
						try {
							var existing = JSON.parse(localStorage.getItem(cacheKey) || '{}');
							existing.forecast = data;
							if (!existing.timestamp) existing.timestamp = Date.now();
							localStorage.setItem(cacheKey, JSON.stringify(existing));
						} catch (e) { }
					}
				});
			} catch (e) {
				// 天气查询失败不影响主流程
			}
		},
		// 基于定位判断上班/下班 tab
		// d1 = 定位到上班路线起点（路线一/二起点）的最小距离
		// d2 = 定位到上班路线途经点/终点的最小距离
		// d1 < d2 → 上班，d1 > d2 → 下班，相等 → null（走时间逻辑）
		autoTabByLocation(lnglat) {
			var self = this;
			function dist(a, b) {
				var dx = a[0] - b[0];
				var dy = a[1] - b[1];
				return dx * dx + dy * dy;
			}
			// d1: 定位到所有上班路线起点的最小距离
			var d1 = Infinity;
			GO_ROUTES.forEach(function (r) {
				var d = dist(lnglat, r.start.lnglat);
				if (d < d1) d1 = d;
			});
			// d2: 定位到所有上班路线途经点+终点的最小距离
			var d2 = Infinity;
			GO_ROUTES.forEach(function (r) {
				var dv = dist(lnglat, r.via.lnglat);
				if (dv < d2) d2 = dv;
				var de = dist(lnglat, r.end.lnglat);
				if (de < d2) d2 = de;
				if (r.via2) {
					var dv2 = dist(lnglat, r.via2.lnglat);
					if (dv2 < d2) d2 = dv2;
				}
			});
			if (d1 < d2) return 'go';
			if (d1 > d2) return 'back';
			return null; // 相等，走时间逻辑
		},
		// 手动触发定位（点击时间触发）
		manualLocate() {
			var self = this;
			if (self._locating) return;
			self._locating = true;
			self.locateStatus = '正在获取定位...';
			// 优先使用浏览器原生 geolocation（线上 HTTPS 环境必需，iOS Safari 兼容性好）
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					function (position) {
						self._locating = false;
						self.onLocateSuccess([position.coords.longitude, position.coords.latitude]);
					},
					function (err) {
						self._locating = false;
						var msg = err.message || '未知错误';
						if (err.code === 1) msg = '用户拒绝了定位权限';
						else if (err.code === 2) msg = '位置不可用';
						else if (err.code === 3) msg = '定位超时';
						self.locateStatus = '定位失败：' + msg;
						console.warn('[DailyCommute] 浏览器定位失败:', err.code, msg);
						// 降级到高德 Geolocation
						self.locateByAMap();
					},
					{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
				);
			} else {
				self._locating = false;
				self.locateByAMap();
			}
		},
		// 自动获取当前定位（页面初始化时调用）
		// 优先使用浏览器原生 geolocation（线上 HTTPS 环境必需），失败再降级高德 Geolocation
		locateCurrent() {
			var self = this;
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					function (position) {
						self.onLocateSuccess([position.coords.longitude, position.coords.latitude]);
					},
					function (err) {
						console.warn('[DailyCommute] 自动定位失败，降级高德:', err.code, err.message);
						self.locateByAMap();
					},
					{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
				);
			} else {
				self.locateByAMap();
			}
		},
		// 高德 Geolocation 定位（降级方案）
		locateByAMap() {
			var self = this;
			try {
				var geolocation = new self.AMap.Geolocation({
					enableHighAccuracy: true,
					timeout: 8000,
					showButton: false,
					showMarker: false,
					showCircle: false,
					zoomToAccuracy: false,
					panToLocation: false,
					noGeoLocation: false
				});
				geolocation.getCurrentPosition(function (status, result) {
					if (status === 'complete' && result && result.position) {
						self.onLocateSuccess([result.position.lng, result.position.lat]);
					}
				});
			} catch (e) {
				// 定位失败忽略，不影响主流程
			}
		},
		// 定位成功统一处理
		onLocateSuccess(lnglat) {
			var self = this;
			self.currentLnglat = lnglat;
			self.drawCurrentMarker();
			self.locateStatus = '定位成功';
			if (!self._initRefreshed) {
				self._tabByLocationDone = true;
				var newTab = self.autoTabByLocation(self.currentLnglat);
				if (newTab) {
					self.tab = newTab;
					self.theme = newTab;
					self.tabSource = 'location';
				} else {
					self.tab = autoTabByHour(new Date());
					self.theme = self.tab;
				}
				self._initRefreshed = true;
				self.refreshAll();
			}
		},
		// 恢复到整体路线视图（不缩放到定位点）
		restoreMapView() {
			var self = this;
			if (!self.map) return;
			var route = self.currentRoutes[self.currentRoute];
			if (route) {
				// 移动端边距小（40px），web 端稍大（80px），限制最大缩放 14 避免缩太小
				var pad = self.isMobile ? 40 : 80;
				var maxZoom = 14;
				setTimeout(function () {
					try {
						// 临时移除定位点，fitView 后再加回，避免定位点拉大视野
						var locMarker = null;
						for (var i = 0; i < self.markers.length; i++) {
							if (self.markers[i]._isLoc) { locMarker = self.markers[i]; break; }
						}
						if (locMarker) self.map.remove([locMarker]);
						self.map.setFitView(null, true, [pad, pad, pad, pad], maxZoom);
						if (locMarker) locMarker.setMap(self.map);
					} catch (e) { }
				}, 100);
			}
		},
		// 清除地图标注
		clearMarkers() {
			var self = this;
			if (self.markers.length && self.map) {
				self.map.remove(self.markers);
			}
			self.markers = [];
		},
		// 绘制当前定位点
		drawCurrentMarker() {
			var self = this;
			if (!self.currentLnglat || !self.AMap || !self.map) return;
			var marker = new self.AMap.Marker({
				position: self.currentLnglat,
				content: '<div style="width:16px;height:16px;border-radius:50%;background:#0091ea;border:3px solid #fff;box-shadow:0 0 8px rgba(0,145,234,0.6);"></div>',
				offset: new self.AMap.Pixel(-8, -8),
				zIndex: 200
			});
			marker._isLoc = true; // 标记为定位点，便于 fitView 时排除
			marker.setMap(self.map);
			self.markers.push(marker);
		},
		// 绘制起点/途经/终点标注 + 区段耗时标签
		drawMarkers(route, searchResult) {
			var self = this;
			self.clearMarkers();
			if (!self.AMap || !self.map) return;
			// 重新画当前定位（clearMarkers 清掉了）
			self.drawCurrentMarker();

			// 起讫点标注（带标签名）
			var startMarker = self.makePointMarker(route.start.lnglat, '起', route.start.name, '#42b983');
			var viaMarker = self.makePointMarker(route.via.lnglat, '途', route.via.name, '#f5c542');
			var endMarker = self.makePointMarker(route.end.lnglat, '终', route.end.name, '#ef6b5a');
			startMarker.setMap(self.map);
			viaMarker.setMap(self.map);
			endMarker.setMap(self.map);
			self.markers.push(startMarker, viaMarker, endMarker);
			// 第二途经点标注（如有）
			if (route.via2) {
				var via2Marker = self.makePointMarker(route.via2.lnglat, '途', route.via2.name, '#f5c542');
				via2Marker.setMap(self.map);
				self.markers.push(via2Marker);
			}

			// 区段耗时标签：动态分段，根据途经点数量决定段数
			// 构建路径点序列：起点 → 途经1 → 途经2(如有) → 终点
			if (searchResult && searchResult.routes && searchResult.routes[0]) {
				var viaNames = self.getViaNames(route);
				var wps = self.getWaypoints(route);
				// 所有点：起点 + 途经点们 + 终点
				var allPoints = [{ lnglat: route.start.lnglat, name: route.start.name }];
				for (var wi = 0; wi < wps.length; wi++) {
					allPoints.push({ lnglat: wps[wi], name: viaNames[wi] });
				}
				allPoints.push({ lnglat: route.end.lnglat, name: route.end.name });

				// 为每段（相邻两点间）创建耗时标签 + 规划
				var segLabels = [];
				var segDone = 0;
				var totalSegs = allPoints.length - 1;
				function onSegDone() {
					segDone++;
					if (segDone >= totalSegs) {
						self.restoreMapView();
					}
				}
				for (var si = 0; si < totalSegs; si++) {
					var p1 = allPoints[si];
					var p2 = allPoints[si + 1];
					var mid = self.midLnglat(p1.lnglat, p2.lnglat);
					var lab = self.makeTimeLabel(mid, '计算中...');
					lab.setMap(self.map);
					self.markers.push(lab);
					segLabels.push(lab);
					// 闭包保存段索引
					(function (idx, labRef, p1Ref, p2Ref) {
						self.planSegmentDuration(p1Ref.lnglat, p2Ref.lnglat, function (dur) {
							labRef.setContent(self.makeTimeLabelContent(fmtDuration(dur) + ' → ' + p2Ref.name));
							// 更新 segDurations 数组对应段的实际耗时
							if (self.currentRouteData && self.currentRouteData.segDurations && self.currentRouteData.segDurations[idx]) {
								var newSegs = self.currentRouteData.segDurations.slice();
								newSegs[idx] = Object.assign({}, newSegs[idx], { durationText: fmtDuration(dur) });
								self.$set(self.routeResults, self.currentRoute, Object.assign({}, self.currentRouteData, { segDurations: newSegs }));
							}
							onSegDone();
						});
					})(si, lab, p1, p2);
				}
			}
		},
		// 规划单段路线，返回实际耗时（秒），用无 map 的 segDriving 不画图
		planSegmentDuration(start, end, callback) {
			var self = this;
			if (!self.segDriving) {
				callback(0);
				return;
			}
			try {
				enqueueAMapTask(function (done) {
					self.segDriving.search(start, end, function (status, result) {
						done();
						if (status === 'complete' && result && result.routes && result.routes.length) {
							callback(result.routes[0].time || 0);
						} else {
							callback(0);
						}
					});
				});
			} catch (e) {
				callback(0);
			}
		},
		// 生成耗时标签的 content HTML（供 setContent 更新用）
		makeTimeLabelContent(text) {
			return '<div style="transform:translate(-50%,-50%);background:rgba(44,62,80,0.85);color:#fff;font-size:11px;padding:3px 8px;border-radius:8px;white-space:nowrap;">' + text + '</div>';
		},
		// 两点中点
		midLnglat(a, b) {
			return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
		},
		// 创建带文字的点标注：用 offset 精准对齐（anchor 在图标底部中心）
		makePointMarker(lnglat, tag, name, color) {
			var self = this;
			var content = '<div style="display:flex;align-items:center;gap:4px;">'
				+ '<div style="min-width:24px;height:24px;line-height:24px;text-align:center;border-radius:12px 12px 12px 0;background:' + color + ';color:#fff;font-size:12px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.25);">' + tag + '</div>'
				+ '<div style="background:rgba(255,255,255,0.95);padding:2px 8px;border-radius:8px;font-size:11px;color:#2c3e50;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);">' + name + '</div>'
				+ '</div>';
			return new self.AMap.Marker({
				position: lnglat,
				content: content,
				// offset 让标注点（图标底部尖端）对准 lnglat：x=-12（图标宽24居中），y=-24（图标高24上移）
				offset: new self.AMap.Pixel(-12, -24),
				zIndex: 150
			});
		},
		// 创建耗时文本标签
		makeTimeLabel(lnglat, text) {
			var self = this;
			var content = '<div style="transform:translate(-50%,-50%);background:rgba(44,62,80,0.85);color:#fff;font-size:11px;padding:3px 8px;border-radius:8px;white-space:nowrap;">' + text + '</div>';
			return new self.AMap.Marker({
				position: lnglat,
				content: content,
				offset: new self.AMap.Pixel(0, 0),
				zIndex: 140
			});
		},
		switchTab(tab) {
			if (this.tab === tab) return;
			this.tab = tab;
			this.theme = tab;
			this.tabSource = 'time'; // 手动切换标记为时间逻辑
			this.currentRoute = 0;
			this.refreshAll();
		},
		switchRoute(i) {
			this.currentRoute = i;
			this.drawCurrentRoute();
			// 移动端：切换路线后关闭底部弹窗，回到地图视图
			this.sheetExpanded = false;
		},
		openNav() {
			// 先弹出确认框，避免误触直接跳转
			var r = this.currentRouteData;
			if (!r || !r.startLnglat || !r.endLnglat) return;
			this.navConfirmShow = true;
		},
		confirmNav() {
			this.navConfirmShow = false;
			var r = this.currentRouteData;
			if (!r || !r.startLnglat || !r.endLnglat) return;
			var s = r.startLnglat;
			var e = r.endLnglat;
			var route = this.currentRoutes[this.currentRoute];
			// 构建途经点参数（支持多个）
			var viaParts = [];
			var wps = this.getWaypoints(route);
			var viaNames = this.getViaNames(route);
			for (var i = 0; i < wps.length; i++) {
				viaParts.push(wps[i][0] + ',' + wps[i][1] + ',' + encodeURIComponent(viaNames[i]));
			}
			var viaStr = viaParts.join('|');
			// 高德网页版导航 URI（callnative=1 会尝试唤起 App）
			var url = 'https://uri.amap.com/navigation?to=' + e[0] + ',' + e[1] + ',' + encodeURIComponent(r.endName)
				+ '&from=' + s[0] + ',' + s[1] + ',' + encodeURIComponent(r.startName)
				+ '&via=' + viaStr
				+ '&mode=car&coordinate=gcj02&callnative=1';
			// web 端和移动端统一用网页版导航
			window.open(url, '_blank');
		},
		cancelNav() {
			this.navConfirmShow = false;
		},
		arriveText(delaySec) {
			var arrive = new Date(this.now.getTime() + delaySec * 1000);
			return formatTime(arrive);
		},
		remainText(delaySec) {
			var arrive = new Date(this.now.getTime() + delaySec * 1000);
			// 按时段确定目标9点：9~18点用今日9点（已过，判断迟到），其余用次日9点
			var h = this.now.getHours();
			var deadline;
			if (h >= 9 && h < 18) {
				// 9~18点：目标今日9点（已过），现在出发+耗时若晚于9点=迟到
				deadline = new Date(this.now);
				deadline.setHours(9, 0, 0, 0);
			} else {
				// 9点前用今日9点，18点后用次日9点
				deadline = new Date(this.now);
				deadline.setHours(9, 0, 0, 0);
				if (h >= 18) {
					deadline.setDate(deadline.getDate() + 1);
				}
			}
			var diff = Math.floor((deadline - arrive) / 1000);
			if (diff <= 0) return '已迟到 ' + fmtDuration(-diff);
			return fmtDuration(diff);
		},
		todayAt(h, m) {
			var d = new Date(this.now);
			d.setHours(h, m, 0, 0);
			return d;
		},
		// ===== 自动刷新 =====
		startAutoRefresh() {
			this.stopAutoRefresh();
			if (this.refreshInterval > 0) {
				var self = this;
				this.autoRefreshTimer = setInterval(function () {
					self.refreshAll();
				}, this.refreshInterval * 1000);
			}
		},
		stopAutoRefresh() {
			if (this.autoRefreshTimer) {
				clearInterval(this.autoRefreshTimer);
				this.autoRefreshTimer = null;
			}
		},
		onIntervalChange(val) {
			this.refreshInterval = val;
			this.startAutoRefresh();
		},
		formatInterval(seconds) {
			if (seconds >= 60) {
				var minutes = Math.floor(seconds / 60);
				var secs = seconds % 60;
				return secs > 0 ? minutes + '分' + secs + '秒' : minutes + '分钟';
			}
			return seconds + '秒';
		},
		// 记录最后刷新时间
		markRefreshTime() {
			var d = new Date();
			var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
			this.lastRefreshTime = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
				+ ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
		},
		// web 端切换面板收起
		togglePanel() {
			this.panelCollapsed = !this.panelCollapsed;
			// 面板展开时天气直接显示
			if (!this.panelCollapsed) {
				this.weatherFloatOpen = false;
			}
		}
	}
};
</script>

<style lang="less" scoped>
.daily {
	width: 100%;
	height: 100%;
	position: relative;
	background: #f5f9f7;
	overflow: hidden;
	.ban-user-select();

	&.theme-go {
		--accent: #42b983; // 上班：小清新绿
	}

	&.theme-back {
		--accent: #f5c542; // 下班：小清新黄
	}
}

#daily-map-container {
	width: 100%;
	height: 100%;
}

.map-loading {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: rgba(255, 255, 255, 0.9);
	padding: 8px 16px;
	border-radius: 8px;
	font-size: 13px;
	color: #2c3e50;
	z-index: 10;
}

/* 加载占位 */
.loading-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px 16px;
	gap: 14px;

	.lp-spinner {
		width: 36px;
		height: 36px;
		border: 3px solid rgba(66, 185, 131, 0.15);
		border-top-color: var(--accent, #42b983);
		border-radius: 50%;
		animation: lp-spin 0.8s linear infinite;
	}

	.lp-text {
		font-size: 13px;
		color: #bababa;
	}
}

@keyframes lp-spin {
	to {
		transform: rotate(360deg);
	}
}

.d-error {
	margin: 10px 16px;
	padding: 10px 14px;
	border-radius: 8px;
	background: #fff5f5;
	color: #c0392b;
	font-size: 13px;
}

.d-foot {
	text-align: center;
	font-size: 11px;
	color: #bababa;
	padding: 16px;
}

.nav-btn {
	position: absolute;
	right: 16px;
	bottom: 16px;
	padding: 9px 16px;
	border-radius: 18px;
	background: var(--accent, #42b983);
	color: #fff;
	font-size: 13px;
	font-weight: bold;
	cursor: pointer;
	box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
	transition: all 0.2s ease;
	z-index: 10;

	&:hover {
		transform: translateY(-2px);
	}
}

/* ===== Web 端：左右分栏 ===== */
.web-side {
	width: 420px;
	height: 100%;
	flex-shrink: 0;
	background: #fff;
	border-right: 1px solid rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: relative;
	z-index: 5;
	transition: width 0.3s ease;

	// 悬浮面板设计：收起时变窄，只显示贴边胶囊
	&.collapsed {
		width: 40px;
		overflow: visible; // 允许贴边胶囊超出
	}

	.web-side-inner {
		width: 420px;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.web-side-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	// 收起状态：贴边的竖向小胶囊
	.web-edge-bar {
		position: absolute;
		top: 50%;
		right: -14px;
		transform: translateY(-50%);
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 6px 4px;
		background: #fff;
		border: 1px solid var(--accent, #42b983);
		border-radius: 12px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);

		.edge-item {
			width: 24px;
			height: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 6px;
			cursor: pointer;
			color: var(--accent, #42b983);
			transition: all 0.2s ease;

			&:hover {
				background: rgba(66, 185, 131, 0.12);
			}

			&.active {
				background: var(--accent, #42b983);
				color: #fff;
			}

			// SVG 刷新图标旋转动画
			.spinning {
				animation: spin 1s linear infinite;
				transform-origin: center;
			}
		}

		.edge-divider {
			width: 16px;
			height: 1px;
			background: rgba(0, 0, 0, 0.08);
		}
	}
}

// web 端头部
.web-header {
	padding: 14px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	position: relative;

	.web-header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.web-header-left {
		.web-title {
			font-size: 18px;
			font-weight: bold;
			color: #2c3e50;
			display: flex;
			align-items: center;
			gap: 6px;

			.web-title-icon {
				font-size: 18px;
				line-height: 1;
				position: relative;
				top: -2px;
			}
		}

		.web-now {
			font-size: 13px;
			color: var(--accent, #42b983);
			margin-top: 2px;
			font-family: 'Courier New', monospace;
			font-weight: bold;
			cursor: pointer;
			transition: opacity 0.2s ease;

			&:hover {
				opacity: 0.7;
			}
		}
	}

	// 自动刷新指示胶囊
	.web-auto-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		border-radius: 14px;
		background: rgba(0, 0, 0, 0.05);
		cursor: pointer;
		transition: all 0.25s ease;

		&:hover {
			background: rgba(66, 185, 131, 0.1);
		}

		&.on {
			background: rgba(66, 185, 131, 0.12);
		}

		.pill-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: #bababa;
			transition: background 0.25s ease;
		}

		&.on .pill-dot {
			background: var(--accent, #42b983);
			box-shadow: 0 0 6px rgba(66, 185, 131, 0.6);
			animation: pill-breathe 2s ease-in-out infinite;
		}

		// 刷新中：加快呼吸节奏
		.pill-dot.spinning {
			animation: pill-breathe 0.8s ease-in-out infinite;
		}

		.pill-text {
			font-size: 12px;
			color: #2c3e50;
			font-weight: bold;
			white-space: nowrap;
		}
	}

	@keyframes pill-breathe {

		0%,
		100% {
			transform: scale(1);
			opacity: 1;
			box-shadow: 0 0 4px rgba(66, 185, 131, 0.4);
		}

		50% {
			transform: scale(1.3);
			opacity: 0.7;
			box-shadow: 0 0 8px rgba(66, 185, 131, 0.8);
		}
	}

	// 头部底排：刷新按钮 + 最后刷新时间 + 收起
	.web-header-bottom {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 12px;
	}

	.web-refresh-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 6px 14px;
		border-radius: 16px;
		background: var(--accent, #42b983);
		color: #fff;
		font-size: 13px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);

		.web-refresh-icon {
			display: inline-block;
		}

		&.loading .web-refresh-icon {
			animation: spin 1s linear infinite;
		}

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
		}
	}

	.web-last-time {
		flex: 1;
		font-size: 11px;
		color: #bababa;
	}

	.web-collapse-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 10px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.04);
		font-size: 12px;
		color: #2c3e50;
		cursor: pointer;
		transition: all 0.2s ease;

		.collapse-arrow {
			font-size: 14px;
		}

		&:hover {
			background: rgba(66, 185, 131, 0.1);
			color: var(--accent, #42b983);
		}
	}
}

// web 端定时刷新设置弹层
.web-config-pop {
	position: absolute;
	top: 56px;
	right: 16px;
	width: 240px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.1);
	border-radius: 10px;
	padding: 14px;
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
	z-index: 20;

	.cfg-title {
		font-size: 14px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 12px;
	}

	.cfg-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;

		.cfg-label {
			font-size: 13px;
			color: #606266;
		}

		.cfg-select {
			height: 28px;
			border: 1px solid rgba(0, 0, 0, 0.15);
			border-radius: 6px;
			font-size: 12px;
			padding: 0 6px;
		}
	}

	.cfg-status {
		font-size: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 8px;
	}

	.cfg-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;

		&.active {
			background: #42b983;
			box-shadow: 0 0 4px rgba(66, 185, 131, 0.6);
		}

		&.inactive {
			background: #bababa;
		}
	}

	.cfg-desc {
		font-size: 11px;
		color: #bababa;
		padding-top: 8px;
		border-top: 1px solid #f0f0f0;
	}
}

.web-map {
	flex: 1;
	height: 100%;
	position: relative;
}

// web 端天气浮动卡片（地图右上角）
.web-weather-float {
	position: absolute;
	top: 16px;
	right: 16px;
	z-index: 10;
	width: 200px;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 12px;
	padding: 12px 14px;
	box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);

	.wwf-main {
		display: flex;
		align-items: center;
		gap: 10px;

		.wwf-temp {
			font-size: 30px;
			font-weight: bold;
			color: var(--accent, #42b983);
			font-family: 'Courier New', monospace;
			line-height: 1;
		}

		.wwf-info {
			.wwf-city {
				font-size: 13px;
				font-weight: bold;
				color: #2c3e50;
			}

			.wwf-desc {
				font-size: 11px;
				color: #bababa;
				margin-top: 2px;
			}
		}
	}

	.wwf-fc {
		flex: 1;
		text-align: center;
		animation: wwf-in 0.4s ease backwards;

		.wwf-fc-date {
			display: block;
			font-size: 10px;
			color: #bababa;
		}

		.wwf-fc-w {
			display: block;
			font-size: 10px;
			color: #2c3e50;
			margin: 2px 0;
		}

		.wwf-fc-t {
			display: block;
			font-size: 9px;
			color: var(--accent, #42b983);
			font-weight: bold;
		}
	}

	.wwf-forecast {
		display: flex;
		gap: 4px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed rgba(0, 0, 0, 0.06);
	}
}

@keyframes wwf-in {
	from {
		opacity: 0;
		transform: translateY(6px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.daily:not(.is-mobile) {
	display: flex;
	flex-direction: row;
}

/* ===== 移动端：全屏地图 + 浮层 ===== */
.daily.is-mobile {
	.m-map {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.m-top {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 5;
		padding: 10px 12px;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
		pointer-events: auto;

		.m-top-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;

			// 左侧占位（与右侧等宽，保证 tab 严格居中）
			.m-top-left {
				flex: 1;
				display: flex;
				align-items: center;
			}

			.m-now {
				font-size: 14px;
				font-weight: bold;
				color: #2c3e50;
				font-family: 'Courier New', monospace;
				cursor: pointer;
				transition: opacity 0.2s ease;

				&:active {
					opacity: 0.7;
				}
			}

			// 中间 tab
			.m-tabs-mini {
				display: inline-flex;
				background: rgba(0, 0, 0, 0.06);
				border-radius: 16px;
				padding: 2px;
				flex-shrink: 0;

				.m-tab-mini {
					padding: 5px 14px;
					font-size: 13px;
					color: #2c3e50;
					border-radius: 14px;
					cursor: pointer;

					&.active {
						background: var(--accent, #42b983);
						color: #fff;
						font-weight: bold;
					}
				}
			}

			// 右侧操作按钮（flex:1 与左侧对称，保证 tab 居中）
			.m-top-actions {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: flex-end;
				gap: 10px;
			}

			// 统一 SVG 按钮样式
			.m-icon-btn {
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 8px;
				color: var(--accent, #42b983);
				cursor: pointer;
				transition: all 0.2s ease;

				&:hover {
					background: rgba(66, 185, 131, 0.1);
				}

				&.loading svg {
					animation: spin 1s linear infinite;
				}
			}
		}

		.m-countdown {
			margin-top: 8px;
			display: inline-flex;
			align-items: baseline;
			gap: 8px;
			padding: 6px 14px;
			border-radius: 16px;
			background: var(--accent, #42b983);
			color: #fff;
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);

			.m-cd-label {
				font-size: 12px;
				opacity: 0.9;
			}

			.m-cd-time {
				font-size: 18px;
				font-weight: bold;
				font-family: 'Courier New', monospace;

				&.urgent {
					color: #fff3cd;
				}
			}

			// 迟到状态：红色微动呼吸（与 web 端一致）
			&.late {
				background: linear-gradient(135deg, #ef6b5a, #f08a7a);
				box-shadow: 0 3px 10px rgba(239, 107, 90, 0.4);
				animation: m-pulse 1.2s infinite;

				.m-cd-time {
					color: #fff;
				}
			}
		}
	}

	@keyframes m-pulse {

		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.7;
		}
	}

	.m-nav-btn {
		position: absolute;
		right: 12px;
		bottom: 96px;
		z-index: 6;
		padding: 8px 14px;
		border-radius: 18px;
		background: var(--accent, #42b983);
		color: #fff;
		font-size: 13px;
		font-weight: bold;
		cursor: pointer;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
	}

	.m-sheet {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 6;
		background: #fff;
		border-radius: 16px 16px 0 0;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
		max-height: 75%;
		display: flex;
		flex-direction: column;
		transform: translateY(calc(100% - 56px));
		transition: transform 0.3s ease;

		&.expanded {
			transform: translateY(0);
		}

		.m-sheet-handle {
			flex-shrink: 0;
			padding: 10px 16px 10px 16px;
			cursor: pointer;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			border-bottom: 1px solid rgba(0, 0, 0, 0.04);

			.handle-bar {
				width: 36px;
				height: 4px;
				border-radius: 2px;
				background: #d4d4d4;
			}

			.handle-info {
				text-align: center;
				width: 100%;

				.handle-title {
					font-size: 13px;
					font-weight: bold;
					color: #2c3e50;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;

					.handle-sep {
						color: #d4d4d4;
						margin: 0 4px;
						font-weight: normal;
					}

					.handle-dur {
						color: var(--accent, #42b983);
					}

					.handle-cong {
						&.cong-smooth {
							color: #42b983;
						}

						&.cong-slow {
							color: #f5c542;
						}

						&.cong-jam {
							color: #ef8e81;
						}

						&.cong-bad {
							color: #ef6b5a;
						}

						&.cong-unknown {
							color: #bababa;
						}
					}
				}
			}
		}

		.m-sheet-body {
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
			padding-bottom: 12px;
		}
	}
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}

/* 移动端定时刷新设置弹层 */
.m-cfg-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: flex-end;
}

.m-cfg-sheet {
	width: 100%;
	background: #fff;
	border-radius: 16px 16px 0 0;
	padding: 20px 16px 16px 16px;
	animation: sheet-up 0.3s ease;

	.m-cfg-title {
		font-size: 16px;
		font-weight: bold;
		color: #2c3e50;
		text-align: center;
		margin-bottom: 16px;
	}

	.m-cfg-opts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 14px;
	}

	.m-cfg-opt {
		padding: 10px 4px;
		text-align: center;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		font-size: 13px;
		color: #2c3e50;
		cursor: pointer;
		transition: all 0.2s ease;

		&.active {
			background: var(--accent, #42b983);
			color: #fff;
			border-color: var(--accent, #42b983);
			font-weight: bold;
		}
	}

	.m-cfg-status {
		font-size: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: center;
		margin-bottom: 12px;
		color: #2c3e50;

		.cfg-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			display: inline-block;

			&.active {
				background: #42b983;
			}

			&.inactive {
				background: #bababa;
			}
		}
	}

	.m-cfg-close {
		text-align: center;
		padding: 10px;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.05);
		font-size: 14px;
		color: #2c3e50;
		cursor: pointer;
	}
}

@keyframes sheet-up {
	from {
		transform: translateY(100%);
	}

	to {
		transform: translateY(0);
	}
}

/* 导航确认弹窗 */
.nav-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
}

.nav-modal {
	width: 300px;
	max-width: calc(~'100% - 48px');
	background: #fff;
	border-radius: 16px;
	padding: 24px 20px 16px 20px;
	text-align: center;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
	animation: modal-in 0.25s ease;

	.nav-modal-icon {
		font-size: 40px;
		margin-bottom: 10px;
	}

	.nav-modal-title {
		font-size: 17px;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 8px;
	}

	.nav-modal-desc {
		font-size: 12px;
		color: #2c3e50;
		line-height: 1.5;
		margin-bottom: 6px;
		padding: 0 4px;
	}

	.nav-modal-tip {
		font-size: 11px;
		color: #bababa;
		margin-bottom: 16px;
	}

	.nav-modal-btns {
		display: flex;
		gap: 10px;

		.nav-modal-btn {
			flex: 1;
			padding: 10px 0;
			border-radius: 10px;
			font-size: 14px;
			font-weight: bold;
			cursor: pointer;
			transition: all 0.2s ease;

			&.cancel {
				background: rgba(0, 0, 0, 0.05);
				color: #2c3e50;
			}

			&.confirm {
				background: var(--accent, #42b983);
				color: #fff;
			}

			&:active {
				transform: scale(0.97);
			}
		}
	}
}

@keyframes modal-in {
	from {
		opacity: 0;
		transform: scale(0.9) translateY(10px);
	}

	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.nav-fade-enter-active,
.nav-fade-leave-active {
	transition: opacity 0.25s ease;
}

.nav-fade-enter,
.nav-fade-leave-to {
	opacity: 0;
}
</style>
