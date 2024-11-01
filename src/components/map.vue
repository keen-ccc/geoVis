<script setup>
import { ref,onMounted,watch} from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat/dist/leaflet-heat.js'
import 'vue-leaflet-sidepanel/dist/style.css';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { LSidepanel, LSidepanelTab } from 'vue-leaflet-sidepanel';
import * as d3 from 'd3'
//import getCity from '../utils/index.js'
import { cities ,getCity} from '../utils/getCity.js'
import {dotColors,getDotColors} from '../utils/getColor.js';
import detailTable from './detailTable.vue';
import * as Cesium from 'cesium';
// import grid_data from '@/assets/grids.json'
// import grid_data from '@/assets/grid_simple.geojson'
// import fs from 'fs';
// import geojsonStream from 'geojson-stream';
// import Cesium from 'cesium';


const map =ref(null)
const city = ref('成都市')
const bankValue = ref(['中国工商银行','中国建设银行','中国农业银行','交通银行','中国银行'])
let poiData = []
let gridData = []
const headings = [
    {
        key:1,
        value:'tab1'
    },
    {
        key:2,
        value:'tab2'
    }
]
// 图层
let baseMapLayer = L.tileLayer('https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',{
    maxZoom: 19,
    minZoom: 6,
})
let heatmapLayer = ref(null)
let dotmapLayer = ref(null)
let gridLayer = ref(null)


// 图层切换控件
var layerControl = null
var baseMaps = {
    "地图": baseMapLayer
}
var overlayMaps = {
    "热力图": heatmapLayer.value,
    // "网格图": gridLayer.value,
    "兴趣点图": dotmapLayer.value
}

var grid_bool = 0;

// const getGridData = async () => {
//     let dataGeo = Cesium.GeoJsonDataSource.load("@/assets/grid_simple.geojson");
//     console.log(dataGeo);
// }
const controlGridLayer = () => {
    var zoomLevel = map.value.getZoom();
    if (zoomLevel < 15 && grid_bool == 1) {
        // 在缩放级别小于15时，移除图层控制器中的 Layer 3
        layerControl.removeLayer(gridLayer.value);
        // map.value.removeLayer(gridLayer.value);
        grid_bool = 0;
    } else if(zoomLevel >= 15 && grid_bool == 0){
        // 在缩放级别大于等于15时，添加图层控制器中的 Layer 3
        layerControl.addOverlay(gridLayer.value, "网格图");
        map.value.addLayer(gridLayer.value)
        grid_bool = 1;
    }
}
const createMap = () => {
    // 添加图层控制
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map.value)

    map.value.on("zoomend", ()=>{
        controlGridLayer()
    })

    // 监听图层切换事件
    map.value.on('overlayadd',(e)=>{
        if(e.name == '网格图'){
            initGridLayer(gridData)
        }
    })
    map.value.on('overlayremove',(e)=>{
        if(e.name == '网格图'){
            //删除生成的svg
            d3.select("#gridSvg").selectAll("*").remove()
        }
    })

    // 监听图层切换事件
    map.value.on('overlayadd',(e)=>{
        if(e.name == '兴趣点图' && bankValue.value.length !== 4){
            bankValue.value = ['中国工商银行','中国建设银行','中国农业银行','交通银行','中国银行']
            updateDotmapLayer(poiData)
        }
    })
    map.value.on('overlayremove',(e)=>{
        if(e.name == '兴趣点图'){
            //删除生成的svg
            d3.select(map.value.getPanes().overlayPane).selectAll('#dotmapLayer').remove()
        }
    })
    // createGrid()
    // 如果热力图层已初始化，则添加到地图
    if (heatmapLayer.value) {
        heatmapLayer.value.addTo(map.value);
    }
    // 如果点图层已初始化，则添加到地图
    if(dotmapLayer.value){
        dotmapLayer.value.addTo(map.value)
    }
}



