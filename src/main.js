import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// import Echarts from 'vue-echarts'
// import * as echarts from 'echarts'

const app = createApp(App)
app.use(ElementPlus)
// 使用组件
// app.component('e-charts',Echarts)
// 全局挂载 echarts
// app.config.globalProperties.$echarts = echarts
app.mount('#app')
// createApp(App).mount('#app')
