<script setup>
import { ref,onMounted,watch, watchEffect, computed} from 'vue'
import svgHolder from './svgHolder.vue'
import {useGridSelectorStore} from '@/store/gridSelector'
import {usePoiDetailStore} from '@/store/poiDetail'
import { storeToRefs } from 'pinia'

const poiData = ref([])
const poiFilter = ref(null)
const selection = ref('银行')
const gridStore = useGridSelectorStore()
const poiStore = usePoiDetailStore()
const { num } = storeToRefs(gridStore)

//const num = computed(() => gridStore.num)

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
    // 更新表格数据poiData
    poiData.value.push(...result)
    //console.log("poi data:",poiData.value)
    //console.log("循环...")
    //poiStore.setPoiData(poiData.value)
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
        label:'购物',
        value:'购物'
    },
    {
        label:'医疗',
        value:'医疗'
    },
    {
        label:'科教文化',
        value:'科教文化'
    },
    {
        label:'住宿',
        value:'住宿'
    },
    {
        label:'政府机构',
        value:'政府机构'
    },
    {
        label:'娱乐',
        value:'娱乐'
    },
    {
        label:'汽车销售',
        value:'汽车销售'
    },
    {
        label:'汽车服务',
        value:'汽车服务'
    }
]

// const checkoutSelection = (value) => {
    
//     poiData.value = []
    
//     const grids = gridStore.grids;
//     console.log(grids.values());
//     ////console.log(grids);
//     for (let bound of grids.values()){
//         //console.log(bound)
//         fetchData(bound);
//     }


//     poiStore.setPoiData(poiData.value)
// }

// 组件中修改后的函数
const checkoutSelection = async (value) => {
  // 清空旧数据
  poiData.value = [];
  
  const grids = gridStore.grids;
  const promises = [];
  
  // 启动所有异步请求
  for (const bound of grids.values()) {
    promises.push(fetchData(bound));
  }
  
  // 等待所有请求完成
  await Promise.all(promises);
  
  // 响应式更新 Store
  poiStore.setPoiData([...poiData.value]);
};

watch(
    () => gridStore.num,
    async (newVal) => {
      // 清空旧数据（响应式安全）
      poiStore.setPoiData([]);
      poiData.value.splice(0, poiData.value.length);

      const grids = gridStore.grids;
      const promises = [];

      for (const bound of grids.values()) {
        promises.push(fetchData(bound));
      }

      // 等待所有数据加载完成
      await Promise.all(promises);

      // 更新 Store（使用深拷贝避免 Proxy 影响）
      poiStore.setPoiData(JSON.parse(JSON.stringify(poiData.value)));
      console.log("最终数据长度:", poiStore.poiIndustryData.length);
    }
)

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