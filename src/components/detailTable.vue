<template>
  <div class="container" style="max-height: 50%; width: 100%;">
    <div ref="fanDiagram" style="width: 300px; height: 250px; padding-bottom: 0;">

    </div>
    <el-button plain>导出</el-button>

    <el-table
      :data="tableData"
      style="width: 90%;"
      max-height="300"
      :row-class-name="tableRowClassName"
    >
      <el-table-column prop="date" label="Date" width="100" />
      <el-table-column prop="name" label="Name" width="100" />
      <el-table-column prop="address" label="Address" />
    </el-table>
  </div>
    
</template>

<script setup>
import * as echarts from 'echarts';
import { onMounted, ref, watch} from 'vue';
import { storeToRefs } from 'pinia'
import {useGridSelectorStore} from '@/store/gridSelector'

const fanDiagram = ref(null);
let chartInstance = null;
const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]

onMounted(()=>{
  const gridStore = useGridSelectorStore();
  // gridStore.selectGrid(d.geometry.coordinates[0][0], d.geometry.coordinates[0][2])
  // console.log("store")
  // console.log(gridStore.latStart)
  var {bound} = storeToRefs(gridStore)
  watch(
      () => bound.value, // 监听的状态属性
      (newValue, oldValue) => {
        console.log('状态变化:', (oldValue), '->', newValue);
        // 你的处理逻辑
      },
      { deep: true } // 深度监听
  );
    var option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '70%'],
        // adjust the start and end angle
        startAngle: 180,
        endAngle: 360,
        data: [
          { value: 1048, name: 'Search Engine' },
          { value: 735, name: 'Direct' },
          { value: 580, name: 'Email' },
          { value: 484, name: 'Union Ads' },
          { value: 300, name: 'Video Ads' }
        ]
      }
    ]
  };

  chartInstance = echarts.init(fanDiagram.value);
  chartInstance.setOption(option);

  window.addEventListener('resize', () => {
    chartInstance.resize();
  });

  
})
</script>

<style scoped>
.container{
  /* overflow-y: scroll; */
  height: 100%;
  width: 100%;
  padding: 10px;
}
</style>