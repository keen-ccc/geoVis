import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
// import { createPinia } from 'pinia'
import * as Icons from '@element-plus/icons-vue'

const app = createApp(App);
for (let i in Icons) {
    app.component(i, Icons[i])
  }
app.use(createPinia());
app.use(ElementPlus);
app.mount('#app');

