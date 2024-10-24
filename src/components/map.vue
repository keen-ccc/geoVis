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
    minZoom: 6,
})
let heatmapLayer = ref(null)
let gridLayer = ref(null)


// 图层切换控件
var layerControl = ref(null)
var baseMaps = {
    "地图": baseMapLayer
}
var overlayMaps = {
    "热力图": heatmapLayer.value,
    "网格图": gridLayer.value
}


const createMap = () => {
    map.value = L.map('mapContainer', {attributionControl: false,
    layers:[baseMapLayer]
    }).setView(getCity(city.value), 10)

    // 添加图层控制
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map.value)
    // 如果热力图层已初始化，则添加到地图
    if (heatmapLayer.value) {
        heatmapLayer.value.addTo(map.value);
    }

    createGrid()

    // 添加 zoomend 事件监听器
    map.value.on('zoomend', () => {
        // console.log("grid-----")
        if (map.value.getZoom() >= 12) { // 假设当缩放级别 >= 12 时显示网格
            // createGrid()
            gridLayer.value.addTo(map.value);
        } else {
            if (gridLayer.value) {
                map.value.removeLayer(gridLayer.value) // 移除网格
                // gridLayer.value = null
            }
        }
    })


    
}

// 创建网格
const createGrid = () => {
    // if (gridLayer.value) {
    //     gridLayer.value.clearLayers() // 清除已有网格
    // } else {
        
    // }
    // gridLayer.value = L.layerGroup() // 创建一个新的图层组

    const bounds = map.value.getBounds() // 获取地图当前边界
    const southWest = bounds.getSouthWest()
    const northEast = bounds.getNorthEast()
    
    const latStart = southWest.lat
    const latEnd = northEast.lat
    const lonStart = southWest.lng
    const lonEnd = northEast.lng
    const gridSize = 0.009  // 大约 1km 的网格大小（纬度和经度上的近似值）

    for (let lat = latStart; lat < latEnd; lat += gridSize) {
        for (let lon = lonStart; lon < lonEnd; lon += gridSize) {
            const rectangle = L.rectangle([[lat, lon], [lat + gridSize, lon + gridSize]], {
                color: '#ff7800',
                weight: 1,
                fillOpacity: 0.1
            })
            gridLayer.value.addLayer(rectangle) // 将矩形添加到网格图层
        }
    }
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
    heatmapLayer.value = L.heatLayer(poiData, {radius: 20, blur: 20, maxZoom: 10,gradient:{0.5: '#89dae8', 0.6: '#87eedc', 0.7: '#81ea8f', 0.8: '#eef48e', 0.9: '#fac581',1:'#ec9073'}})
    // 更新 overlayMaps
    gridLayer.value = L.layerGroup()
    // createGrid()
    overlayMaps["热力图"] = heatmapLayer.value;
    overlayMaps["网格图"] = gridLayer.value;
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
