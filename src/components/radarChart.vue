<script setup>
import { ref,onMounted,watch} from 'vue'
import * as d3 from 'd3'
import * as echarts from 'echarts';

const radar = ref(null)
const population = ref(null)
const housePrice = ref(null)
const poiDensity = ref(null)
const poiDiversity = ref(null)

const createRadar = () => {
    const svgHeight = radar.value.clientHeight
    const svgWidth = radar.value.clientWidth
    const svg = d3.select(radar.value)
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${svgWidth / 2},${svgHeight})`);
    
    // d3绘制半圆形雷达图
    const data = [
        {axis: "人口密度", value: 0.5},
        {axis: "平均房价", value: 0.8},
        {axis: "POI密度", value: 0.6},
        {axis: "POI多样性", value: 0.9}
    ];
    const radius = Math.min(svgWidth, svgHeight);
    const angleSlice = Math.PI * 2/9;

    const rScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, 1]);
    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice - Math.PI/2 + Math.PI/6)
        .curve(d3.curveCardinal);

    svg.append("path")
        .datum(data)
        .attr("d", radarLine)
        .style("fill", "none")
        .style("stroke", "blue")
        .style("stroke-width", 2);

    // d3绘制雷达图的轴线
    const axis = svg.selectAll(".axis")
        .data(data)
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
        .text(d=>d.axis)
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
    //两个圆之间填充颜色
    //创建比例尺
    const arcScale = d3.scaleLinear()
        .range([-Math.PI,Math.PI/2])
        .domain([0,1])
    const arc = d3.arc()
        .innerRadius(radius*0.2)
        .outerRadius(radius*0.25)
        .startAngle(-Math.PI)
        .endAngle(arcScale(0.66))
    svg.append('path')
        .attr('d',arc)
        .attr('fill','blue')
    //小圆区域添加文本
    svg.append('text')
        .text('0.66')
        .attr('x',0)
        .attr('y',-radius*0.1)
        .attr('text-anchor','middle')
        .attr('dy','0.5em')
        .attr('font-size',24)
        .attr('fill','red')
        .attr('font-weight','bold')

}

onMounted(()=>{
    createRadar()
})
</script>

<template>
    <div id="container">
        <div ref="radar" class="radarChart">
        </div>
        <div ref="weight" class="weight">
            <div class="sliderContainer">
                <span>人口密度</span>
                <el-slider v-model="population" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="sliderContainer">
                <span>平均房价</span>
                <el-slider v-model="housePrice" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="sliderContainer">
                <span>POI密度</span>
                <el-slider v-model="poiDensity" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
            </div>
            <div class="sliderContainer">
                <span>POI多样性</span>
                <el-slider v-model="poiDiversity" :min="0" :max="1"  :step="0.1"  height="6rem" vertical="true"></el-slider>
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
    height: 50%;
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