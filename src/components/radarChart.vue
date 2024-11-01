<script setup>
import { ref,onMounted,watch} from 'vue'
import * as d3 from 'd3'
import * as echarts from 'echarts';

const radar = ref(null)
const radarAxis = ['人口密度', '平均房价', 'POI密度', 'POI多样性']
const data = ref([
    {
        name:'grid1',
        value:[0,0.2,0.5,1],
        score:0.5
    },
    {
        name:'grid2',
        value:[0.11,0.74,0.50,0.47],
        score:0
    },
    {
        name:'grid3',
        value:[0.55,0.35,0.74,0.92],
        score:1
    }
])
const populationWeight = ref(null)
const housePriceWeight = ref(null)
const poiDensityWeight = ref(null)
const poiDiversityWeight = ref(null)
var pathSelected = false

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
    
    // d3绘制半圆形雷达图
    // const data = [
    //     {
    //         name:'grid1',
    //         value:[0.5,0.6,0.7,0.8]
    //     }
    // ];
    const radius = Math.min(svgWidth, svgHeight);
    const angleSlice = Math.PI * 2/9;

    const rScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, 1]);
    const radarLine = d3.lineRadial()
        .radius(d => rScale(d))
        .angle((d, i) => i * angleSlice - Math.PI/2 + Math.PI/6)
        .curve(d3.curveCardinal);
    
    //两个圆之间填充颜色 创建比例尺
    const arcScale = d3.scaleLinear()
        .range([-Math.PI/2,Math.PI/2])
        .domain([0,1])

    data.value.forEach(d => {
        svg.append("path")
            .datum(d.value)
            .attr("d", radarLine)
            .attr('id',d.name)
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
                    .endAngle(arcScale(d.score))
                svg.append('path')
                    .attr('class','arcFill')
                    .attr('d',arc)
                    .attr('fill','#fdae61')
                //小圆区域添加文本
                svg.append('text')
                    .attr('class','arcText')
                    .text(d.score)
                    .attr('x',0)
                    .attr('y',-radius*0.1)
                    .attr('text-anchor','middle')
                    .attr('dy','0.5em')
                    .attr('font-size',24)
                    .attr('fill','#f46d43')
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

// const addData = () =>{
//     data.value.push({
//         name:'grid'+(data.value.length+1),
//         value:[Math.random(),Math.random(),Math.random(),Math.random()]
//     })
//     console.log(data.value)
// }
onMounted(()=>{
    createRadar()
})
watch(data.value,()=>{
    console.log('data change')
    createRadar()
})
</script>

<template>
    <p style="font-size: 16px;font-weight:bold;margin:0.5rem">网格商业化水平详情</p>
    <div id="container">
        <!-- <el-button type="primary" @click="addData">ADD</el-button> -->
        <div ref="radar" class="radarChart">
        </div>
        <div ref="weight" class="weight">
            <div class="sliderContainer">
                <span>人口密度</span>
                <el-slider v-model="populationWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="sliderContainer">
                <span>平均房价</span>
                <el-slider v-model="housePriceWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="sliderContainer">
                <span>POI密度</span>
                <el-slider v-model="poiDensityWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="sliderContainer">
                <span>POI多样性</span>
                <el-slider v-model="poiDiversityWeight" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="buttonContainer">
                <el-button color="#ecf5ff" type="primary" @click="submit">计算</el-button>
                <el-button color="#ecf5ff" type="primary" @click="reset" style="margin-left:0;margin-top:2rem">重置</el-button>
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
.radarChart{
    height: 50%;
    width: 100%;
}
.weight{
    height: 40%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
}
.sliderContainer{
    height: 100%;
    width: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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