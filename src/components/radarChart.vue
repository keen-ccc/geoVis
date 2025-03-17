<script setup>
import { ref,onMounted,watch,nextTick} from 'vue'
import * as d3 from 'd3'
import * as echarts from 'echarts';
import {useGridSelectorStore} from '@/store/gridSelector'
import {pathGridStore} from '@/store/pathSelector'
import { storeToRefs } from 'pinia'
import { reactive } from 'vue';

const radar = ref(null)
const radarAxis = ['人口密度', '平均房价', 'POI密度', 'POI多样性']
const data = ref([])
const lastItem = ref(data.value[data.value.length-1])
// var gridSelected = false
var lastItemValue = reactive([])
const populationWeight = ref(0.13)
const housePriceWeight = ref(0.43)
const poiDensityWeight = ref(0.36)
const poiDiversityWeight = ref(0.31)
const sumWeight = ref(1.23)
var pathSelected = false
const gridStore = useGridSelectorStore()
const pathStore = pathGridStore()
const  state  = storeToRefs(gridStore);
const {pathID} = storeToRefs(pathStore)

var populationScale,housePriceScale,poiDensityScale,poiDiversityScale,scoreScale = null;
var populationMax = 165134.45;
var housePriceMax = 55852.33;
var poiDensityMax = 1333;
var poiDiversityMax = 1.55;
var scoreMax = 1;
var populationMin = 0;
var housePriceMin = 0;
var poiDensityMin = 0;
var poiDiversityMin = 0;
var scoreMin = 0;

