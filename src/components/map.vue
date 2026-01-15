<script setup>
import { ref,onMounted,watch,toRaw} from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat/dist/leaflet-heat.js'
import 'vue-leaflet-sidepanel/dist/style.css';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { LSidepanel, LSidepanelTab } from 'vue-leaflet-sidepanel';
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster/dist/leaflet.markercluster.js'
import * as d3 from 'd3'
//import getCity from '../utils/index.js'
import { cities ,getCity} from '../utils/getCity.js'
//import '../utils/TileLayer.Grayscale.js'
import {dotColors,expressDotColors,getDotColors,getExpressDotColors} from '../utils/getColor.js';
import detailTable from './detailTable.vue';
import { color } from 'echarts';
import {useGridSelectorStore} from '@/store/gridSelector'
import {pathGridStore} from '@/store/pathSelector'
import {useNetSelectorStore} from '@/store/netSelector'
import { usePoiDetailStore } from '@/store/poiDetail.js';
import { storeToRefs } from 'pinia'
import html2canvas from "html2canvas";
import {Delete} from '@element-plus/icons-vue'


L.Tooltip.include({
	_animateZoom(e) {
		//console.log('Tooltip',this._map);
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
		this._setPosition(pos);
        controlGridLayer()
	}
});
L.Popup.include({
	_animateZoom(e) {
		//console.log('Popup',this._map);
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
			anchor = this._getAnchor();
		L.DomUtil.setPosition(this._container, pos.add(anchor));
        controlGridLayer()
	},
});
L.Marker.include({
	_animateZoom(opt) {
		//console.log('Marker',this._map);
        if(this._map === null){
            return
        }
		const pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
        controlGridLayer()
	},
});
// 初始化 Pinia store
const netSelectorStore = useNetSelectorStore();
var selected = ref(false)
var selectedNetFlag = ref(false)
var selectedGrid = null 
var selectedNet = null
const map =ref(null)
const city = ref('成都市')
const bankValue = ref(['中国邮政'])
const expressValue = ref(['邮政'])
const dataSource = ref('')
const pathStore = pathGridStore()
const {pathID} = storeToRefs(pathStore)
const poiStore = usePoiDetailStore()
const {poiIndustryData} = storeToRefs(poiStore)
let dataSourceFlag = true // true:银行  false:物流
let poiData = []
let gridData = []
let isPoiData = false
const headings = [
    {
        key:1,
        value:'tab1'
    }
]
const GRID_COLOR = '#377eb8'
const GRID_HIGHLIGHT_COLOR = '#e41a1c'
const GRID_PATH_COLOR = '#e12afb'
const props1 = {
  checkStrictly: true,
//   emitPath:false,
  value:'value',
  label:'label',
  children:'children'
}
//https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/WMTS/tile/1.0.0/Canvas_World_Light_Gray_Base/default/default028mm/{z}/{y}/{x}/
//https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}
// https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}
// 图层
let baseMapLayer = L.tileLayer('/offline-tiles/{z}/{x}/{y}.png',{
    maxZoom: 15,
    minZoom: 10,
})
let heatmapLayer = ref(null)
let dotmapLayer = ref(null)
let gridLayer = ref(null)
let aggregationLayer = ref(null)
let panel1 = ref(null)
var comparisonCards = ref([])

// 图层切换控件
var layerControl = null
var baseMaps = {
    "地图": baseMapLayer
}
var overlayMaps = {
    "热力层": heatmapLayer.value,
    // "网格图": gridLayer.value,
    "兴趣点层": dotmapLayer.value,
    '聚合点层':aggregationLayer.value
}

var heat_bool = 0;
var grid_bool = 0;
var grid_size = ref(500)
var poiMax = 850;

//火星坐标 -> WGS84坐标
function gcj02ToWgs84(lng, lat) {
    var pi = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    var dlat = transformLat(lng - 105.0, lat - 35.0);
    var dlng = transformLng(lng - 105.0, lat - 35.0);
    var radlat = lat / 180.0 * pi;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * pi);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * pi);
    var mglat = lat + dlat;
    var mglng = lng + dlng;
    return [lng * 2 - mglng, lat * 2 - mglat];
}

function transformLat(lng, lat) {
    var pi = 3.1415926535897932384626;
    var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * pi) + 20.0 * Math.sin(2.0 * lng * pi)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * pi) + 40.0 * Math.sin(lat / 3.0 * pi)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * pi) + 320 * Math.sin(lat * pi / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLng(lng, lat) {
    var pi = 3.1415926535897932384626;
    var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * pi) + 20.0 * Math.sin(2.0 * lng * pi)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * pi) + 40.0 * Math.sin(lng / 3.0 * pi)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * pi) + 300.0 * Math.sin(lng / 30.0 * pi)) * 2.0 / 3.0;
    return ret;
}

// const getGridData = async () => {
//     let dataGeo = Cesium.GeoJsonDataSource.load("@/assets/grid_simple.geojson");
//     console.log(dataGeo);
// }
const controlGridLayer = () => {
    var zoomLevel = map.value.getZoom();
    console.log("zoomLevel",zoomLevel)
    // if (zoomLevel < 15 && grid_bool == 1) {
    //     // 在缩放级别小于15时，移除图层控制器中的 Layer 3
    //     layerControl.removeLayer(gridLayer.value);
    //     // map.value.removeLayer(gridLayer.value);
    //     grid_bool = 0;
    // } else if(zoomLevel >= 15 && grid_bool == 0){
    //     // 在缩放级别大于等于15时，添加图层控制器中的 Layer 3
    //     layerControl.addOverlay(gridLayer.value, "网格图");
    //     map.value.addLayer(gridLayer.value)
    //     grid_bool = 1;
    // }
    // if(zoomLevel >=15 && grid_bool==0){
    //     // 如果没有添加控件
    //     console.log(layerControl._layers[2])
    //     if(layerControl._layers[4] == undefined){
    //         layerControl.addOverlay(gridLayer.value, "网格图");
    //     }
    //     // map.value.addLayer(gridLayer.value)
    //     // grid_bool = 1;
    // }
    // else{
    //     layerControl.removeLayer(gridLayer.value);
    //     d3.select('#gridSvg').remove()
    //     // grid_bool = 0;
    // }
    if(zoomLevel >=15 && map.value.hasLayer(heatmapLayer.value) && heat_bool == 0){
        heatmapLayer.value.remove()
        layerControl.removeLayer(heatmapLayer.value)
        heat_bool = 1;
    }
    else if(zoomLevel < 15 && heat_bool == 1 ){
        layerControl.addOverlay(heatmapLayer.value, "热力层");
        map.value.addLayer(heatmapLayer.value)
        heat_bool = 0;
    }
    if(map.value.hasLayer(dotmapLayer.value)){
        const s = zoomLevel < 14 ? 2 : 5
        d3.selectAll('#dot').attr('d', function(d){
            const isPostal = (d.properties && d.properties.type && d.properties.type.includes('邮政')) || (d.properties && d.properties.name && d.properties.name.includes('邮政'))
            const sTri = s + 3
            const tri = (()=>{const x1 = 0, y1 = -sTri; const x2 = -sTri * 0.866, y2 = sTri * 0.5; const x3 = sTri * 0.866, y3 = sTri * 0.5; return `M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} Z`})()
            const cir = `M 0,0 m -${s},0 a ${s},${s} 0 1,0 ${2*s},0 a ${s},${s} 0 1,0 -${2*s},0`
            return isPostal ? tri : cir
        })
    }
}

