<script setup>
import { ref,onMounted,watch} from 'vue'
import svgHolder from './svgHolder.vue'
import {useGridSelectorStore} from '@/store/gridSelector'
import { storeToRefs } from 'pinia'

const poiData = ref([])
const poiFilter = ref(null)
const selection = ref('银行')
const gridStore = useGridSelectorStore()
const { bound } = storeToRefs(gridStore);

poiData.value = []
const fetchData = async(bound) => {
    //console.log("fetch poi data",bound)
    const params = {
        start_lon:bound.lonStart,
        start_lat:bound.latStart,
        end_lon:bound.lonEnd,
        end_lat:bound.latEnd,
        type:selection.value
    }
    console.log(params)
    const res = await fetch('http://localhost:5000/api/getPOIDetail',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(params)
    })
    const result = await res.json()
    poiData.value = result
    console.log("poi data:",poiData.value)
}

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

const checkoutSelection = (value) => {
    console.log(value)
    fetchData(bound.value)
}
watch(bound,(newBound)=>{
    fetchData(newBound)
})
</script>

<template>
    <div style="overflow: hidden;">
        <p style="font-size: 16px;font-weight:bold;margin:0.5rem">POI 目录</p>
        <div id="poiDetail">
            <div id="poiFilter">
                <p style="font-weight: bold;margin-right:1rem">按行业查询：</p>
                <el-select v-model="selection" style="width: 80%;" @change="checkoutSelection">
                    <el-option v-for="option in options" :key="option.label" :value="option.value" :label="option.label" ></el-option>
                </el-select>
            </div>
            <div id="poiTable">
                <ul>
                    <div id="singlePoi" v-for="poi in poiData" :key="poi.name">
                        <svgHolder :value="selection"></svgHolder>
                        <div id="singlePoiDetail">
                            <span>{{poi.name}}</span>
                            <p>{{poi.address}}</p>
                            <el-divider style="margin-top: -0.5rem;"></el-divider>
                        </div>
                    </div>
                </ul>
            </div>
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
    margin-left: 1rem;

}
#poiTable {
    height: 90%;
    width: 100%;
    overflow: hidden;
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
    flex-direction: column;

}
</style>