const fetchData = async (bound) => {

    //const gridStore = useGridSelectorStore(); // 获取 Pinia store 实例
    sumWeight.value = populationWeight.value + housePriceWeight.value + poiDensityWeight.value + poiDiversityWeight.value;
    console.log("sum weight:", sumWeight.value);

    // 获取所有 grids 的 ID
    const gridIDs = Array.from(gridStore.grids.keys());
    console.log("gridIDs:", gridIDs);

    // 判断是否有选择的 gridID
    const selectedGridID = gridIDs.find(id => gridStore.grids.get(id).latStart === bound.latStart &&
                                               gridStore.grids.get(id).latEnd === bound.latEnd &&
                                               gridStore.grids.get(id).lonStart === bound.lonStart &&
                                               gridStore.grids.get(id).lonEnd === bound.lonEnd);


    const params = {
            gridID: selectedGridID,
            start_lon:bound.lonStart,
            start_lat:bound.latStart,
            end_lon:bound.lonEnd,
            end_lat:bound.latEnd,
            populationWeight:populationWeight.value,
            housePriceWeight:housePriceWeight.value,
            poiDensityWeight:poiDensityWeight.value,
            poiDiversityWeight:poiDiversityWeight.value,
            sumWeight:sumWeight.value
    }
    try {
        const res = await fetch('http://localhost:5000/api/cal_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const result = await res.json();
        console.log("单条数据获取:", result);
        return result; // 直接返回结果
    } catch (e) {
        console.error("请求失败:", e);
        return null;
    }
}
const createRadar = (selectedGridIDs = []) => {
    d3.select(radar.value).selectAll('*').remove()

    const svgHeight = radar.value.clientHeight
    const svgWidth = radar.value.clientWidth
    const svg = d3.select(radar.value)
        .append('svg')
        .attr('id','radarSvg')
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
        .domain([0, 1]);
    housePriceScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, 1]);
    poiDensityScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, 1]);
    poiDiversityScale = d3.scaleLinear()
        .range([radius*0.25, radius])
        .domain([0, 1]);
    scoreScale = d3.scaleLinear()
        .range([-Math.PI/2,Math.PI/2])
        .domain([0, 1]);


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
        
    const path = svg.append("path")
        .datum(dd => {
            // 数组每一个指标分别进行归一化
            return d.value.map((item, i) => {
                switch(i){
                    case 0:
                        return (item - populationMin) / (populationMax - populationMin);
                    case 1:
                        return (item - housePriceMin) / (housePriceMax - housePriceMin);
                    case 2:
                        return (item - poiDensityMin) / (poiDensityMax - poiDensityMin);
                    case 3:
                        return (item - poiDiversityMin) / (poiDiversityMax - poiDiversityMin);
                }
            });
        })
        .attr("d", radarLine)
        .attr('id', function(e, dd) {
            // 判断是网点网格还是普通网格
            if(d.gridID < 1156){
                return `netgrid-${d.gridID}`
            } else {
                return `grid-${d.gridID}`
            }
        })
        .attr("class", "radarPath")
        .style("fill", "none")
        .style("stroke", "#737373") // 初始为灰色
        .style("stroke-width", 2)
        .style('stroke-opacity', 0.8)
        // 初始化时根据选中状态设置样式
        if (selectedGridIDs.includes(d.gridID)) {
            path.style("stroke", "#7EA8CB")
                .style("stroke-width", 4);
        }
        path.on('click', function() {
            // 根据 ID 查找 data
            lastItem.value = data.value.find(item => item.gridID == d.gridID);
            lastItemValue.splice(0, lastItemValue.length, ...lastItem.value.value.map(d => d.toFixed(1)));
            
            // 确定选择的 path（对应网格）
            pathStore.selectPath(d.gridID);
            console.log("pathID:", pathStore.pathID);
            console.log(d3.select(this).style('stroke'));
            
            // 重置所有路径的颜色为灰色
            svg.selectAll('path')
                .style('stroke', '#737373')
                .style('stroke-width', 2);

            // 判断当前点击路径是否已经选中（即是否是灰色）
            if (d3.select(this).style('stroke') === 'rgb(115, 115, 115)') {
                console.log('change color');
                // 如果是灰色，变成蓝色
                d3.select(this).style('stroke', '#7EA8CB').style('stroke-width', 4);
            }

            // 清除之前的 arc 和文本
            d3.selectAll('.arcFill').remove();
            d3.selectAll('.arcText').remove();

            // 添加新的 arc
            const arc = d3.arc()
                .innerRadius(radius * 0.2)
                .outerRadius(radius * 0.25)
                .startAngle(-Math.PI)
                .endAngle(scoreScale(d.score));

            svg.append('path')
                .attr('class', 'arcFill')
                .attr('d', arc)
                .attr('fill', '#1d7bd1');

            // 小圆区域添加文本
            svg.append('text')
                .attr('class', 'arcText')
                .text(d.score.toFixed(2))
                .attr('x', 0)
                .attr('y', -radius * 0.1)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.5em')
                .attr('font-size', 12)
                .attr('fill', '#2B587D')
                .attr('font-weight', 'bold');
        });
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
// const highlightLine = (d) => {
//     console.log("highlight:",d.gridID)
//     const svgHeight = radar.value.clientHeight
//     const svgWidth = radar.value.clientWidth
//     const radius = Math.min(svgWidth, svgHeight) - 10;
//    // 重置所有路径的样式
//    const radarSvg = d3.select('#radarSvg')
//    radarSvg.selectAll('path')
//         .style('stroke', '#737373')  // 设置默认的灰色边框
//         .style('stroke-width', 2);   // 恢复默认的边框宽度

//     // 检查当前路径的颜色并设置高亮
//     //检测是否是网点网格
//     if(d.gridID < 1156){
//         const selectedPath = radarSvg.select(`#netgrid-${d.gridID}`); // 使用 gridID 选择当前路径
//         const isSelected = selectedPath.style('stroke') === 'rgb(115, 115, 115)'; // 如果是默认颜色，则选中
//         if (isSelected) {
//             selectedPath.style('stroke', '#7EA8CB') // 高亮颜色
//                         .style('stroke-width', 4); // 增加宽度
//         }
//         return
//     }
//     else{
//         const selectedPath = radarSvg.select(`#grid-${d.gridID}`); // 使用 gridID 选择当前路径
//         const isSelected = selectedPath.style('stroke') === 'rgb(115, 115, 115)'; // 如果是默认颜色，则选中
//         console.log(selectedPath)
//         if (isSelected) {
//             selectedPath.style('stroke', '#7EA8CB') // 高亮颜色
//                         .style('stroke-width', 4); // 增加宽度
//         }
//     }

