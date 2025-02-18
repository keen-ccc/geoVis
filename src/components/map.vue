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
import {dotColors,expressDotColors,getDotColors,getExpressDotColors} from '../utils/getColor.js';
import detailTable from './detailTable.vue';
import { color } from 'echarts';
import {useGridSelectorStore} from '@/store/gridSelector'
import {pathGridStore} from '@/store/pathSelector'
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

var selected = ref(false)
var selectedGrid = null 
const map =ref(null)
const city = ref('成都市')
const bankValue = ref(['中国工商银行','中国建设银行','中国农业银行','交通银行','中国银行'])
const expressValue = ref(['菜鸟','顺丰','京东','申通','圆通','中通','韵达','邮政'])
const dataSource = ref('bank')
const pathStore = pathGridStore()
const {pathID} = storeToRefs(pathStore)
let dataSourceFlag = true // true:银行  false:物流
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
    maxZoom: 16,
    minZoom: 6,
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
    if(zoomLevel < 14 && map.value.hasLayer(dotmapLayer.value)){
        d3.selectAll('#dot').attr('r',2)
    }
    else if(map.value.hasLayer(dotmapLayer.value)){
        d3.selectAll('#dot').attr('r',5)
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
    const res = await fetch('http://localhost:5000/api/cal_poiNum', {
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
    // console.log(left, top, width, height)
    // html2canvas(mapElement,{
    //     scale: window.devicePixelRatio,
    //     x: left,
    //     y: top,
    //     width: width,
    //     height: height
    // }).then(canvas => {
    //     imgUrl = canvas.toDataURL();
    //     const newCard = {title:'block', score:60, grid: gridID.value , imgUrl: imgUrl}
    //     comparisonCards.value.push(newCard)
    // })
    
    // function convertLatLngToPixel(bound){
    //     // console.log(bound.latStart, bound.latEnd)
    //     const point1 = map.value.latLngToLayerPoint(new L.LatLng(bound.latStart,bound.lonStart));
    //     const point2 = map.value.latLngToLayerPoint(new L.LatLng(bound.latEnd,bound.lonEnd));
        
    //     console.log(point1, point2)
    //     const left = point1.x
    //     const top = point2.y
    //     const width = point2.x - point1.x
    //     const height = point1.y - point2.y

    //     return {left, top, width, height}
    // }
    
}

const deleteComparison = (index) => {
    comparisonCards.value.splice(index, 1);
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
            bankValue.value = ['中国工商银行','中国建设银行','中国农业银行','交通银行','中国银行']
            updateDotmapLayer(poiData)
        }
        if(e.name == '兴趣点层' && expressValue.value.length !== 7){
            expressValue.value =['菜鸟','顺丰','京东','申通','圆通','中通','韵达','邮政']
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
        if(e.name == '网格图'){
            initGridLayer(gridData)
            // var cols = getFileName()
            // var name = '/grid500/grid_500_'+cols[0]+'.geojson'
            // console.log("name", name)
            // d3.json(name).then(function(data) {
            //     // 处理加载的数据
            //     // console.log("js"+JSON.stringify(data)); // 输出 GeoJSON 数据到控制台
            //     gridData = data
            //     // console.log("js"+JSON.stringify(data)); // 输出 GeoJSON 数据到控制台
            //     if(cols[1] !== cols[0]) {
            //         name = '/grid500/grid_500_'+cols[1]+'.geojson'
            //         d3.json(name).then(function(data) {
            //             gridData.features.push(...data.features)
            //             initGridLayer(gridData)
                        
            //         }).catch(function(error) {
            //             console.error("Error loading the GeoJSON file:", error);
            //         });
            //     } else {
            //         console.log("js"+JSON.stringify(gridData)); // 输出 GeoJSON 数据到控制台
            //         initGridLayer(gridData)
            //     }
                
            //     // initGridLayer(gridData)
            // }).catch(function(error) {
            //     console.error("Error loading the GeoJSON file:", error);
            // });
            
        }
    })
    map.value.on('overlayremove',(e)=>{
        if(e.name == '兴趣点层'){
            console.log('remove 兴趣点')
            //删除生成的svg
            d3.select(map.value.getPanes().overlayPane).selectAll('#dotmapLayer').remove()
        }
        if(e.name == '网格图'){
            console.log('remove 网格')
            //删除生成的svg
            d3.select(map.value.getPanes().overlayPane).selectAll('#gridSvg').remove()
        }
        if(e.name == '热力层'){
            console.log('remove')
            heatmapLayer.value.remove()
        }
        if(e.name == '聚合点层'){
            aggregationLayer.value.clearLayers()
        }
    })
    // createGrid()
    // createAggregationLayer()
    // 如果热力图层已初始化，则添加到地图
    // if (heatmapLayer.value) {
    //     heatmapLayer.value.addTo(map.value);
    // }
    // // 如果点图层已初始化，则添加到地图
    // if(dotmapLayer.value){
    //     dotmapLayer.value.addTo(map.value)
    // }
    // if(testLayer.value){
    //     testLayer.value.addTo(map.value)
    // }
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
    //svg.raise()
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

        // const grid_size = 1000
        const grid_width = 0.008983111749910169
        const grid_height = 0.010391927140799718

        // var simple_data = JSON.parse(grid_data).filter(item => item.longitude >= lonStart-grid_width && item.longitude <= lonEnd+grid_width && item.latitude >= latStart-grid_height && item.latitude <= latEnd+grid_height)

        console.log("lonStart-grid_width")
        console.log(lonStart-grid_width)
        console.log(lonEnd+grid_width)
        var simple_geo_data = data.features.filter(item => item.geometry.coordinates[0][0][0] >= lonStart-grid_width && item.geometry.coordinates[0][0][0] <= lonEnd+grid_width && item.geometry.coordinates[0][0][1] >= latStart-grid_height && item.geometry.coordinates[0][0][1] <= latEnd+grid_height)

        console.log("simple"+simple_geo_data.length)
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
            .attr('id',d=>{
                return `grid-${d.properties.id}`
            })
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
            // .attr("fill", "blue")
            .attr("fill-opacity", 0.05)
            .attr("stroke",d => {
                // console.log(pathID.value,d.properties.id)
                // if(pathID.value == d.properties.id){
                //     console.log("red")
                //     return "red"
                // }
                // else{
                //     return "#737373"
                // }
                return "#737373"
            })
            .attr("stroke-width", 1)
            //.attr('pointer-events','all')
            .on("click", function(e, d){
                console.log(d)
                const gridStore = useGridSelectorStore();
                var point1 = d.geometry.coordinates[0][0];
                var point2 = d.geometry.coordinates[0][2];
                // Math.min(point1[1],point2[1])==latStart && Math.min(point1[0],point2[0])==lonStart
                if(!selected.value){
                    addHightlight(this)
                    selected.value = true;
                    gridStore.selectGrid(d.properties.id, point1, point2)
                    console.log("properties",gridStore.bound)
                    selectedGrid = this
                    //console.log(gridStore.bound)
                } else if(selectedGrid == this) {
                    selected.value = false;
                    removeHightlight(this)
                    gridStore.cancelGrid()
                } else {
                    gridStore.selectGrid(d.properties.id, point1, point2);
                    addHightlight(this)
                    removeHightlight(selectedGrid)
                    selectedGrid = this
                }
                
            });
            
    }

    function addHightlight(grid) {
        d3.select(grid).raise();
        d3.select(grid)
            .attr("stroke", "red")
            .attr("stroke-width", 2)
    }

    function removeHightlight(grid) {
        d3.select(grid)
            .attr("stroke", "#737373")
            .attr("stroke-width", 1)
    }

    function projectPoint(x, y) {
        const point = map.value.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }
}