const initGridLayer = (data1) => {
    // console.log("init")
    var data = data1;
    var svg;
    if(d3.select("#gridSvg").empty()) {
        svg = d3.select(map.value.getPanes().overlayPane).append("svg").attr("id", "gridSvg")
    }else {
        svg = d3.select("#gridSvg")
        svg.selectAll("*").remove()
    }
    
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var transform = d3.geoTransform({point: projectPoint}),
    path = d3.geoPath().projection(transform);
    

    map.value.on("zoomend", reset)
    map.value.on("moveend", reset)
    reset()

    function reset() {
        if (map.value.getZoom() < 15) {
            g.selectAll("*").remove()
            return;
        }
        // console.log("reset")

        const map_bounds = map.value.getBounds() // 获取地图当前边界
        const southWest = map_bounds.getSouthWest()
        const northEast = map_bounds.getNorthEast()
        
        const latStart = southWest.lat   //西南
        const latEnd = northEast.lat   //东北
        const lonStart = southWest.lng
        const lonEnd = northEast.lng

        //
        const grid_size = 1000
        const grid_width = 0.008983111749910169
        const grid_height = 0.010391927140799718


        // var simple_data = JSON.parse(grid_data).filter(item => item.longitude >= lonStart-grid_width && item.longitude <= lonEnd+grid_width && item.latitude >= latStart-grid_height && item.latitude <= latEnd+grid_height)

        var simple_geo_data = data.features.filter(item => item.geometry.coordinates[0][0][0] >= lonStart-grid_width && item.geometry.coordinates[0][0][0] <= lonEnd+grid_width && item.geometry.coordinates[0][0][1] >= latStart-grid_height && item.geometry.coordinates[0][0][1] <= latEnd+grid_height)

        // console.log("simple"+simple_geo_data.length)
        var bounds = path.bounds({type: "FeatureCollection", features: simple_geo_data}),
        topLeft = bounds[0],
        bottomRight = bounds[1];

        var width = bottomRight[0] - topLeft[0]
        var height = bottomRight[1] - topLeft[1]

        // 检查是否有无效值
        if (!isFinite(width) || !isFinite(height)) {
            console.error("Invalid bounds:", bounds)
            return
        }

        svg.attr("width", width)
            .attr("height", height)
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        // console.log("width"+width)
        // console.log("height"+height)

        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        g.selectAll("*").remove()

        var feature = g.selectAll("rect")
            .data(simple_geo_data)
            .enter()
            .append("rect")
            .attr("x", d=>{
                var point = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0]));
                return point.x;
            })
            .attr("y", d=>{
                var y = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0])).y;
                return y;
            })
            .attr("width", d=>{
                var point1 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][0][1],d.geometry.coordinates[0][0][0]));
                var point2 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0]));
                return Math.abs(point1.x-point2.x);
            })
            .attr("height", d=>{
                var point1 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][0][1],d.geometry.coordinates[0][0][0]));
                var point2 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0]));
                return Math.abs(point1.y-point2.y)
                
            })
            .attr("fill", "red")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "black")
            .attr("stroke-width", 1);
            
    }

    function projectPoint(x, y) {
        const point = map.value.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }
}

const initDotmapLayer = (data) => {
    dotmapLayer.value = L.layerGroup()
    const svg = d3.select(map.value.getPanes().overlayPane).append("svg").attr("id","dotmapLayer")
    const g = svg.append("g").attr("class", "leaflet-zoom-hide")

    const transform = d3.geoTransform({point: projectPoint})
    const path = d3.geoPath().projection(transform)

    const geoData = data.map(d => ({type: "Feature", geometry: {type: "Point", coordinates: [d.lon, d.lat]}, properties: d}))
    //console.log(geoData)
    const feature = g.selectAll("circle")
        .data(geoData)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", (d => {
            if(d.properties && d.properties.type){
                if (d.properties.type.includes('中国工商银行')) {
                    return getDotColors('中国工商银行')
                } else if (d.properties.type.includes('中国建设银行')) {
                    return getDotColors('中国建设银行')
                } else if (d.properties.type.includes('中国农业银行')) {
                    return getDotColors('中国农业银行')
                } else if (d.properties.type.includes('交通银行')) {
                    return getDotColors('交通银行')
                } else if (d.properties.type.includes('中国银行')) {
                    return getDotColors('中国银行')
                }
            }
            console.error("Invalid type:", d)

        }))
        .attr("stroke", d => getDotColors(d.type))
        .attr("fill-opacity", 0.8)
        .attr("stroke-width", 1)

    map.value.on("zoomend", reset)
    reset()

    function reset() {
        const bounds = path.bounds({type: "FeatureCollection", features: geoData})
        const topLeft = bounds[0]
        const bottomRight = bounds[1]
        const width = bottomRight[0] - topLeft[0]
        const height = bottomRight[1] - topLeft[1]
        // 检查是否有无效值
        if (!isFinite(width) || !isFinite(height)) {
            console.error("Invalid bounds:", bounds)
            return
        }
        svg.attr("width", width)
            .attr("height", height)
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px")

 
        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")")

        feature.attr("transform", d => {
            //console.log(d)
            if (d.geometry.coordinates[0] !== undefined && d.geometry.coordinates[1] !== undefined) {
                const point = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]));
                return `translate(${point.x},${point.y})`;
            } else {
                console.error("Invalid LatLng object:", d);
                return "translate(0,0)";
            }
        })
    }

    function projectPoint(x, y) {
        const point = map.value.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }
}

