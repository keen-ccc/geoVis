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
            GeoVis
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
    height: 100vh;
    width: 100%;
    display:grid;
    grid-template-columns:1.5fr 4fr 2fr;
    grid-template-rows:2rem 1fr;
}
.title{
    grid-column:span 2;
    grid-row:1;
    background-color: white;
    font-weight: bold;
    vertical-align: middle;
    font-size: 1.5rem;

}
.control-container{
    grid-column:1;
    grid-row:span 2;
    display: grid;
    grid-template-rows: 1fr 1fr;
    /* border:1px solid #b5b5b5; */
}
.control-grid{
    border:1px solid #b5b5b5;
    overflow:auto;
    max-height: 100%;
    -ms-overflow-style: none;  /* 对于 Internet Explorer 和 Edge */
    scrollbar-width: none;  /* 对于 Firefox */
}
.control-entity{
    border:1px solid #b5b5b5;
    overflow:auto;
    max-height: 100%;
    -ms-overflow-style: none;  /* 对于 Internet Explorer 和 Edge */
    scrollbar-width: none;  /* 对于 Firefox */
}
.map-container{
    grid-column:2;
    grid-row:span 2;
    border:1px solid #b5b5b5;
    width: 100%;
    height: 100%;
}
.info-container{
    grid-column:3;
    grid-row:span 2;
    display:grid;
    grid-template-rows: 1fr 1fr;

}
.info-radar{
    border:1px solid #b5b5b5;
}
.info-table{
    border:1px solid #b5b5b5;
    overflow:auto;
    max-height: 100%;
    -ms-overflow-style: none;  /* 对于 Internet Explorer 和 Edge */
    scrollbar-width: none;  /* 对于 Firefox */
}
.info-table::-webkit-scrollbar {
    width: 0;
    height: 0;
}
</style>