function saveGridSnapshot(bounds) {
    // 使用 html2canvas 或其他方法获取地图区域快照
    const mapElement = document.getElementById('mapContainer');
    console.log('mapElement:', mapElement);

    var imgUrl = null;
    html2canvas(mapElement,{scale: window.devicePixelRatio}).then(canvas => {
        imgUrl = canvas.toDataURL();
        // console.log("url"+imgUrl)
        
        // 此处 img 变量是包含地图区域的快照图像
        // console.log('Snapshot Image:', img);

        // 将 canvas 添加到容器中
        
        // rightPanel1.value.appendChild(canvas);
        // 创建一个新的 img 元素
        // var imgElement = document.createElement('img');
        // imgElement.src = imgUrl; // 设置 img 元素的 src 属性为截图的 base64 数据
        // imgElement.style.width = '100px'
        // imgElement.style.height = '100px'

        // 获取指定的容器元素
        // var container = document.getElementById('panel1');
        
        // 将 img 元素添加到指定的容器中
        // container.appendChild(imgElement);
        return imgUrl;
    });
    
}


const addComparison = async () => {
    const gridStore = useGridSelectorStore();
    var {gridID} = storeToRefs(gridStore);
    var {bound} = storeToRefs(gridStore);
    console.log("comparison"+bound.value.lonStart)


    // const mapElement = document.getElementById('mapContainer');
    // console.log('mapElement:', mapElement);
    var imgUrl = null;

    // const {left, top, width, height} = convertLatLngToPixel(bound.value)

    const params = {
        // gridID: gridID.value,
        start_lon:bound.value.lonStart,
        start_lat:bound.value.latStart,
        end_lon:bound.value.lonEnd,
        end_lat:bound.value.latEnd,
    }
    // start_lon,start_lat,end_lon,end_lat,populationWeight,housePriceWeight,poiDensityWeight,poiDiversityWeight
    const res = await fetch('/api/cal_poiNum', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })

    if (!res.ok) {
        // 请求失败，处理错误
        console.error('Failed to fetch score:', res.statusText)
        return
    }

    const data = await res.json()
    // const score = data.score
    // const score = await res.json().score
    console.log("score", data)

    const newCard = {title:'block', canyin: data.canyin, company: data.company, mall: data.mall, bank: data.bank, express: data.express, grid: gridID.value , imgUrl: imgUrl}
    comparisonCards.value.push(newCard)    
}

const deleteComparison = (index) => {
    comparisonCards.value.splice(index, 1);
}

const clearGrid = () => {
    // 清除网格：移除所有网格元素
    d3.select('#net-grid').remove();

    // 清除雷达图的路径、弧形和文本
    d3.select('#radarSvg').selectAll('path').remove();  // 移除所有雷达图的路径
    d3.select('#radarSvg').selectAll('.arcFill').remove();  // 移除所有 arcFill 元素
    d3.select('#radarSvg').selectAll('.arcText').remove();  // 移除所有 arcText 元素

    // 清除 gridStore 中的网格数据
    const gridStore = useGridSelectorStore();
    gridStore.clearGrid();  // 调用 clearGrid 动作来清除 gridStore 中的网格数据

    // 每次只能选择一个邮政网点
    selectedNetFlag.value = false

    // 清除poiDotMap
    d3.select('#poidotmapLayer').remove()
}


const createMap = () => {
    // 添加图层控制
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map.value)

    map.value.on("zoomend", ()=>{
        controlGridLayer()
    })

    // 监听图层切换事件
    map.value.on('overlayadd',(e)=>{
        // console.log(e)
        if(e.name == '兴趣点层' && bankValue.value.length !== 4){
            bankValue.value = ['中国邮政']
            updateDotmapLayer(poiData)
        }
        if(e.name == '兴趣点层' && expressValue.value.length !== 7){
            expressValue.value =['邮政']
            updateDotmapLayer(poiData)
        }
        // if(e.name == '热力层' ){
        //     console.log(poiData)
        //     // heatmapLayer.value.remove()
        //     heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 50, blur: 35, maxZoom: 10,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#81ea8f', 0.7: '#eef48e', 0.85: '#fac581',1:'#ec9073'}}).addTo(map.value)
        // }
        if(e.name == '聚合点层'){
            createAggregationLayer()
        }
        // if(e.name == '网格图'){
        //     initGridLayer(gridData)
        // }
    })
    map.value.on('overlayremove',(e)=>{
        if(e.name == '兴趣点层'){
            console.log('remove 兴趣点')
            //删除生成的svg
            d3.select(map.value.getPanes().overlayPane).selectAll('#dotmapLayer').remove()
            d3.select(map.value.getPanes().overlayPane).selectAll('#poidotmapLayer').remove()
        }
        // if(e.name == '网格图'){
        //     console.log('remove 网格')
        //     //删除生成的svg
        //     d3.select(map.value.getPanes().overlayPane).selectAll('#gridSvg').remove()
        // }
        if(e.name == '热力层'){
            console.log('remove')
            heatmapLayer.value.remove()
        }
        if(e.name == '聚合点层'){
            aggregationLayer.value.clearLayers()
        }
    })
    map.value.on('dragstart', () => {
    if (gridLayer.value) {
        const overlayPane = map.value.getPanes().overlayPane;
        
        // 禁用所有 rect 元素的 pointer-events
        d3.select(overlayPane).selectAll('.net-grid-cell').style('pointer-events', 'none');
    }
});

map.value.on('dragend', () => {
    if (gridLayer.value) {
        const overlayPane = map.value.getPanes().overlayPane;
        
        // 恢复所有 rect 元素的 pointer-events
        d3.select(overlayPane).selectAll('.net-grid-cell').style('pointer-events', 'all');
    }
});




}

