import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
// import { createPinia } from 'pinia'
import * as Icons from '@element-plus/icons-vue'
import './assets/main.css'

const app = createApp(App);
for (let i in Icons) {
    app.component(i, Icons[i])
  }
app.use(createPinia());
app.use(ElementPlus,{
    locale: zhCn,
});
app.mount('#app');

