<script setup>
import detailTable from "./detailTable.vue"
import Map from './map.vue'
import radarChart from './radarChart.vue'
import poiDetail from './poiDetail.vue'
import areaControl from "./areaControl.vue"
import entityControl from "./entityControl.vue"
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<template>
    <div class="grid-container">
        <div class="title">
            GeoVis：城市商业环境画像可视分析系统
        </div>
        <div class="control-container">
            <div class="control-grid">
                <areaControl></areaControl>
            </div>
            <div class="control-entity">
                <entityControl></entityControl>
            </div>

        </div>
        <!-- <div  class="control-container">
            <areaControl></areaControl>
        </div> -->
        <div class="map-container">
            <Map/>
        </div>
        <div class="info-container">
            <div class="info-radar">
                <radarChart></radarChart>
            </div>
            <div class="info-table">
                <!-- <detailTable></detailTable> -->
                <poiDetail></poiDetail>
            </div>
        </div>
    </div>
</template>

<style scoped>

.grid-container{
    box-sizing: border-box; /* 包含padding在尺寸计算内 */
    height: 100vh;
    width: 100%;
    display:grid;
    grid-template-columns:1.5fr 4fr 2fr;
    grid-template-rows:2rem 1fr;
    background-color: #ebebeb;
}
.title{
    width: 100%;
    grid-column:span 3;
    grid-row:1;;
    background-color: rgb(231, 231, 231);
    font-weight: bold;
    vertical-align: middle;
    font-size: 1.2rem;
    color: rgb(66, 66, 66);
}
.control-container{
    grid-column:1;
    grid-row:span 2;
    display: grid;
    grid-template-rows: 1fr 1fr;
    /* border:1px solid #cbcbcb; */
}
.control-grid{
    border:1px solid #cbcbcb;
    border-radius: 4px;
    overflow:auto;
    max-height: 100%;
    -ms-overflow-style: none;  /* 对于 Internet Explorer 和 Edge */
    scrollbar-width: none;  /* 对于 Firefox */
    margin-right :2.5px;
    margin-bottom: 2.5px;
    background-color: white;
}
.control-entity{
    border:1px solid #cbcbcb;
    border-radius: 4px;
    overflow:auto;
    max-height: 100%;
    -ms-overflow-style: none;  /* 对于 Internet Explorer 和 Edge */
    scrollbar-width: none;  /* 对于 Firefox */
    margin-right :2.5px;
    background-color: white;
}
.map-container{
    grid-column:2;
    grid-row:span 2;
    border:1px solid #cbcbcb;
    border-radius: 4px;
    width: 100%;
    height: 100%;
    margin-right :2.5px;
    margin-bottom: 2.5px;
    background-color: white;
}
.info-container{
    grid-column:3;
    grid-row:span 2;
    display:grid;
    grid-template-rows: 1fr 1fr;
}
.info-radar{
    border:1px solid #cbcbcb;
    border-radius: 4px;
    margin-left: 4px;
    margin-bottom: 2.5px;
    background-color: white;
}
.info-table{
    border:1px solid #cbcbcb;
    border-radius: 4px;
    overflow:auto;
    max-height: 100%;
    -ms-overflow-style: none;  /* 对于 Internet Explorer 和 Edge */
    scrollbar-width: none;  /* 对于 Firefox */
    margin-left: 4px;
    background-color: white;
}
.info-table::-webkit-scrollbar {
    width: 0;
    height: 0;
}
</style>