// var map_bounds 
const getFileName=()=> {
    map_bounds = map.value.getBounds();
    var west = map_bounds.getSouthWest().lng;
    var east = map_bounds.getNorthEast().lng;
    // console.log("west", west)
    // console.log("east", east)

    var min_x = 97.35620880100004
 
    var meters_to_degrees_lon = 0.005195963570399859

    var col1 = parseInt((west - min_x)/meters_to_degrees_lon/100)*100
    var col2 = parseInt((east - min_x)/meters_to_degrees_lon/100)*100
    console.log("col1", col1)
    return [col1, col2]

}

// const initGridLayer = (data1) => {

//     // console.log("init")
//     var data = data1;
//     var svg;
//     if(d3.select("#gridSvg").empty()) {
//         svg = d3.select(map.value.getPanes().overlayPane).append("svg").attr("id", "gridSvg")
//     }else {
//         svg = d3.select("#gridSvg")
//         svg.selectAll("*").remove()
//     }
//     //svg.raise()
//     var g = svg.append("g").attr("class", "leaflet-zoom-hide");

//     var transform = d3.geoTransform({point: projectPoint}),
//     path = d3.geoPath().projection(transform);
    

//     map.value.on("zoomend", reset)
//     map.value.on("moveend", reset)
//     reset()

//     function reset() {
//         if (map.value.getZoom() < 15) {
//             g.selectAll("*").remove()
//             return;
//         }
//         // console.log("reset")

//         const map_bounds = map.value.getBounds() // 获取地图当前边界
//         const southWest = map_bounds.getSouthWest()
//         const northEast = map_bounds.getNorthEast()
        
//         const latStart = southWest.lat   //西南
//         const latEnd = northEast.lat   //东北
//         const lonStart = southWest.lng
//         const lonEnd = northEast.lng

//         // const grid_size = 1000
//         const grid_width = 0.008983111749910169
//         const grid_height = 0.010391927140799718

//         // var simple_data = JSON.parse(grid_data).filter(item => item.longitude >= lonStart-grid_width && item.longitude <= lonEnd+grid_width && item.latitude >= latStart-grid_height && item.latitude <= latEnd+grid_height)

//         console.log("lonStart-grid_width")
//         console.log(lonStart-grid_width)
//         console.log(lonEnd+grid_width)
//         var simple_geo_data = data.features.filter(item => item.geometry.coordinates[0][0][0] >= lonStart-grid_width && item.geometry.coordinates[0][0][0] <= lonEnd+grid_width && item.geometry.coordinates[0][0][1] >= latStart-grid_height && item.geometry.coordinates[0][0][1] <= latEnd+grid_height)

//         console.log("simple"+simple_geo_data.length)
//         var bounds = path.bounds({type: "FeatureCollection", features: simple_geo_data}),
//         topLeft = bounds[0],
//         bottomRight = bounds[1];

//         var width = bottomRight[0] - topLeft[0]
//         var height = bottomRight[1] - topLeft[1]

//         // 检查是否有无效值
//         if (!isFinite(width) || !isFinite(height)) {
//             console.error("Invalid bounds:", bounds)
//             return
//         }

//         svg.attr("width", width)
//             .attr("height", height)
//             .style("left", topLeft[0] + "px")
//             .style("top", topLeft[1] + "px");

//         // console.log("width"+width)
//         // console.log("height"+height)

//         g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

//         g.selectAll("*").remove()

//         var feature = g.selectAll("rect")
//             .data(simple_geo_data)
//             .enter()
//             .append("rect")
//             .attr('id',d=>{
//                 return `grid-${d.properties.id}`
//             })
//             .attr("x", d=>{
//                 var point = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0]));
//                 return point.x;
//             })
//             .attr("y", d=>{
//                 var y = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0])).y;
//                 return y;
//             })
//             .attr("width", d=>{
//                 var point1 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][0][1],d.geometry.coordinates[0][0][0]));
//                 var point2 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0]));
//                 return Math.abs(point1.x-point2.x);
//             })
//             .attr("height", d=>{
//                 var point1 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][0][1],d.geometry.coordinates[0][0][0]));
//                 var point2 = map.value.latLngToLayerPoint(new L.LatLng(d.geometry.coordinates[0][2][1],d.geometry.coordinates[0][2][0]));
//                 return Math.abs(point1.y-point2.y)
                
//             })
//             // .attr("fill", "blue")
//             .attr("fill-opacity", 0.05)
//             .attr("stroke",d => {
//                 return "#737373"
//             })
//             .attr("stroke-width", 1)
//             //.attr('pointer-events','all')
//             .on("click", function(e, d){
//                 console.log(d)
//                 const gridStore = useGridSelectorStore();
//                 var point1 = d.geometry.coordinates[0][0];
//                 var point2 = d.geometry.coordinates[0][2];
//                 // Math.min(point1[1],point2[1])==latStart && Math.min(point1[0],point2[0])==lonStart

//                 if (gridStore.findGrid(d.id)) {
//                     removeHightlight(this);
//                 } else {
//                     addHightlight(this);
//                 }
//                 gridStore.selectGrid(d.id, point1, point2);
//                 // if(!selected.value){
//                 //     addHightlight(this)
//                 //     selected.value = true;
//                 //     gridStore.selectGrid(d.properties.id, point1, point2)
//                 //     console.log("properties",gridStore.bound)
//                 //     selectedGrid = this
//                 //     //console.log(gridStore.bound)
//                 // } else if(selectedGrid == this) {
//                 //     selected.value = false;
//                 //     removeHightlight(this)
//                 //     gridStore.cancelGrid()
//                 // } else {
//                 //     gridStore.selectGrid(d.properties.id, point1, point2);
//                 //     addHightlight(this)
//                 //     removeHightlight(selectedGrid)
//                 //     selectedGrid = this
//                 // }
                
//             });
            
//     }

//     function addHightlight(grid) {
//         d3.select(grid).raise();
//         d3.select(grid)
//             .attr("stroke", "red")
//             .attr("stroke-width", 2)
//     }

//     function removeHightlight(grid) {
//         d3.select(grid)
//             .attr("stroke", "#737373")
//             .attr("stroke-width", 1)
//     }

//     function projectPoint(x, y) {
//         const point = map.value.latLngToLayerPoint(new L.LatLng(y, x))
//         this.stream.point(point.x, point.y)
//     }
// }

