<script setup>
import { ref,onMounted,watch} from 'vue'
import * as d3 from 'd3'
import * as echarts from 'echarts';
import {useGridSelectorStore} from '@/store/gridSelector'
import { storeToRefs } from 'pinia'
import { reactive } from 'vue';

const radar = ref(null)
const radarAxis = ['人口密度', '平均房价', 'POI密度', 'POI多样性']
const data = ref([])
const lastItem = ref(data.value[data.value.length-1])
var gridSelected = false
var lastItemValue = reactive([])
const populationWeight = ref(0.13)
const housePriceWeight = ref(0.43)
const poiDensityWeight = ref(0.36)
const poiDiversityWeight = ref(0.31)
var pathSelected = false
const gridStore = useGridSelectorStore()
const { bound } = storeToRefs(gridStore);

var populationScale,housePriceScale,poiDensityScale,poiDiversityScale,scoreScale = null;
var populationMax,housePriceMax,poiDensityMax,poiDiversityMax,scoreMax = null;
var populationMin,housePriceMin,poiDensityMin,poiDiversityMin,scoreMin = null;
const fetchData = async (bound) => {
    const params = {
            start_lon:bound.lonStart,
            start_lat:bound.latStart,
            end_lon:bound.lonEnd,
            end_lat:bound.latEnd,
            populationWeight:populationWeight.value,
            housePriceWeight:housePriceWeight.value,
            poiDensityWeight:poiDensityWeight.value,
            poiDiversityWeight:poiDiversityWeight.value
    }
    //console.log(params)
    const res = await fetch('http://localhost:5000/api/cal_score',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(params)
    })
        const result = await res.json()
        data.value.push(result)
        console.log("radar data:",data.value)

            // 计算每个指标的最大值和最小值
        populationMax = d3.max(data.value, d => d.value[0]);
        housePriceMax = d3.max(data.value, d => d.value[1]);
        poiDensityMax = d3.max(data.value, d => d.value[2]);
        poiDiversityMax = d3.max(data.value, d => d.value[3]);

        populationMin = d3.min(data.value, d => d.value[0]);
        housePriceMin = d3.min(data.value, d => d.value[1]);
        poiDensityMin = d3.min(data.value, d => d.value[2]);
        poiDiversityMin = d3.min(data.value, d => d.value[3]);

        scoreMax = d3.max(data.value, d => d.score);
        scoreMin = d3.min(data.value, d => d.score);

        //createRadar()
}
const createRadar = () => {
    d3.select(radar.value).selectAll('*').remove()

    const svgHeight = radar.value.clientHeight
    const svgWidth = radar.value.clientWidth
    const svg = d3.select(radar.value)
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${svgWidth / 2},${svgHeight})`);
    
    const radius = Math.min(svgWidth, svgHeight) - 10;
    const angleSlice = Math.PI * 2/9;
    
    console.log('radius:',radius)
    //console.log(populationMax,housePriceMax,poiDensityMax,poiDiversityMax,scoreMax)
    console.log(populationMin,housePriceMin,poiDensityMin,poiDiversityMin,scoreMin)
    // 动态设置比例尺的 domain
    populationScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, populationMax]);
    housePriceScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, housePriceMax]);
    poiDensityScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, poiDensityMax]);
    poiDiversityScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, poiDiversityMax]);
    scoreScale = d3.scaleLinear()
        .range([-Math.PI/2,Math.PI/2])
        .domain([0, scoreMax]);


    const rScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, 1]);
    const radarLine = d3.lineRadial()
        .radius((d,i)=>{
            switch(i){
                case 0:
                    return populationScale(d)
                case 1:
                    return housePriceScale(d)
                case 2:
                    return poiDensityScale(d)
                case 3:
                    return poiDiversityScale(d)
            }
        })
        .angle((d, i) => i * angleSlice - Math.PI/2 + Math.PI/6)
        .curve(d3.curveCardinal);
    
    //两个圆之间填充颜色 创建比例尺
    // const arcScale = d3.scaleLinear()
    //     .range([-Math.PI/2,Math.PI/2])
    //     .domain([0,1])

    data.value.forEach(d => {
        svg.append("path")
            .datum(d.value)
            .attr("d", radarLine)
            // .attr('id',d.name)
            .attr("class", "radarPath")
            .style("fill", "none")
            .style("stroke", "#BCBCBC")
            .style("stroke-width", 2)
            .style('stroke-opacity',0.8)
            .on('click',function(){
                console.log(d3.select(this).style('stroke'))
                svg.selectAll('path').style('stroke','#BCBCBC').style('stroke-width',2)
                if(d3.select(this).style('stroke') === 'rgb(188, 188, 188)'){
                    d3.select(this).style('stroke','rgb(126, 168, 203)').style('stroke-width',4)
                }
                d3.selectAll('.arcFill').remove()
                d3.selectAll('.arcText').remove()
                const arc = d3.arc()
                    .innerRadius(radius*0.2)
                    .outerRadius(radius*0.25)
                    .startAngle(-Math.PI)
                    .endAngle(scoreScale(d.score))
                svg.append('path')
                    .attr('class','arcFill')
                    .attr('d',arc)
                    .attr('fill','#1d7bd1')
                //小圆区域添加文本
                svg.append('text')
                    .attr('class','arcText')
                    .text(d.score.toFixed(2))
                    .attr('x',0)
                    .attr('y',-radius*0.1)
                    .attr('text-anchor','middle')
                    .attr('dy','0.5em')
                    .attr('font-size',12)
                    .attr('fill','#2B587D')
                    .attr('font-weight','bold')
                })
    });

    // d3绘制雷达图的轴线
    const axis = svg.selectAll(".axis")
        .data(radarAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1",(d,i)=>rScale(0)*Math.cos(angleSlice*i-Math.PI*5/6))
        .attr("y1",(d,i)=>rScale(0)*Math.sin(angleSlice*i-Math.PI*5/6))
        .attr("x2",(d,i)=>rScale(1)*Math.cos(angleSlice*i-Math.PI*5/6))
        .attr("y2",(d,i)=>rScale(1)*Math.sin(angleSlice*i-Math.PI*5/6))
        .attr("stroke","#C4C4C4")
        .attr("stroke-width",1);

    //添加文本
    axis.append('text')
        .text(d => d)
        .attr('x',(d,i)=>rScale(1.2)*Math.cos(angleSlice*i-Math.PI*5/6))
        .attr('y',(d,i)=>rScale(1)*Math.sin(angleSlice*i-Math.PI*5/6))
        .attr('text-anchor','middle')
        .attr('dy','0.5em')
        .attr('font-size',12)
        .attr('fill','#666666')

    //轴线中点位置添加一个连接所有轴线的圆
    axis.append('circle')
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',radius*0.75/2+radius*0.25)
        .attr('fill','none')
        .attr('stroke','#888888')

    axis.append('circle')
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',radius*0.25)
        .attr('fill','none')
        .attr('stroke','#888888')
    axis.append('circle')
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',radius*0.2)
        .attr('fill','none')
        .attr('stroke','#888888')

}
const clearChart = () => {
    d3.select(radar.value).selectAll('path').remove()
    // 清楚data
    data.value.splice(0,data.value.length)
}
const reset = () => {

}
onMounted(()=>{
    // createRadar()
})
watch(bound,(newBound)=>{
    console.log(newBound.latStart)
    fetchData(newBound)
})
watch(data.value,()=>{
    console.log('data change')
    gridSelected = true
    console.log(gridSelected)
    lastItem.value = data.value[data.value.length-1]
    lastItemValue.splice(0,lastItemValue.length,...lastItem.value.value.map(d => d.toFixed(2)))
    // 保留一位小数
    // lastItemValue = lastItemValue.map(d => d.toFixed(2))
    console.log(lastItemValue)
    createRadar()
})
</script>

<template>
    <p style="font-size: 16px;font-weight:bold;margin:0.2rem">网格商业化水平详情</p>
    <div id="container">
        <!-- <el-button type="primary" @click="addData">ADD</el-button> -->
        <div style="display: flex;justify-content:flex-end;width:95%">
            <button @click="clearChart" class="clearButton">清除</button>
        </div>

        <div ref="radar" class="radarChart"></div>
        <div id="bottomDiv">
            <div id="lineDetail">
                <div v-if="lastItemValue.length" class="valueTable">
                    <div class="valueItem">
                        <span>人口密度：</span>
                        <p>{{lastItemValue[0]}}</p>
                    </div>
                    <div class="valueItem">
                        <span>平均房价：</span>
                        <p>{{lastItemValue[1]}}</p>
                    </div>
                    <div class="valueItem">
                        <span>POI密度：</span>
                        <p>{{lastItemValue[2]}}</p>
                    </div>
                    <div class="valueItem">
                        <span>POI多样性：</span>
                        <p>{{lastItemValue[3]}}</p>
                    </div>
                </div>
            </div>
            <div ref="weight" class="weight">
                <div class="sliderContainer">
                    <span class="weightspan">人口密度</span>
                    <el-slider v-model="populationWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
                </div>
                <div class="sliderContainer">
                    <span class="weightspan">平均房价</span>
                    <el-slider v-model="housePriceWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
                </div>
                <div class="sliderContainer">
                    <span class="weightspan">POI密度</span>
                    <el-slider v-model="poiDensityWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
                </div>
                <div class="sliderContainer">
                    <span class="weightspan">POI多样性</span>
                    <el-slider v-model="poiDiversityWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
                </div>
                <div class="buttonContainer">
                    <el-button color="#ecf5ff" type="primary" @click="submit">计算</el-button>
                    <el-button color="#ecf5ff" type="primary" @click="reset" style="margin-left:0;margin-top:2rem">重置</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#container{
    height: 100%;
    width:100%;
    display: flex;
    flex-direction: column;
}
.clearButton{
    width:10%;
    background-color: #ecf5ff;
    border: 1px solid #C4C4C4;
    border-radius: 4px;
}
.radarChart{
    height: 50%;
    width: 100%;
}
#bottomDiv{
    height:40%;
    width:100%;
    display:flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
}
#lineDetail{
    height: 100%;
    width: 25%;
    display: flex;
    flex-direction:column;
    justify-content: center;
    margin-left:1rem;
    margin-bottom: 1.2rem;
}
.valueTable{
    border: 1px solid #C4C4C4;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
    border-radius: 4px; /* 添加圆角 */
    background-color: #fff; /* 设置背景颜色 */
}
.valueItem{
    display:flex;
    flex-direction: row;
    align-items: center;
    justify-content:start;
    margin-left: 0.5rem;
}
.weight{
    height: 100%;
    width: 75%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}
.sliderContainer{
    height: 100%;
    width: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content:center;
}
.weightspan{
    margin-bottom: 1rem;
}
.buttonContainer{
    height: 100%;
    width:25%;
    display:flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

}
</style>