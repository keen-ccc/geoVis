<template>
    <div class="area-control">
        <p style="font-size: 16px;font-weight:bold;margin:0.2rem">范围选择</p>
        <div style="margin-top:1rem;margin-left: 1rem;">
            <p>请选择网点</p>
        </div>
        <div class="net-select" v-if="netSelectorStore.selectedNet">
            <component :is="postIcon" style="width:10rem;height:10rem"></component>
            <div>
                <div style="display: flex;">
                    <p>名称：</p>
                    <p>{{ netSelectorStore.selectedNet.name }}</p>
                </div>
                <div style="display: flex;">
                    <p>地址：</p>
                    <p>{{ netSelectorStore.selectedNet.address }}</p>
                </div>
            </div>
        </div>

        <div style="margin-top:1rem;margin-left: 1rem;">
            <p>请选择网点周边分析范围大小</p>
        </div>

        <div class="area-select">
            <svg style="width:120;height: 120;">
                <rect x="10" y="10" width="100" height="100" fill="#F4F4F4" stroke="black" stroke-dasharray="4" />
            </svg>
            <div>
                <div style="display: flex;">
                    <p>区域边长：</p>
                    <p>{{ (length/1000).toFixed(1) }}km</p>
                </div>
                <div style="display: flex;">
                    <p>区域面积：</p>
                    <p>{{ (length * length / 1000000).toFixed(1)}}km²</p>
                </div>
            </div>
        </div>
        <div class="sliderRange">
            <el-slider v-model="length" :min="min" :max="max" :step="100":formatter="formatValue"></el-slider>
        </div>
        <div style="margin-top:1rem;margin-left: 1rem;">
            <p>请选择生成网格大小</p>
        </div>

        <div class="area-select">
            <svg width="120" height="120">
                <rect x="10" y="10" width="100" height="100" fill="#F4F4F4" stroke="black" stroke-dasharray="4" />
                <!-- 水平线 -->
                <line x1="10" y1="30" x2="110" y2="30" stroke="black" stroke-dasharray="4" />
                <line x1="10" y1="50" x2="110" y2="50" stroke="black" stroke-dasharray="4" />
                <line x1="10" y1="70" x2="110" y2="70" stroke="black" stroke-dasharray="4" />
                <line x1="10" y1="90" x2="110" y2="90" stroke="black" stroke-dasharray="4" />
                <!-- 垂直线 -->
                <line x1="30" y1="10" x2="30" y2="110" stroke="black" stroke-dasharray="4" />
                <line x1="50" y1="10" x2="50" y2="110" stroke="black" stroke-dasharray="4" />
                <line x1="70" y1="10" x2="70" y2="110" stroke="black" stroke-dasharray="4" />
                <line x1="90" y1="10" x2="90" y2="110" stroke="black" stroke-dasharray="4" />
            </svg>
            <div>
                <div style="display: flex;">
                    <p>网格边长：</p>
                    <p>{{ (gridLength/1000).toFixed(1) }}km</p>
                </div>
                <div style="display: flex;">
                    <p>网格面积：</p>
                    <p>{{ (gridLength * gridLength / 1000000).toFixed(1)}}km²</p>
                </div>
            </div>
        </div>
        <div class="sliderRange">
            <el-slider v-model="gridLength" :min="gridMin" :max="gridMax" :step="100" :formatter="formatValue"></el-slider>
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
const gridMin = 300;
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
    width:80%;
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