const initDotmapLayer = (data) => {
    const svg = d3.select(map.value.getPanes().overlayPane).append("svg").attr("id","dotmapLayer")
    //svg.lower();
    const g = svg.append("g").attr("class", "leaflet-zoom-hide")

    const transform = d3.geoTransform({point: projectPoint})
    const path = d3.geoPath().projection(transform)

    const geoData = data.map(d => ({type: "Feature", geometry: {type: "Point", coordinates: [d.lon, d.lat]}, properties: d}))
    // console.log(geoData)
    const feature = g.selectAll("path")
        .data(geoData)
        .enter().append("path")
        .attr('id','dot')
        .attr("d",(d =>{
            const s = map.value.getZoom() < 14 ? 2 : 5
            const sTri = s + 3
            const isPostal = (d.properties && d.properties.type && d.properties.type.includes('邮政')) || (d.properties && d.properties.name && d.properties.name.includes('邮政'))
            const tri = (()=>{const x1 = 0, y1 = -sTri; const x2 = -sTri * 0.866, y2 = sTri * 0.5; const x3 = sTri * 0.866, y3 = sTri * 0.5; return `M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} Z`})()
            const cir = `M 0,0 m -${s},0 a ${s},${s} 0 1,0 ${2*s},0 a ${s},${s} 0 1,0 -${2*s},0`
            return isPostal ? tri : cir
        }))
        .style('pointer-events','all')
        .style('cursor','pointer')
        .attr("fill", (d => {
            const isPostal = (d.properties && d.properties.type && d.properties.type.includes('邮政')) || (d.properties && d.properties.name && d.properties.name.includes('邮政'))
            if (isPostal) {
                return '#e41a1c'
            }
            if(d.properties && d.properties.type && dataSourceFlag == true){
                if (d.properties.type.includes('工商') ) {
                    return getDotColors('中国工商银行')
                } else if (d.properties.type.includes('建设')) {
                    return getDotColors('中国建设银行')
                } else if (d.properties.type.includes('农业')) {
                    return getDotColors('中国农业银行')
                } else if (d.properties.type.includes('交通')) {
                    return getDotColors('交通银行')
                } else if (d.properties.type.includes('中国银行')) {
                    return getDotColors('中国银行')
                } else if(d.properties.type.includes('农村商业')){
                    return getDotColors('农村商业银行')
                } else {
                    return 'none'
                }
            }
            else if(d.properties && d.properties.type && dataSourceFlag == false){
                if(d.properties.name.includes('菜鸟')){
                    return getExpressDotColors('菜鸟')
                }
                else if(d.properties.name.includes('顺丰')){
                    return getExpressDotColors('顺丰')
                }
                else if(d.properties.name.includes('京东')){
                    return getExpressDotColors('京东')
                }
                else if(d.properties.name.includes('申通')){
                    return getExpressDotColors('申通')
                }
                else if(d.properties.name.includes('圆通')){
                    return getExpressDotColors('圆通')
                }
                else if(d.properties.name.includes('中通')){
                    return getExpressDotColors('中通')
                }
                else if(d.properties.name.includes('韵达')){
                    return getExpressDotColors('韵达')
                }
                else {
                    return 'none'
                }
            }
        }))
        .on('mouseover',function(e,d){
            d3.select(this).attr('stroke','black').attr('stroke-width',2)
            console.log(d.properties.name)
            d3.select('#tooltip-name').text(d.properties.name)
            d3.select('#tooltip-address').text(d.properties.address)
            d3.select('#circle-tooltip').style('display', 'block');
        })
        .on('mousemove',function(e,d){
            // 获取circle位置
            const mouseX = e.clientX + 10
            const mouseY = e.clientY + 10
            d3.select('#circle-tooltip').style('left',`${mouseX}px`).style('top', `${mouseY}px`);
        })
        .on('mouseout',function(e,d){
            d3.select(this).attr('stroke','none')
            d3.select('#circle-tooltip').style('display','none');
        })
        .on(('click'),function(e,d){
            console.log(d.properties)
            // 只能选择邮政网点
            if(d.properties.type.includes('邮政')||d.properties.name.includes('邮政')){
                // 如果已经选中了一个网点，则不允许选中其他网点
                if(selectedNetFlag.value){
                    alert("当前已选中一个网点，请先取消选中该网点。")
                    return
                }
                console.log(d.properties.name)
                //记录选中的网点的全局状态
                netSelectorStore.setSelectedNet(d.properties)
                generateGrid(d.properties.lat,d.properties.lon)
                selectedNetFlag.value = true
            }
        })

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

        const s = map.value.getZoom() < 14 ? 2 : 5
        feature.attr('d', d => {
            const isPostal = (d.properties && d.properties.type && d.properties.type.includes('邮政')) || (d.properties && d.properties.name && d.properties.name.includes('邮政'))
            const sTri = s + 3
            const tri = (()=>{const x1 = 0, y1 = -sTri; const x2 = -sTri * 0.866, y2 = sTri * 0.5; const x3 = sTri * 0.866, y3 = sTri * 0.5; return `M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} Z`})()
            const cir = `M 0,0 m -${s},0 a ${s},${s} 0 1,0 ${2*s},0 a ${s},${s} 0 1,0 -${2*s},0`
            return isPostal ? tri : cir
        })
            .attr("transform", d => {
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
// 生成网点周边网格
const generateGrid = (lat,lon) => {
    console.log("generateGrid")

    // 强制转换为数字类型
    const numericLat = parseFloat(lat);
    const numericLon = parseFloat(lon);

    const range = netSelectorStore.range;
    const gridSize = netSelectorStore.gridSize;
    console.log("range,gridSize:",range,gridSize)
    //清除已有网格
    if(map.value.gridLayer){
        console.log("remove grid")
        //删除生成的svg
        d3.select('#net-grid').remove()
        map.value.removeLayer(map.value.gridLayer)
    }
    //创建一个新的svg
    // const svg = d3.select(map.value.getPanes().overlayPane).append("svg")
    //     .attr("id","net-grid")
    //     // .attr('width',map.value.getSize().x)
    //     // .attr('height',map.value.getSize().y)
    //     .attr('width',3000)
    //     .attr('height',3000)
    //     .style('position','absolute')
    //     .style('left',0)
    //     .style('top',0)
    // const g = svg.append("g").attr("class", "leaflet-zoom-hide")

    //计算网格边界
    // 计算缓冲范围（例如，增加一倍的范围作为缓冲）
    const buffer = gridSize * 0; // 根据需要调整缓冲量
    const extendedRange = range + buffer;

    // 计算网格边界，包括缓冲区
    const bounds = {
        north: numericLat + (extendedRange / 2) / 111320,
        south: numericLat - (extendedRange / 2) / 111320,
        east: numericLon + (extendedRange / 2) / (40075000 * Math.cos(numericLat * Math.PI / 180) / 360),
        west: numericLon - (extendedRange / 2) / (40075000 * Math.cos(numericLat * Math.PI / 180) / 360)
    };
    console.log(bounds)
    const gridStore = useGridSelectorStore();
    console.log("gridStore",gridStore.boundswest,gridStore.boundseast,gridStore.boundsnorth,gridStore.boundssouth)
    gridStore.setBounds(bounds.west,bounds.east,bounds.north,bounds.south)
    console.log("bounds",gridStore.boundswest,gridStore.boundseast,gridStore.boundsnorth,gridStore.boundssouth)
    const latStep = gridSize / 111320
    const lonStep = gridSize / (40075000 * Math.cos(numericLat * Math.PI / 180) / 360)

    const numLatSteps = Math.round(range/gridSize)
    const numLonSteps = Math.round(range/gridSize)
    // console.log("Latitude Step:", gridSize / 111320);
    // console.log("Longitude Step:", gridSize / (40075000 * Math.cos(lat * Math.PI / 180) / 360));
    //生成网格数据
    var netGridData = []
    for(let i = 0;i<numLatSteps;i++){
        for(let  j = 0;j<numLonSteps;j++){
            const cellSouth = bounds.south + i * latStep
            const cellWest = bounds.west + j * lonStep
            netGridData.push({
                id:i*numLonSteps+j,
                south:cellSouth,
                west:cellWest,
                north:cellSouth + latStep,
                east:cellWest + lonStep
            })
        }
    }
    // console.log(netGridData)

    // 计算 SVG 的宽度和高度
    const topLeft = map.value.latLngToLayerPoint([bounds.north, bounds.west]);
    const bottomRight = map.value.latLngToLayerPoint([bounds.south, bounds.east]);
    const svgWidth = bottomRight.x - topLeft.x;
    const svgHeight = bottomRight.y - topLeft.y;

    // 创建 SVG 并设置宽高和位置
    const svg = d3.select(map.value.getPanes().overlayPane)
        .append("svg")
        .attr("id", "net-grid")
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('position', 'absolute')
        .style('left', topLeft.x + 'px')
        .style('top', topLeft.y + 'px');

    const g = svg.append("g").attr("class", "leaflet-zoom-hide");

    //绘制网格
    // 绑定数据并绘制网格
    const rects = g.selectAll('rect')
        .data(netGridData)
        .enter()
        .append('rect')
        .attr('class', 'net-grid-cell')
        .attr('id',d=>{
            console.log(d)
                return `netgrid-${d.id}`
        })
        .attr('x', cell => map.value.latLngToLayerPoint([cell.south, cell.west]).x-topLeft.x)
        .attr('y', cell => map.value.latLngToLayerPoint([cell.north, cell.east]).y-topLeft.y)
        .attr('width', cell => {
            const bottomLeft = map.value.latLngToLayerPoint([cell.south, cell.west]);
            const topRight = map.value.latLngToLayerPoint([cell.north, cell.east]);
            return topRight.x - bottomLeft.x;
        })
        .attr('height', cell => {
            const bottomLeft = map.value.latLngToLayerPoint([cell.south, cell.west]);
            const topRight = map.value.latLngToLayerPoint([cell.north, cell.east]);
            return bottomLeft.y - topRight.y;
        })
        .attr('fill', 'none')
        .attr('stroke', GRID_COLOR)
        .attr('stroke-width', 2)
        .style('pointer-events', 'all') // 确保矩形可以接收事件
        .on('click', function(event, d) {
            console.log("Clicked cell:", d);
            var point1 = [d.west,d.south]
            var point2 = [d.east,d.north]
            const gridStore = useGridSelectorStore();
            if (gridStore.findGrid(d.id)) {
                removeHightlight(this);
            } else {
                addHightlight(this);
            }
            gridStore.selectGrid(d.id, point1, point2);
        });

    // 保存网格层以便后续移除
    map.value.gridLayer = svg;
    // 更新网格位置 on map zoom
    map.value.on("zoomend", updateGrid);
    map.value.on("zoomend", updateGrid);
    //map.value.on("moveend", updateGrid);
    function addHightlight(grid) {
        d3.select(grid).raise();
        d3.select(grid)
            .attr("stroke", GRID_HIGHLIGHT_COLOR)
            .attr("stroke-width", 3)
    }
    function removeHightlight(grid) {
        d3.select(grid)
            .attr("stroke", GRID_COLOR)
            .attr("stroke-width", 2)
    }

    function updateGrid() {
        console.log("updateGrid");
        const topLeft = map.value.latLngToLayerPoint([bounds.north, bounds.west]);
        const bottomRight = map.value.latLngToLayerPoint([bounds.south, bounds.east]);
        const svgWidth = bottomRight.x - topLeft.x;
        const svgHeight = bottomRight.y - topLeft.y;

        svg
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .style('left', topLeft.x + 'px')
            .style('top', topLeft.y + 'px');

        rects
            .attr("x", cell => map.value.latLngToLayerPoint([cell.south, cell.west]).x - topLeft.x)
            .attr("y", cell => map.value.latLngToLayerPoint([cell.north, cell.east]).y - topLeft.y)
            .attr("width", cell => {
                const bottomLeft = map.value.latLngToLayerPoint([cell.south, cell.west]);
                const topRight = map.value.latLngToLayerPoint([cell.north, cell.east]);
                return topRight.x - bottomLeft.x;
            })
            .attr("height", cell => {
                const bottomLeft = map.value.latLngToLayerPoint([cell.south, cell.west]);
                const topRight = map.value.latLngToLayerPoint([cell.north, cell.east]);
                return bottomLeft.y - topRight.y;
            });
    }
    map.value.on("resize", () => {
        const topLeft = map.value.latLngToLayerPoint([bounds.north, bounds.west]);
        const bottomRight = map.value.latLngToLayerPoint([bounds.south, bounds.east]);
        const svgWidth = bottomRight.x - topLeft.x;
        const svgHeight = bottomRight.y - topLeft.y;

        svg
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .style('left', topLeft.x + 'px')
            .style('top', topLeft.y + 'px');
    });
}
const updateDotmapLayer = (data) => {
    // 删除旧的svg
    d3.select(map.value.getPanes().overlayPane).selectAll('#dotmapLayer').remove()
    // 过滤数据
    if(dataSourceFlag == false){
        // express
        var filterData = data.filter(d => expressValue.value.some(express => d.name.includes(express)));
    }
    else{
        // bank
        var filterData = data.filter(d => bankValue.value.some(bank => d.type.includes(bank)));
    }
    initDotmapLayer(filterData)
    //console.log("dotmapLayer is:",dotmapLayer.value)
}
const createPoiDataDotMap = (data) => {
    if (!data || data.length === 0) {
        console.error("无效数据输入");
        return;
    }

    // 过滤无效数据并生成 GeoJSON
    const geoData = data.map(d => {
      const lon = parseFloat(d.lon);
      const lat = parseFloat(d.lat);
      if (isNaN(lon) || isNaN(lat)) {
        console.error("Invalid coordinates:", d);
        return null;
      }
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: d
      };
    }).filter(Boolean);

   if (geoData.length === 0) {
      console.error("No valid data to render");
      return;
    }

    
    //console.log("createPoiDataDotMap")
    //initDotmapLayer(data)
    // 清理旧图层和事件监听
    d3.select(map.value.getPanes().overlayPane).selectAll('#poidotmapLayer').remove();
    const svg = d3.select(map.value.getPanes().overlayPane).append("svg").attr("id","poidotmapLayer")

    // 禁用整个 svg 背景的交互
    // svg.style("pointer-events", "none");  // 禁用整个 svg 的交互

    const g = svg.append("g").attr("class", "leaflet-zoom-hide")
    const transform = d3.geoTransform({point: projectPoint})
    const path = d3.geoPath().projection(transform)
    console.log("函数中的data:",data)// 正确输出数组
    console.log("Is array?", Array.isArray(data)); // 输出 true
    

    const feature = g.selectAll("g")
        .data(geoData)
        .enter()
        .append("g")
        .attr("id","dot")
    
        // 绘制外圆环
    feature.append("circle")
    .attr("class", "interactive-dot") // 添加专用类名
    .attr("r", d => map.value.getZoom() < 14 ? 1 : 4)
    .attr("fill", "none")
    .attr("stroke", "#568DBA")
    .attr("stroke-width", d => map.value.getZoom() < 14 ? 1 : 3);

    d3.select("#poidotmapLayer")
    .style("pointer-events", "none") // 禁用整个容器
    .selectAll(".interactive-dot") // 精确选择内圆
    .style("pointer-events", "auto"); // 仅允许内圆交互

    // 绘制内圆
    feature.append("circle")
        .attr("r", d => map.value.getZoom() < 14 ? 1 : 2)
        .attr("fill", "none");

    // console.log(geoData)
    feature.on('mouseover', function (e, d) {
        d3.select(this).select("circle").attr('stroke', 'black').attr('stroke-width', 2);
        console.log(d.properties.name);
        d3.select('#tooltip-name').text(d.properties.name);
        d3.select('#tooltip-address').text(d.properties.address);
        d3.select('#circle-tooltip').style('display', 'block');
    })
        .on('mousemove', function (e, d) {
            const mouseX = e.clientX + 10;
            const mouseY = e.clientY + 10;
            d3.select('#circle-tooltip').style('left', `${mouseX}px`).style('top', `${mouseY}px`);
        })
        .on('mouseout', function (e, d) {
            d3.select(this).select("circle").attr('stroke', '#568DBA').attr('stroke-width', 3);
            d3.select('#circle-tooltip').style('display', 'none');
        });

    map.value.on("zoomend", reset)
    reset()

    function reset() {
        console.log("reset geodata:",geoData)
        const bounds = path.bounds({type: "FeatureCollection", features: geoData})
        console.log("bounds:",bounds)
        const topLeft = bounds[0]
        const bottomRight = bounds[1]
        const margin = 10
        const width = bottomRight[0] - topLeft[0] + margin * 2
        const height = bottomRight[1] - topLeft[1] + margin * 2
        // 检查是否有无效值
        if (!isFinite(width) || !isFinite(height)) {
            console.error("Invalid bounds:", bounds)
            return
        }
        svg.attr("width", width)
            .attr("height", height)
            .style("left", (topLeft[0] - margin) + "px")
            .style("top",(topLeft[1] - margin) + "px")

 
        g.attr("transform", "translate(" + (-topLeft[0] + margin) + "," + (-topLeft[1] + margin) + ")")

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

const createAggregationLayer = () => {
    //console.log("createTestLayer")
    var markers = L.markerClusterGroup({chunkedLoading:false})
    // 过滤掉无效的数据点
    const validPoiData = poiData.filter(d => d && d.lat != null && d.lon != null)
    // 添加有效的数据点到 markers
    validPoiData.forEach(d => {
        markers.addLayer(L.marker([d.lat, d.lon]))
    })
    aggregationLayer.value.addLayer(markers)
}
watch(pathID,()=>{
    console.log(pathID.value)
    // 将已经选择的所有网格高亮为red
    const gridStore = useGridSelectorStore();

    // 获取所有已选择的网格的 ID
    const selectedGridIDs = Array.from(gridStore.grids.keys());  // 获取所有已选网格的 ID

    // 高亮已选择的网格的边框为红色
    selectedGridIDs.forEach(gridID => {
        d3.select(`#grid-${gridID}`)
            .raise()       
            .attr("stroke", GRID_HIGHLIGHT_COLOR)
            .attr("stroke-width", 2)
        d3.select(`#netgrid-${gridID}`)
            .raise()       
            .attr("stroke", GRID_HIGHLIGHT_COLOR)
            .attr("stroke-width", 2)
    });

    // 根据pathID高亮rect
    d3.select(`#grid-${pathID.value}`)
            .raise()       
            .attr("stroke", GRID_PATH_COLOR)
            .attr("stroke-width", 2)
    d3.select(`#netgrid-${pathID.value}`)
            .raise()       
            .attr("stroke", GRID_PATH_COLOR)
            .attr("stroke-width", 2)
    
})

watch(city, (newCity) => {
    console.log(newCity)
    const selectedCity = newCity[newCity.length - 1]
    const coords = getCity(cities,selectedCity)
    console.log(coords)
  if (map.value && coords) {
    //判断newCity的长度
    if(newCity.length > 1){
        map.value.setView(coords, 13)
    }
    else{
        map.value.setView(coords, 11)
    }
    if(map.value.hasLayer(dotmapLayer.value)){
        updateDotmapLayer(poiData)
    }
    //initGridLayer(gridData)
    controlGridLayer()
  }
})
watch(bankValue, (newBankValue) => {
  if (map.value && poiData && bankValue.value.length > 0) {
    updateDotmapLayer(poiData)
  }
  else{
    d3.select(map.value.getPanes().overlayPane).select('#dotmapLayer').selectAll('*').remove()
  }

})
watch(expressValue, (newExpressValue) => {
  if (map.value && poiData && expressValue.value.length > 0) {
    updateDotmapLayer(poiData)
  }
  else{
    d3.select(map.value.getPanes().overlayPane).select('#dotmapLayer').selectAll('*').remove()
  }
})
watch(dataSource, (newDataSource) => {
  // newDataSource 直接是 'express' 或 'allBank'
  if (!['express', 'allBank'].includes(newDataSource)) return;

  dataSourceFlag = (newDataSource === 'allBank'); // allBank → true, express → false

  fetch(`/api/data?source=${newDataSource}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      poiData = data; // 后端已返回结构化数据

      // 更新热力图
      if (heatmapLayer.value && map.value.hasLayer(heatmapLayer.value)) {
        heatmapLayer.value.setLatLngs(poiData.map(d => [d.lat, d.lon]));
      }

      // 更新点图层
      if (dotmapLayer.value && map.value.hasLayer(dotmapLayer.value)) {
        dotmapLayer.value.clearLayers();
        updateDotmapLayer(poiData);
      }

      // 更新聚合图层
      if (aggregationLayer.value && map.value.hasLayer(aggregationLayer.value)) {
        aggregationLayer.value.clearLayers();
        createAggregationLayer();
      }
    })
    .catch(error => {
      console.error('加载数据失败:', error);
      // 可选：清空当前数据或提示用户
      poiData = [];
    });
});

// watch(dataSource,(newdataSource)=>{
//     //express\bank
//     console.log(newdataSource) 

//     if(newdataSource === 'express'){
//         dataSourceFlag = false
//         // 更改poiData为物流数据
//         d3.csv('/express.csv').then((data) => {
//             poiData = data.map((d) => {
//                 return {lat: d.lat, lon: d.lon, name: d.name, type: d.type,address:d.address}
//             })
//             // console.log(poiData)
//             // 判断是否选中了热力图层???
//             if(heatmapLayer.value && map.value.hasLayer(heatmapLayer.value)){
//                 //heatmapLayer.value.remove()
//                 console.log(heatmapLayer.value)
//                 heatmapLayer.value.setLatLngs(poiData.map(d => [d.lat, d.lon]))
//                 //heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 30, blur: 25, maxZoom: 10,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#81ea8f', 0.7: '#eef48e', 0.85: '#fac581',1:'#ec9073'}}).addTo(map.value)
//             }
//            //图层控件中选择了兴趣点层才更新
//             if(dotmapLayer.value && map.value.hasLayer(dotmapLayer.value)){
//                 dotmapLayer.value.clearLayers()
//                 updateDotmapLayer(poiData)
//             }
//             if(aggregationLayer.value && map.value.hasLayer(aggregationLayer.value)){
//                 aggregationLayer.value.clearLayers()
//                 createAggregationLayer()
//             }
//         })
//     }
//     else{
//         dataSourceFlag = true
//         // 更改poiData为银行数据
//         d3.csv('/allBank.csv').then((data) => {
//             poiData = data.map((d) => {
//                 return {lat: d.lat, lon: d.lon, name: d.name, type: d.type,address:d.address}
//             })
//             if(heatmapLayer.value && map.value.hasLayer(heatmapLayer.value)){
//                 //heatmapLayer.value.remove()
//                 console.log(heatmapLayer.value)
//                 heatmapLayer.value.setLatLngs(poiData.map(d => [d.lat, d.lon]))
//                 //heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 30, blur: 25, maxZoom: 10,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#81ea8f', 0.7: '#eef48e', 0.85: '#fac581',1:'#ec9073'}}).addTo(map.value)
//             }
//             // console.log(poiData)
//             if(dotmapLayer.value && map.value.hasLayer(dotmapLayer.value)){
//                 dotmapLayer.value.clearLayers()
//                 updateDotmapLayer(poiData)
//             }
//             if(aggregationLayer.value && map.value.hasLayer(aggregationLayer.value)){
//                 aggregationLayer.value.clearLayers()
//                 createAggregationLayer()
//             }
//         })
//     }
// })

// watch(
//   () => poiStore.poiIndustryData,
//   (newPoiData) => {
//     console.log("newPoiData length",newPoiData.length)
//     if (newPoiData.length > 0) {
//       createPoiDataDotMap(newPoiData);
//     }
//   }
// );
// 维护颜色分配状态，放在 watch 外部以保持持久性
const colorAssignments = ref({})
const colorPalette = ['#3070CC', '#CB1C45']
watch(
  () => poiStore.poiIndustryData,
  (newVal) => {
    // 移除旧的散点图层
    d3.select("#poiDotsLayer").remove();

    if (!newVal || newVal.length === 0) {
        colorAssignments.value = {}; // 数据清空时重置
        return;
    }

    // 获取当前数据中包含的所有唯一行业类型
    const uniqueTypes = [...new Set(newVal.map(d => d.type))];
    
    // 1. 清理：移除不再存在的行业的颜色分配
    for (const type in colorAssignments.value) {
        if (!uniqueTypes.includes(type)) {
            delete colorAssignments.value[type];
        }
    }

    // 2. 分配：为新出现的行业分配剩余颜色
    uniqueTypes.forEach(type => {
        if (!colorAssignments.value[type]) {
            // 获取当前已使用的颜色
            const usedColors = Object.values(colorAssignments.value);
            // 找到第一个未使用的颜色
            const availableColor = colorPalette.find(c => !usedColors.includes(c));
            // 如果有可用颜色则分配，否则默认使用第一个颜色
            colorAssignments.value[type] = availableColor || colorPalette[0];
        }
    });

    const svg = d3.select(map.value.getPanes().overlayPane).append("svg")
        .attr("id", "poiDotsLayer")
        .attr("class", "leaflet-zoom-hide")
        .style("pointer-events", "none");
        
    const g = svg.append("g");

    function update() {
        // 简单的投影转换逻辑
        const features = newVal.map(d => {
            const point = map.value.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
            return { ...d, x: point.x, y: point.y };
        });

        if (features.length === 0) return;

        const bounds = map.value.getBounds();
        const topLeft = map.value.latLngToLayerPoint(bounds.getNorthWest());
        
        // 重置 SVG 位置
        const mapSize = map.value.getSize();
        svg.attr("width", mapSize.x).attr("height", mapSize.y)
           .style("left", topLeft.x + "px").style("top", topLeft.y + "px");
        
        g.attr("transform", `translate(${-topLeft.x}, ${-topLeft.y})`);

        const circles = g.selectAll("circle").data(features);
        
        circles.enter().append("circle")
            .merge(circles)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", function() {
                return map.value.getZoom() < 16 ? 4 : 5;
            })
            .attr("fill", d => colorAssignments.value[d.type] || '#333') // 使用持久化的颜色映射
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .style("pointer-events", "auto") // 关键：开启圆点的鼠标交互
            .on("mouseover", function(e, d) {
                d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
                // 更新提示框内容
                d3.select('#tooltip-name').text(d.name);
                d3.select('#tooltip-address').text(d.address);
                d3.select('#circle-tooltip').style('display', 'block');
            })
            .on("mousemove", function(e) {
                // 跟随鼠标移动
                const mouseX = e.clientX + 10;
                const mouseY = e.clientY + 10;
                d3.select('#circle-tooltip').style('left', `${mouseX}px`).style('top', `${mouseY}px`);
            })
            .on("mouseout", function() {
                // 恢复样式并隐藏提示框
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
                d3.select('#circle-tooltip').style('display', 'none');
            });
            
        circles.exit().remove();
    }

    map.value.on("zoomend moveend", update);
    update(); // 初始绘制
  },
  { deep: true }
)

const getPoiMax = async () => {
    const response = await fetch('/api/get_poiNum', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const data = await response.json();
    console.log("poi",data.poiMax)
    poiMax = data.poiMax
}
onMounted(()=>{
    const coords = getCity(cities,city.value)
    const [wgsLat, wgsLng] = [coords[0], coords[1]]
    //const [wgsLat, wgsLng] = gcj02ToWgs84(coords[0], coords[1]); // 调整参数顺序
    map.value = L.map('mapContainer', {attributionControl: false,
    layers:[baseMapLayer]
    }
    ).setView([wgsLat,wgsLng], 11)
    
    // getPoiMax();

    d3.csv('/allBank.csv').then((data) => {
        //console.log(data)
    poiData = data.map((d) => {
        return {lat: d.lat, lon: d.lon, name: d.name, type: d.type,address:d.address}
    })

    // d3.json('/grid_1000.geojson').then(function(data) {
    //     // 处理加载的数据
    //     // console.log("js"+JSON.stringify(data)); // 输出 GeoJSON 数据到控制台
    //     gridData = data
    //     // initGridLayer(gridData)
    // }).catch(function(error) {
    //     console.error("Error loading the GeoJSON file:", error);
    // });

    // gridData = JSON.parse(grid_data)
    heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 30, blur:20, maxZoom: 14,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#A1EE7E', 0.7: '#FAC57E', 0.9: '#EE9C82'}})

    gridLayer.value = L.layerGroup()
    dotmapLayer.value = L.layerGroup()
    //initDotmapLayer(poiData)
    aggregationLayer.value = L.layerGroup()
    // 更新 overlayMaps
    overlayMaps["热力层"] = heatmapLayer.value;
    //overlayMaps["网格层"] = gridLayer.value;
    overlayMaps["兴趣点层"] = dotmapLayer.value;
    overlayMaps['聚合点层'] = aggregationLayer.value
    //console.log(overlayMaps)
    createMap()
    })
})
</script>

<template>
    <div style="height: 99%;">
        <div class="controlBar">
            <div class="controlbar-content">
                <span style="font-weight: bold;margin-right:10px">城市选择</span>
                <!-- <el-select v-model="city" placeholder="Select" style="width: 70%;">
                    <el-option v-for="(latlon,cityname) in cities" :key="cityname" :label="cityname" :value="cityname"></el-option>
                </el-select> -->
                <!-- 级联选择器:城市、区县 -->
                <el-cascader v-model="city" :options="cities" :props="props1" clearable />
            </div>
            <div class="controlbar-content">
                <span style="font-weight: bold;margin-right:10px">数据源选择</span>
                <el-radio-group v-model="dataSource" fill="#98b9d5">
                    <el-radio-button label="银行" value="allBank"></el-radio-button>
                    <el-radio-button label="物流" value="express"></el-radio-button>
                </el-radio-group>
            </div>
            <div class="controlbar-content" v-show="dataSourceFlag">
                <span style="font-weight: bold;margin-right:10px">筛选</span>
                <el-select v-model="bankValue" multiple collapse-tags  style="width: 70%;"  placeholder="请选择">
                    <el-option v-for="(color,type) in dotColors" :key="type" :label="type" :value="type"></el-option>
                </el-select>
            </div>
            <div class="controlbar-content" v-show="!dataSourceFlag">
                <span style="font-weight: bold;margin-right:10px">筛选</span>
                <el-select v-model="expressValue" multiple collapse-tags style="width: 70%;" placeholder="请选择" >
                    <el-option v-for="(color,type) in expressDotColors" :key="type" :label="type" :value="type"></el-option>
                </el-select>
            </div>
            <!-- <div class="controlbar-content">
                <el-button :disabled="!selected" @click="addComparison">+比较</el-button>
            </div> -->
            <div class="controlbar-content">
                <el-button  @click="clearGrid">-清除</el-button>
            </div>
        </div>
        <div id="mapContainer" style="height: 100%;width:100%;">
            <div id="circle-tooltip">
                名称：<span id="tooltip-name"></span><br>
                地址：<span id="tooltip-address"></span>
            </div>
            <l-sidepanel id="rightPanel" :headings tabsPosition="top" position="right">

                <template #[`heading.1`]>
                    市场经营主体分析
                </template>
                <l-sidepanel-tab link="1">
                    <detailTable></detailTable>
                </l-sidepanel-tab>
            </l-sidepanel>
        </div>
    </div>

</template>

<style>
svg.overlay {
    pointer-events: none;
}
.controlBar{
    height: 3%;
    width: 100%;
    display: flex;
    padding: 5px;
    margin: 2px;
    align-items: center;
}
.controlbar-content{
    /* width:35% ; */
    display: flex;
    flex-direction: row;
    margin:0 auto;
    align-items: center;
    justify-content: center;
}
.leaflet-container{
    opacity: 0.75
}
#rightPanel{
    width: 32rem;
}
.card{
    width: 100%;
    display: grid;
    grid-template-columns: 6fr 1fr;
}
.progress{
    width: 100%;
    display: grid;
    grid-template-columns: 4fr 1fr;
}
.button{
    margin:2px;
    align-content: center;
}
#circle-tooltip{
    display: none;
    position: fixed;
    background-color: #f9f9f9;
    border: 1px solid #000;
    border-radius: 5px;
    padding: 5px;
    z-index: 1100;
  }
</style>
