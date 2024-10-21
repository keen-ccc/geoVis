<script setup>
import detailTable from "./detailTable.vue"
import Map from './map.vue'
import radarChart from './radarChart.vue'
</script>

<template>
    <div class="grid-container">
        <div class="title">
            GeoVis
        </div>
        <div class="map-container">
            <Map/>
        </div>
        <div class="info-container">
            <div class="info-radar">
                <radarChart></radarChart>
            </div>
            <div class="info-table">
                <p>table</p>
                <detailTable></detailTable>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-container{
    height: 100vh;
    width: 100%;
    display:grid;
    grid-template-columns: 5fr 3fr;
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
.map-container{
    grid-column:1;
    grid-row:span 2;
    border:2px solid #b5b5b5;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
}
.info-container{
    grid-column:2;
    grid-row:span 2;
    display:grid;
    grid-template-rows: 1fr 1fr;
    margin: 2px;
}
.info-radar{
    border:2px solid #b5b5b5;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
}
.info-table{
    border:2px solid #b5b5b5;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
    overflow-y: scroll;
    max-height: 100%;
}
</style>