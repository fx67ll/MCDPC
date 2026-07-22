import Vue from 'vue';
import App from '@/App.vue';
import router from '@/router/index.js';
import store from '@/store/index.js';

Vue.config.productionTip = false;

import less from 'less';
Vue.use(less);

import VueCodeMirror from 'vue-codemirror';
import 'codemirror/lib/codemirror.css';
Vue.use(VueCodeMirror);

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

// 全局注册统一的查看源码/文档入口组件，各 demo 直接使用 <view-source-btn code="XXX">
import ViewSourceBtn from '@/components/ViewSourceBtn.vue';
Vue.component('ViewSourceBtn', ViewSourceBtn);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
