<script setup>
import { ref,onMounted,watch} from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat/dist/leaflet-heat.js'
import * as d3 from 'd3'
//import getCity from '../utils/index.js'
import { cities ,getCity} from '../utils/getCity.js'
import {dotColors,getDotColors} from '../utils/getColor.js';

const map =ref(null)
const city = ref('成都市')
const bankValue = ref(['中国工商银行','中国建设银行','中国农业银行','交通银行','中国银行'])
let poiData = []
// 图层
let baseMapLayer = L.tileLayer('https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',{
    maxZoom: 19,
    minZoom: 1,
})
let heatmapLayer = ref(null)
let dotmapLayer = ref(null)
// 创建控件对象
var baseMaps = {
    "地图": baseMapLayer
}
var overlayMaps = {
    "热力图": heatmapLayer.value,
    // "网格图": gridLayer
    "兴趣点图": dotmapLayer.value
}

// 图层切换控件
var layerControl = null

const createMap = () => {
    map.value = L.map('mapContainer', {attributionControl: false,
    layers:[baseMapLayer]
    }).setView(getCity(city.value), 10)

    // 添加图层控制
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map.value)

    // 监听图层切换事件
    map.value.on('overlayadd',(e)=>{
        if(e.name == '兴趣点图' && bankValue.value.length !== 4){
            bankValue.value = ['中国工商银行','中国建设银行','中国农业银行','交通银行','中国银行']
            console.log('this is test--------------------------------',bankValue.value)
        }
    })

    // 如果热力图层已初始化，则添加到地图
    if (heatmapLayer.value) {
        heatmapLayer.value.addTo(map.value);
    }
    // 如果点图层已初始化，则添加到地图
    if(dotmapLayer.value){
        dotmapLayer.value.addTo(map.value)
    }
}

const initDotmapLayer = (data) => {
    // 移除旧图层
    if(dotmapLayer.value){
        console.log('remove old layer')
        map.value.removeLayer(dotmapLayer.value)
    }
    dotmapLayer.value = L.layerGroup(data.map((d) => {
        // 根据点类型返回不同颜色
        let color 
        if(d.type.includes('中国工商银行')){
            color = getDotColors('中国工商银行')
        }
        else if(d.type.includes('中国建设银行')){
            color = getDotColors('中国建设银行')
        }
        else if(d.type.includes('中国农业银行')){
            color = getDotColors('中国农业银行')
        }
        else if(d.type.includes('交通银行')){
            color = getDotColors('交通银行')
        }
        else{
            //中国银行
            color = getDotColors('中国银行')
        }

        return L.circleMarker([d.lat, d.lon], {
            radius: 5,
            fillColor: color,
            color: color,
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(d.name)
    })
    )
}

const updateDotmapLayer = (data) => {
    // 移除旧图层
    if(dotmapLayer.value){
        map.value.removeLayer(dotmapLayer.value)
    }
    console.log(bankValue.value)
    // 过滤数据
    var filterData = data.filter(d => bankValue.value.some(bank => d.type.includes(bank)));
    //console.log(filterData)
    initDotmapLayer(filterData)
    console.log("dotmapLayer is:",dotmapLayer.value)
    // 更新 overlayMaps
    overlayMaps["兴趣点图"] = dotmapLayer.value;
    dotmapLayer.value.addTo(map.value)
}

watch(city, (newCity) => {
  if (map.value && getCity(newCity)) {
    map.value.setView(getCity(newCity), 10)
  }
})
watch(bankValue, (newBankValue) => {
  if (map.value && poiData) {
    console.log('update dotmap layer')
    updateDotmapLayer(poiData)
  }
})

onMounted(()=>{
    d3.csv('/jpBank.csv').then((data) => {
        console.log(data)
    poiData = data.map((d) => {
        return {lat: d.lat, lon: d.lon, name: d.name, type: d.type}
    })
    heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 20, blur: 20, maxZoom: 10,gradient:{0.5: '#89dae8', 0.6: '#87eedc', 0.7: '#81ea8f', 0.8: '#eef48e', 0.9: '#fac581',1:'#ec9073'}})
    initDotmapLayer(data)
    // 更新 overlayMaps
    overlayMaps["热力图"] = heatmapLayer.value;
    overlayMaps["兴趣点图"] = dotmapLayer.value;
    console.log(overlayMaps)
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
            <span>选择兴趣点</span>
            <el-select v-model="bankValue" multiple collapse-tags placeholder="Select" style="width: 20%;" >
                <el-option v-for="(color,type) in dotColors" :key="type" :label="type" :value="type"></el-option>
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
