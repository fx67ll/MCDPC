import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

// 修复路由重复报错
// 获取原型对象上的push函数
const originalPush = Router.prototype.push;
// 修改原型对象中的push方法
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err);
};

import store from '@/store/index.js';

export const fx67llRoutes = [
  {
    path: '/',
    name: 'index',
    component: () => import('@v/index.vue'), //首页
  },
  {
    path: '/doc',
    name: 'doc',
    component: () => import('@c/CodeDoc.vue'), // 用于展示文档
  },
  {
    path: '/code',
    name: 'code',
    component: () => import('@c/CodeMirror.vue'), // 用于展示源码
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('@v/CodeTest.vue'), // 代码测试页面
  },
  {
    path: '/daily',
    name: 'daily',
    component: () => import('@v/DailyCommute/index.vue'), // 每日通勤用时查看页
  },
  {
    path: '/devtest',
    name: 'devtest',
    component: () => import('@c/ComponentTest.vue'), // 本地编写组件时候使用的测试页面
  },
  {
    path: '/mapcanvas',
    name: 'mapcanvas',
    component: () => import('@v/Map/MapCanvas/MapCanvas.vue'), // 在高德地图上绘制canvas覆盖物
  },
  {
    path: '/splitarea',
    name: 'splitarea',
    component: () => import('@v/Map/SplitArea/SplitArea.vue'), // 行政区划逐级下钻 全国→省→市→区县
  },
  {
    path: '/heatmap',
    name: 'heatmap',
    component: () => import('@v/Map/HeatMapPoint/HeatMapPoint.vue'), // 24小时动态热力图
  },
  {
    path: '/flyline3d',
    name: 'flyline3d',
    component: () => import('@v/Map/FlyLine3D/FlyLine3D.vue'), // 3D飞线迁徙Demo
  },
  {
    path: '/glowwall3d',
    name: 'glowwall3d',
    component: () => import('@v/Map/GlowWall3D/GlowWall3D.vue'), // 3D立体发光围墙与雷达扫描Demo
  },
  {
    path: '/testnode',
    name: 'testnode',
    component: () => import('@v/Node/TestNode.vue'), // Nodejs 接口联调测试地址
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@v/404.vue'), //404
  },
  {
    path: '*', //不存在的地址则重定向页面地址
    redirect: '/404',
  },
];

const router = new Router({
  mode: 'history', // history模式，去掉url中的#
  scrollBehavior: () => ({
    y: 0,
  }),
  routes: fx67llRoutes,
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 生产环境禁用开发专用路由（/test、/devtest），重定向到首页
  const isProd = process.env.VUE_APP_ENV === 'production';
  if (isProd && (to.name === 'test' || to.name === 'devtest')) {
    next({ name: 'index' });
    return;
  }
  // 不显示返回按钮：首页 / 每日通勤（daily 为新页签独立页面，无需返回）
  if (to.name !== 'index' && to.name !== 'daily') {
    store.dispatch('setBtnStateAsync', true);
  } else {
    store.dispatch('setBtnStateAsync', false);
  }
  next(); // 必须使用 next ,执行效果依赖 next 方法的调用参数
});

export default router;