const initDotmapLayer = (data) => {
    //dotmapLayer.value = L.layerGroup()
    const svg = d3.select(map.value.getPanes().overlayPane).append("svg").attr("id","dotmapLayer")
    //svg.lower();
    const g = svg.append("g").attr("class", "leaflet-zoom-hide")

    const transform = d3.geoTransform({point: projectPoint})
    const path = d3.geoPath().projection(transform)

    const geoData = data.map(d => ({type: "Feature", geometry: {type: "Point", coordinates: [d.lon, d.lat]}, properties: d}))
    // console.log(geoData)
    const feature = g.selectAll("circle")
        .data(geoData)
        .enter().append("circle")
        .attr('id','dot')
        .attr("r",(d =>{
            if(map.value.getZoom() < 14){
                return 2
            }
            else{
                return 5
            }
        }))
        .attr("fill", (d => {
            if(d.properties && d.properties.type && dataSourceFlag == true){
                if (d.properties.type.includes('中国工商银行') ) {
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
                else if(d.properties.name.includes('邮政')){
                    return getExpressDotColors('邮政')
                }
                else{
                    // 不显示
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
            const bbox = this.getBoundingClientRect()
            const mouseX = bbox.x - bbox.width
            const mouseY = bbox.y - bbox.height - 30
            // const mouseX = e.clientX
            // const mouseY = e.clientY - 40
            console.log(mouseX, mouseY)
              //console.log(mouseX, mouseY);
            d3.select('#circle-tooltip').style('left',`${mouseX}px`).style('top', `${mouseY}px`);
        })
        .on('mouseout',function(e,d){
            d3.select(this).attr('stroke','none')
            d3.select('#circle-tooltip').style('display','none');
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

const createAggregationLayer = () => {
    //console.log("createTestLayer")
    var markers = L.markerClusterGroup({chunkedLoading:true})
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
    // 取消网格高亮
    d3.selectAll('rect')            
            .attr("stroke", "#737373")
            .attr("stroke-width", 1)
    // 根据pathID高亮rect
    d3.select(`#grid-${pathID.value}`)
            .raise()       
            .attr("stroke", "red")
            .attr("stroke-width", 2)
})

watch(city, (newCity) => {
  if (map.value && getCity(newCity)) {
    map.value.setView(getCity(newCity), 10)
    if(map.value.hasLayer(dotmapLayer.value)){

        updateDotmapLayer(poiData)
    }
    initGridLayer(gridData)
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
watch(dataSource,(newdataSource)=>{
    //express\bank
    console.log(newdataSource) 

    if(newdataSource === 'express'){
        dataSourceFlag = false
        // 更改poiData为物流数据
        d3.csv('/express.csv').then((data) => {
            poiData = data.map((d) => {
                return {lat: d.lat, lon: d.lon, name: d.name, type: d.type,address:d.address}
            })
            // console.log(poiData)
            // 判断是否选中了热力图层???
            if(heatmapLayer.value && map.value.hasLayer(heatmapLayer.value)){
                //heatmapLayer.value.remove()
                console.log(heatmapLayer.value)
                heatmapLayer.value.setLatLngs(poiData.map(d => [d.lat, d.lon]))
                //heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 30, blur: 25, maxZoom: 10,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#81ea8f', 0.7: '#eef48e', 0.85: '#fac581',1:'#ec9073'}}).addTo(map.value)
            }
           //图层控件中选择了兴趣点层才更新
            if(dotmapLayer.value && map.value.hasLayer(dotmapLayer.value)){
                dotmapLayer.value.clearLayers()
                updateDotmapLayer(poiData)
            }
            if(aggregationLayer.value && map.value.hasLayer(aggregationLayer.value)){
                aggregationLayer.value.clearLayers()
                createAggregationLayer()
            }
        })
    }
    else{
        dataSourceFlag = true
        // 更改poiData为银行数据
        d3.csv('/jpBank.csv').then((data) => {
            poiData = data.map((d) => {
                return {lat: d.lat, lon: d.lon, name: d.name, type: d.type,address:d.address}
            })
            if(heatmapLayer.value && map.value.hasLayer(heatmapLayer.value)){
                //heatmapLayer.value.remove()
                console.log(heatmapLayer.value)
                heatmapLayer.value.setLatLngs(poiData.map(d => [d.lat, d.lon]))
                //heatmapLayer.value = L.heatLayer(poiData.map(d => [d.lat,d.lon]), {radius: 30, blur: 25, maxZoom: 10,gradient:{0.1: '#89dae8', 0.3: '#87eedc', 0.5: '#81ea8f', 0.7: '#eef48e', 0.85: '#fac581',1:'#ec9073'}}).addTo(map.value)
            }
            // console.log(poiData)
            if(dotmapLayer.value && map.value.hasLayer(dotmapLayer.value)){
                dotmapLayer.value.clearLayers()
                updateDotmapLayer(poiData)
            }
            if(aggregationLayer.value && map.value.hasLayer(aggregationLayer.value)){
                aggregationLayer.value.clearLayers()
                createAggregationLayer()
            }
        })
    }
})
const getPoiMax = async () => {
    const response = await fetch('http://localhost:5000/api/get_poiNum', {
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
    map.value = L.map('mapContainer', {attributionControl: false,
    layers:[baseMapLayer]
}
    ).setView(getCity(city.value), 11)
    
    // getPoiMax();
    
    d3.csv('/jpBank.csv').then((data) => {
        //console.log(data)
    poiData = data.map((d) => {
        return {lat: d.lat, lon: d.lon, name: d.name, type: d.type,address:d.address}
    })

    d3.json('/grid_1000.geojson').then(function(data) {
        // 处理加载的数据
        // console.log("js"+JSON.stringify(data)); // 输出 GeoJSON 数据到控制台
        gridData = data
        // initGridLayer(gridData)
    }).catch(function(error) {
        console.error("Error loading the GeoJSON file:", error);
    });

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
    <div style="height: 100%;">
        <div class="controlBar">
            <div class="controlbar-content">
                <span style="font-weight: bold;margin-right:10px">城市选择</span>
                <el-select v-model="city" placeholder="Select" style="width: 70%;">
                    <el-option v-for="(latlon,cityname) in cities" :key="cityname" :label="cityname" :value="cityname"></el-option>
                </el-select>
            </div>
            <div class="controlbar-content">
                <span style="font-weight: bold;margin-right:10px">数据源选择</span>
                <el-radio-group v-model="dataSource" fill="#98b9d5">
                    <el-radio-button label="银行" value="bank"></el-radio-button>
                    <el-radio-button label="物流" value="express"></el-radio-button>
                </el-radio-group>
            </div>
            <div class="controlbar-content" v-show="dataSourceFlag">
                <span style="font-weight: bold;margin-right:10px">银行筛选</span>
                <el-select v-model="bankValue" multiple collapse-tags  style="width: 70%;"  placeholder="请选择">
                    <el-option v-for="(color,type) in dotColors" :key="type" :label="type" :value="type"></el-option>
                </el-select>
            </div>
            <div class="controlbar-content" v-show="!dataSourceFlag">
                <span style="font-weight: bold;margin-right:10px">物流筛选</span>
                <el-select v-model="expressValue" multiple collapse-tags style="width: 70%;" placeholder="请选择" >
                    <el-option v-for="(color,type) in expressDotColors" :key="type" :label="type" :value="type"></el-option>
                </el-select>
            </div>
            <div class="controlbar-content">
                <el-button :disabled="!selected" @click="addComparison">+比较视图</el-button>
            </div>
        </div>
        <div id="mapContainer" style="height: 100%;width:100%;">
            <div id="circle-tooltip">
                名称：<span id="tooltip-name"></span><br>
                地址：<span id="tooltip-address"></span>
            </div>
            <l-sidepanel id="rightPanel" :headings tabsPosition="top" position="right">
                <template #[`heading.1`]>
                    网格比较
                </template>
                <l-sidepanel-tab id="panel1" link="1">
                    <!-- <img :src="picPath"> -->
                    <div v-for="(card, index) in comparisonCards" :key="index" class="card">
                        <div>
                            <h3>{{ card.grid }}</h3>
                            <!-- <img :src="card.imgUrl"  alt="Card Image"/>
                            <p>{{ card.imgUrl }}</p> -->
                            <p style="margin: 0;">餐饮</p>
                            <div class="progress">
                                <el-progress :percentage="card.canyin/poiMax*100" :show-text="false">
                                    <!-- <el-button text>content</el-button> -->
                                </el-progress>
                                <p style="text-align: center; margin: 0;">{{ card.canyin }}</p>
                            </div>
                            
                            <p style="margin: 0;">企业</p>
                            <div class="progress">
                                <el-progress :percentage="card.company/poiMax*100" :show-text="false"/>
                                <p style="text-align: center; margin: 0;">{{ card.company }}</p>
                            </div>
                            
                            <p style="margin: 0;">商场</p>
                            <div class="progress">
                                <el-progress :percentage="card.mall/poiMax*100" :show-text="false"/>
                                <p style="text-align: center; margin: 0;">{{ card.mall }}</p>
                            </div>
                            
                            <p style="margin: 0;">银行</p>
                            <div class="progress">
                                <el-progress :percentage="card.bank/poiMax*100" :show-text="false"/>
                                <p style="text-align: center; margin: 0;">{{ card.bank }}</p>
                            </div>
                            
                            <p style="margin: 0;">物流</p>
                            <div class="progress">
                                <el-progress :percentage="card.express/poiMax*100" :show-text="false"/>
                                <p style="text-align: center; margin: 0;">{{ card.express }}</p>
                            </div>
                            
                        </div>
                        <div class="button">
                            <el-button size="small" :icon="Delete" circle @click="deleteComparison(index)"/>
                        </div>
                    </div>
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
    width:35% ;
    display: flex;
    align-items: center;
    justify-content: center;
}
.leaflet-container{
    opacity: 0.75
}
#panel1{
    width: 400px;
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
    position: absolute;
    background-color: #f9f9f9;
    border: 1px solid #000;
    border-radius: 5px;
    padding: 5px;
    z-index: 1100;
  }
</style>
