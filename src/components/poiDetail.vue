<script setup>
import { ref,onMounted,watch} from 'vue'
import svgHolder from './svgHolder.vue'

const poiData = ref([])
const poiFilter = ref(null)
const selection = ref('银行')
poiData.value = [
    {
        name: 'POI1',
        address: 'address1',
    },
    {
        name: 'POI2',
        address: 'address2',
    },
    {
        name: 'POI3',
        address: 'address3',
    },
    {
        name: 'POI4',
        address: 'address4',
    },
    {
        name: 'POI5',
        address: 'address5',
    }
]

const options = [
    {
        label: '银行',
        value: '银行'
    },
    {
        label:'物流',
        value:'物流'
    },
    {
        label:'餐饮',
        value:'餐饮'
    },
    {
        label:'企业',
        value:'企业'
    },
    {
        label:'商场',
        value:'商场'
    }
]


</script>

<template>
    <p style="font-size: 16px;font-weight:bold;margin:0.5rem">POI 目录</p>
    <div id="poiDetail">
        <div id="poiFilter">
            <p>种类：</p>
            <el-select v-model="selection" style="width: 80%;">
                <el-option v-for="option in options" :key="option.label" :value="option.value" :label="option.label"></el-option>
            </el-select>
        </div>
        <div id="poiTable">
            <ul>
                <div id="singlePoi" v-for="poi in poiData" :key="poi.name">
                    <svgHolder :value="selection"></svgHolder>
                    <div id="singlePoiDetail">
                        <span>{{poi.name}}</span>
                        <p>{{poi.address}}</p>
                    </div>
                </div>
            </ul>
        </div>
    </div>
</template>

<style scoped>
#poiDetail{
    height:100%;
    width:100%;
}
#poiFilter{
    height:10%;
    width:100%;
    display: flex;
    align-items: center;
    flex-direction:row;
    justify-content: space-around;

}
#poiTable{
    height:90%;
    width:100%;
}
#singlePoi{
    height:5rem;
    width:100%;
    display: flex;
    align-items: center;
    margin: 0.5rem;
}
#singlePoiSvg{
    height:100%;
    width:10%;
    display: flex;
    align-items: center;
    justify-content: center;
}
#singlePoiDetail{
    height:100%;
    width:90%;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;
}
</style>