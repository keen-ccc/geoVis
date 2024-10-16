<script setup>
import { ref,onMounted,watch} from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as d3 from 'd3'
//import getCity from '../utils/index.js'
import { cities ,getCity} from '../utils/getCity.js'

const map =ref(null)
const city = ref('成都市')

const createMap = () => {
    map.value = L.map('mapContainer', {attributionControl: false}).setView(getCity(city.value), 10)

    // 添加地图层
    L.tileLayer('https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',{
        maxZoom: 19,
        minZoom: 10,
    })
    .addTo(map.value)
}

watch(city, (newCity) => {
  if (map.value && getCity(newCity)) {
    map.value.setView(getCity(newCity), 10)
  }
})

onMounted(()=>{
    createMap()
})
</script>

<template>
    <div style="height: 100%;">
        <div class="controlBar">
            <span>选择城市</span>
            <el-select v-model="city" placeholder="Select" style="width: 20%;">
                <el-option v-for="(latlon,cityname) in cities" :key="cityname" :label="cityname" :value="cityname"></el-option>
            </el-select>
        </div>
        <div id="mapContainer" style="height: 97%;width:100%;"></div>
    </div>

</template>

<style>
.controlBar{
    height: 3%;
    width: 100%;
    display: flex;
    padding: 5px;
    margin: 2px;
    align-items: center;
}
</style>
