<template>
    <div class="area-control">
        <p style="font-size: 16px;font-weight:bold;margin:0.2rem">范围选择</p>
        <div style="margin-top:1rem;margin-left: 1rem;">
            <p style="font-weight: 600;">选择网点</p>
        </div>
        <div class="net-select" v-if="netSelectorStore.selectedNet">
            <component :is="postIcon" style="width:10rem;height:10rem"></component>
            <div>
                <div style="display: flex;">
                    <p>{{ netSelectorStore.selectedNet.name }}</p>
                </div>
                <div style="display: flex;">
                    <p>{{ netSelectorStore.selectedNet.address }}</p>
                </div>
            </div>
        </div>

        <div style="margin-top:1rem;margin-left: 1rem;">
            <p style="font-weight: 600;">选择网点周边范围与网格大小</p>
        </div>

        <div class="area-select">
            <div>
                <svg style="width:120;height: 120;">
                    <rect x="10" y="10" width="100" height="100" fill="#F4F4F4" stroke="#737373" stroke-dasharray="10" />
                    <text x="60" y="50" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="black">
                        边长：{{ (length/1000).toFixed(1) }}km
                    </text>
                    <text x="60" y="70" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="black">
                        面积：{{ (length * length / 1000000).toFixed(2)}}km²
                    </text>
                </svg>
                <div class="sliderRange">
                    <el-slider v-model="length" :min="min" :max="max" :step="100":formatter="formatValue"></el-slider>
                </div>
            </div>

            <div>
                <svg width="120" height="120">
                    <rect x="10" y="10" width="100" height="100" fill="#F4F4F4" stroke="#737373" stroke-dasharray="10" />
                    <!-- 水平线 -->
                    <line x1="10" y1="30" x2="110" y2="30" stroke="#737373" stroke-dasharray="4" />
                    <line x1="10" y1="50" x2="110" y2="50" stroke="#737373" stroke-dasharray="4" />
                    <line x1="10" y1="70" x2="110" y2="70" stroke="#737373" stroke-dasharray="4" />
                    <line x1="10" y1="90" x2="110" y2="90" stroke="#737373" stroke-dasharray="4" />
                    <!-- 垂直线 -->
                    <line x1="30" y1="10" x2="30" y2="110" stroke="#737373" stroke-dasharray="4" />
                    <line x1="50" y1="10" x2="50" y2="110" stroke="#737373" stroke-dasharray="4" />
                    <line x1="70" y1="10" x2="70" y2="110" stroke="#737373" stroke-dasharray="4" />
                    <line x1="90" y1="10" x2="90" y2="110" stroke="#737373" stroke-dasharray="4" />
                    <text x="60" y="50" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="black">
                        边长：{{ (gridLength/1000).toFixed(1) }}km
                    </text>
                    <text x="60" y="70" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="black">
                        面积：{{ (gridLength * gridLength / 1000000).toFixed(2)}}km²
                    </text>
                </svg>
                <div class="sliderRange">
                    <el-slider v-model="gridLength" :min="gridMin" :max="gridMax" :step="100" :formatter="formatValue"></el-slider>
                </div>
            </div>

        </div>
    </div>
    <div class="filter-control">
        <p style="font-size: 16px;font-weight:bold;margin:0.2rem">筛选</p>

        <!-- 位置 -->
        <div class="m-6">  
            <p style="font-size: 16px;font-weight:bold;margin:0.2rem">地理位置</p>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">  
                <!-- 市 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">市</label>  
                    <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">  
                        <option>成都市</option>  
                        <option>绵阳市</option>  
                        <option>江油市</option>  
                    </select>  
                </div>  
                <!-- 区县 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">区县</label>  
                    <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">  
                        <option>武侯区</option>  
                        <option>锦江区</option>  
                        <option>双流区</option>  
                    </select>  
                </div>  
                <!-- 网点 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">网点</label>  
                    <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">  
                        <option>网点A</option>  
                        <option>网点B</option>  
                        <option>网点C</option>  
                    </select>  
                </div>  
                <!-- 网格类型 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">网格类型评分</label>  
                    <div class="flex gap-2 mt-1">  
                        <input type="number" placeholder="最小值" class="w-1/2 rounded-md border-gray-300 shadow-sm">  
                        <input type="number" placeholder="最大值" class="w-1/2 rounded-md border-gray-300 shadow-sm">  
                    </div>  
                </div>  
            </div>  
        </div>  

        <!-- 邮政业务相关 -->  
        <div class="m-6">  
            <p style="font-size: 16px;font-weight:bold;margin:0.2rem">邮政业务相关</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">  
                <!-- 客户类型 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">客户类型</label>  
                    <div class="mt-1 flex space-x-4">  
                        <button class="px-4 py-2 bg-blue-500 text-white rounded-md">邮政客户</button>  
                        <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">非邮政客户</button>  
                    </div>  
                </div>  
                <!-- 加办邮政业务 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">加办业务</label>  
                    <div class="mt-1 flex flex-wrap gap-4">  
                        <label class="inline-flex items-center">  
                            <input type="checkbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded">  
                            <span class="ml-2">定期</span>  
                        </label>  
                        <label class="inline-flex items-center">  
                            <input type="checkbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded">  
                            <span class="ml-2">理财</span>  
                        </label>  
                        <label class="inline-flex items-center">  
                            <input type="checkbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded">  
                            <span class="ml-2">基金</span>  
                        </label>  
                        <label class="inline-flex items-center">  
                            <input type="checkbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded">  
                            <span class="ml-2">保险</span>  
                        </label>  
                        <label class="inline-flex items-center">  
                            <input type="checkbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded">  
                            <span class="ml-2">信用卡</span>  
                        </label>  
                    </div>  
                </div>  
            </div>  
        </div>  

        <!-- 其他筛选 -->  
        <div class="m-60">  
            <p style="font-size: 16px;font-weight:bold;margin:0.2rem">其他</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">  
                <!-- 行业 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">行业</label>  
                    <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">  
                        <option>零售</option>  
                        <option>餐饮</option>  
                        <option>批发</option>  
                        <option>超市</option>  
                        <option>医药</option>  
                        <option>娱乐</option>  
                        <option>宾馆住宿</option>  
                        <option>教育</option>  
                        <option>房地产</option>  
                        <option>汽车销售及服务</option>  
                        <option>事业及政府机构</option>  
                        <option>银行</option>  
                        <option>物流</option>  
                        <option>其他</option>  
                    </select>  
                </div>  
                <!-- 注册时间区间 -->  
                <div class="col-span-2">  
                    <label class="block text-sm font-medium text-gray-700">注册时间</label>  
                    <div class="mt-1 flex gap-4">  
                        <div class="flex-1">  
                            <input type="date" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="开始日期">  
                        </div>  
                        <span class="self-center text-gray-400">至</span>  
                        <div class="flex-1">  
                            <input type="date" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="结束日期">  
                        </div>  
                    </div>  
                </div>  
                <!-- 法人信息 -->  
                <div>  
                    <label class="block text-sm font-medium text-gray-700">法人信息</label>  
                    <input type="text" placeholder="输入法人信息" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">  
                </div>  
            </div>  
        </div>  

        <!-- 操作按钮 -->  
        <div class="flex justify-end gap-4">  
            <button class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md">重置</button>  
            <button class="px-6 py-2 bg-blue-500 text-white rounded-md">立即筛选</button>  
        </div> 

    </div>
</template>

<script setup>
import { ref , watch} from 'vue';
import {useNetSelectorStore} from '@/store/netSelector'
import postIcon from '../../src/assets/chinapost.svg'

const netSelectorStore = useNetSelectorStore();
const min = 1000;
const max = 10000;
const gridMin = 500;
const gridMax = 1000;

const length = ref(netSelectorStore.range);
const gridLength = ref(netSelectorStore.gridSize);
const formatValue = (value) => {
    console.log(value);
    return `${value}m`;
}

watch(length, (value) => {
    netSelectorStore.setRange(value);
    console.log(netSelectorStore.range);
})
watch(gridLength, (value) => {
    netSelectorStore.setGridSize(value);
    console.log(netSelectorStore.gridSize);
})
</script>

<style scoped>
.net-select{
    display: flex;
    margin: 0 auto;
    justify-content: center;
    align-items: center;
}
.area-select{
    width:90%;
    margin: 0 auto;
    display:flex;
    flex-direction:row;
    justify-content: space-evenly;
}
.sliderRange{
    width: 80%;
    margin: 0 auto;
}
.el-slider{
    --el-slider-main-bg-color: #98B9D5; /* 更改滑块主背景色 */
}

</style>