//     // 清除之前的 arc 和文本
//     radarSvg.selectAll('.arcFill').remove();
//     radarSvg.selectAll('.arcText').remove();
// }

const updateRadarHighlight = (selectedGridIDs) => {
    console.log("highlighting selected grids:", selectedGridIDs);

    const svgHeight = radar.value.clientHeight;
    const svgWidth = radar.value.clientWidth;
    const radius = Math.min(svgWidth, svgHeight) - 10;
    
    // 获取当前的雷达 SVG
    const radarSvg = d3.select('#radarSvg');
    
    // 先重置所有路径的样式
    // radarSvg.selectAll('path')
    //     .style('stroke', '#737373')  // 设置默认的灰色边框
    //     .style('stroke-width', 2);   // 恢复默认的边框宽度

    // 删除未选中网格的轴线 用于取消网格操作
    // radarSvg.selectAll('path')
    //     .each(function() {
    //         const path = d3.select(this);
    //         const gridID = path.attr('id').split('-')[1]; // 假设 ID 格式是 "netgrid-<gridID>"
    //         if (!selectedGridIDs.includes(Number(gridID))) {
    //             console.log("removing path:", gridID);
    //             path.remove(); // 如果网格 ID 没有被选中，则删除对应的路径
    //         }
    //     });

    // 删除之前的高亮路径
    radarSvg.selectAll('.radarPath').remove();

    // 对于每个已选中的网格 ID，设置高亮：会重复新增path svg
    selectedGridIDs.forEach(gridID => {
        const selectedPath = radarSvg.select(`#netgrid-${gridID}`); // 使用 netgrid-${gridID} 选择当前路径
        const isSelected = selectedPath.style('stroke') === 'rgb(115, 115, 115)'; // 如果是默认颜色，则选中

        if (isSelected) {
            selectedPath
                //.classed('highlight-path', true)
                .style('stroke', '#7EA8CB') // 高亮颜色
                .style('stroke-width', 4); // 增加宽度
        }
    });

    // 清除之前的 arc 和文本
    radarSvg.selectAll('.arcFill').remove();
    radarSvg.selectAll('.arcText').remove();
};

const watchNumUpdateLine = (selectedGrid) => {
    //选择网格时，高亮该网格对应的轴线
    const radarSvg = d3.select('#radarSvg');

    //首先 重置所有路径的样式
    radarSvg.selectAll('path')
        .style('stroke', '#737373')  // 设置默认的灰色边框
        .style('stroke-width', 2);   // 恢复默认的边框宽度

    // 获取最后一个选中的网格ID
    const lastSelectedGridID = selectedGrid[selectedGrid.length - 1];

    // 高亮该网格对应的轴线
    const selectedPath = radarSvg.select(`#netgrid-${lastSelectedGridID}`);
    selectedPath.style('stroke', '#7EA8CB').style('stroke-width', 4);

    //当取消网格时 删除该网格对应的轴线
    radarSvg.selectAll('path')
        .each(function() {
            const path = d3.select(this);
            const gridID = path.attr('id').split('-')[1]; // 假设 ID 格式是 "netgrid-<gridID>"
            if (!selectedGrid.includes(Number(gridID))) {
                console.log("removing path:", gridID);
                console.log("removing path:", gridID);
                path.remove(); // 如果网格 ID 没有被选中，则删除对应的路径
            }
        });
}