const updateDotmapLayer = (data) => {
    // 删除旧的svg
    d3.select(map.value.getPanes().overlayPane).selectAll('#dotmapLayer').remove()
    // 过滤数据
    var filterData = data.filter(d => bankValue.value.some(bank => d.type.includes(bank)));
    initDotmapLayer(filterData)
    //console.log("dotmapLayer is:",dotmapLayer.value)
}

watch(city, (newCity) => {
  if (map.value && getCity(newCity)) {
    map.value.setView(getCity(newCity), 10)
    initGridLayer(gridData)
    controlGridLayer()
  
    updateDotmapLayer(poiData)
  }
})
watch(bankValue, (newBankValue) => {
  if (map.value && poiData && bankValue.value.length > 0) {
    updateDotmapLayer(poiData)
  }
  else{
    d3.select(map.value.getPanes().overlayPane).selectAll('svg').remove()
  }

})

onMounted(()=>{
    map.value = L.map('mapContainer', {attributionControl: false,
    layers:[baseMapLayer]
    }).setView(getCity(city.value), 10)

    d3.csv('/jpBank.csv').then((data) => {
        //console.log(data)
    poiData = data.map((d) => {
        return {lat: d.lat, lon: d.lon, name: d.name, type: d.type}
    })

    d3.json('/grids.geojson').then(function(data) {
        // 处理加载的数据
        // console.log("js"+data); // 输出 GeoJSON 数据到控制台
        gridData = data
        // initGridLayer(gridData)
    }).catch(function(error) {
        console.error("Error loading the GeoJSON file:", error);
    });

    // gridData = JSON.parse(grid_data)
    heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 50, blur: 35, maxZoom: 10,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#81ea8f', 0.7: '#eef48e', 0.85: '#fac581',1:'#ec9073'}})

    gridLayer.value = L.layerGroup()
    initDotmapLayer(poiData)

    // 更新 overlayMaps
    overlayMaps["热力图"] = heatmapLayer.value;
    // overlayMaps["网格图"] = gridLayer.value;
    overlayMaps["兴趣点图"] = dotmapLayer.value;
    //console.log(overlayMaps)
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
            <el-select v-model="bankValue" multiple collapse-tags placeholder="Select" style="width: 20%;"  >
                <el-option v-for="(color,type) in dotColors" :key="type" :label="type" :value="type"></el-option>
            </el-select>
        </div>
        <div id="mapContainer" style="height: 97%;width:100%;">
            <l-sidepanel id="rightPanel" :headings tabsPosition="top" position="right">
                <template #[`heading.1`]>
                    网格比较
                </template>
                <l-sidepanel-tab link="1">
                    <p>Content 1</p>
                </l-sidepanel-tab>
                <template #[`heading.2`]>
                    市场经营主体分析
                </template>
                <l-sidepanel-tab link="2">
                    <detailTable></detailTable>
                </l-sidepanel-tab>
            </l-sidepanel>
        </div>
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
