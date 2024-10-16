<script setup>
import { ref,onMounted,watch} from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat/dist/leaflet-heat.js'
import * as d3 from 'd3'
//import getCity from '../utils/index.js'
import { cities ,getCity} from '../utils/getCity.js'

const map =ref(null)
const city = ref('成都市')
let poiData = []
// 图层
// var heatmapLayer = L.tileLayer('https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',{
//     maxZoom: 19,
//     minZoom: 10,
// })
let baseMapLayer = L.tileLayer('https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',{
    maxZoom: 19,
    minZoom: 1,
})
let heatmapLayer = ref(null)
// 创建控件对象
var heatMaps = {
    "热力图": heatmapLayer.value
}
// 图层切换控件
var layerControl = ref(null)

const createMap = () => {
    map.value = L.map('mapContainer', {attributionControl: false,
    layers:[baseMapLayer,heatmapLayer.value]
    }).setView(getCity(city.value), 10)

    layerControl.value = L.control.layers(heatMaps).addTo(map.value)
}


watch(city, (newCity) => {
  if (map.value && getCity(newCity)) {
    map.value.setView(getCity(newCity), 10)
  }
})

onMounted(()=>{
    d3.csv('/jpBank.csv').then((data) => {
        console.log(data)
    poiData = data.map((d) => {
        return [d.lat, d.lon]
    })
    heatmapLayer.value = L.heatLayer(poiData, {radius: 20, blur: 20, maxZoom: 10,gradient:{0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}})
    createMap()
    })
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
