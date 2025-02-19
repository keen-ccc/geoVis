<script setup>
import { ref,onMounted,watch} from 'vue'
import svgHolder from './svgHolder.vue'
import {useGridSelectorStore} from '@/store/gridSelector'
import {usePoiDetailStore} from '@/store/poiDetail'
import { storeToRefs } from 'pinia'

const poiData = ref([])
const poiFilter = ref(null)
const selection = ref('银行')
const gridStore = useGridSelectorStore()
const { bound } = storeToRefs(gridStore);

const poiStore = usePoiDetailStore()

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
    //console.log(params)
    const res = await fetch('http://localhost:5000/api/getPOIDetail',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(params)
    })
    const result = await res.json()
    poiData.value = result
    //console.log("poi data:",poiData.value)
    poiStore.setPoiData(result)
    //console.log("poi store data:",poiStore.poiData)
}

const exportTable = () => {
    const BOM = "\uFEFF";
    const headers = "名称,地址\n";
    const rows = poiData.value.map(d => `${d.name},${d.address}`).join("\n");
    console.log(rows);
    const csvContent = BOM + headers + rows;
    console.log(csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "poi_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    //console.log(value)
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
                <p style="font-weight: bold;">按行业查询：</p>
                <el-select v-model="selection" style="width: 65%;" @change="checkoutSelection">
                    <el-option v-for="option in options" :key="option.label" :value="option.value" :label="option.label" ></el-option>
                </el-select>
                <el-button color="#ecf5ff" type="primary" @click="exportTable" style="margin-left: 1rem">导出</el-button>
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
    margin-left: 0.5rem;

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