const clearChart = () => {
    // 清除雷达图中的所有路径（轴线）
    d3.select(radar.value).selectAll('path').remove();
    
    // 清除雷达图中的所有文本（例如，弧形文本或标签）
    d3.select(radar.value).selectAll('text').remove();
    
        // 清除所有已选网格的高亮（将边框恢复为默认灰色）
    
        d3.selectAll('.net-grid-cell')  // 选择所有网格矩形    
       .style('stroke', '#737373')  // 恢复边框为灰色
        .style('stroke-width', 2);   // 恢复默认边框宽度

    // 清除所有选中的网格：取消所有高亮和选择状态
    const gridStore = useGridSelectorStore();
    gridStore.clearGrid();  // 调用 store 中的清除方法，清除所有选中的网格
    
    // 如果有 pathID（例如用于存储当前选中的网格ID），则重置为 -1
    pathStore.cancelPath();  // 取消当前的 pathID（重置选中的网格）

    // 清除 data 中的所有数据
    data.value.splice(0, data.value.length);  // 清空 data 数组中的所有内容
}


const calulateScore = () => {
    sumWeight.value = populationWeight.value + housePriceWeight.value + poiDensityWeight.value + poiDiversityWeight.value
    // 利用新权重重新计算每组数据中的商业化水平分数score
    data.value.forEach(item => {
        console.log('-----------------------------------------')
        console.log(populationWeight.value/sumWeight.value)
        console.log(item.value[0],item.value[1],item.value[2],item.value[3])
        item.score = (populationWeight.value / sumWeight.value) * (item.value[0] / 165134.45)
            + (housePriceWeight.value / sumWeight.value) * (item.value[1] / 55852.33)
            + (poiDensityWeight.value / sumWeight.value) * (item.value[2] / 1333)
            + (poiDiversityWeight.value / sumWeight.value) * (item.value[3] / 1.55);
        console.log(item.score)
    })
    console.log(data.value)
}
const reset = () => {
    //重置权重
    populationWeight.value = 0.13
    housePriceWeight.value = 0.43
    poiDensityWeight.value = 0.36
    poiDiversityWeight.value = 0.31
    sumWeight.value = 1.23
}
onMounted(()=>{

})

// 修改watch函数中的Promise处理逻辑
watch(
    () => ({
        grids: [...gridStore.grids.keys()],
        version: gridStore.num
    }),
    async ({ grids }) => {
        console.log("网格状态更新:", grids);

        try {
            // 阶段1：数据加载（带超时控制）
            const requests = Array.from(gridStore.grids.values(), bound => 
                fetchData(bound).catch(e => {
                    console.error(`加载数据失败: ${e.message}`);
                    return null;
                })
            );

            // 使用Promise.allSettled确保所有请求都有结果
            const results = await Promise.allSettled(requests);

            console.log("数据加载完成:", results); //value 为 undefined
            
            // 处理结果：保留成功请求的数据
            const successfulData = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value)
                .flat();

            console.log("有效数据加载完成:", successfulData);

            // 过滤无效数据并展平
            data.value = successfulData.filter(Boolean);
            console.log("有效数据加载完成:", data.value);

            // 阶段2：视图更新
            //await nextTick(); 
            console.log("数据加载完成，开始更新视图");
            createRadar(grids);
        } catch (e) {
            console.error("数据加载异常:", e);
        }
    },
    {
        deep: true,
        immediate: true,
        flush: 'post'
    }
);


</script>

<template>
    <p style="font-size: 16px;font-weight:bold;margin:0.2rem">网格商业化水平详情</p>
    <div id="container">
        <!-- <div style="display: flex;justify-content:flex-end;width:95%">
             <el-button color="#ecf5ff" type="primary" @click="clearChart">清除</el-button>
        </div> -->

        <div ref="radar" class="radarChart"></div>
        <div id="bottomDiv">
            <div id="lineDetail">
                <div  class="valueTable">
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
                    <el-button color="#ecf5ff" type="primary" @click="calulateScore">计算</el-button>
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
.el-slider{
    --el-slider-main-bg-color: #98B9D5; /* 更改滑块主背景色 */
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