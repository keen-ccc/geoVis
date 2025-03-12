<template>
  <div class="container">
    <div ref="EntityDiagram" class="entityClass"></div>
    <div id="tooltip">
      <div class="tooltip-class">
        门类:<span id="class-name"></span>
      </div>
      <div class="tooltip-value">
        数量:<span id="class-value"></span>
      </div>
    </div>
    <el-button color="#ecf5ff" type="primary" @click='exportTable'>导出</el-button>

    <el-table
      :data="filterTableData"
      style="width: 95%;"
      max-height="400"
      :row-class-name="tableRowClassName"
    >
      <el-table-column prop="name" label="名称"  />
      <el-table-column prop="address" label="地址"  />
      <el-table-column prop="businessscope" label="经营范围" />
      <el-table-column prop="hyclass" label="行业门类" />
      <el-table-column prop="hycode" label="行业代码" />
    </el-table>
  </div>
    
</template>

<script setup>
import { onMounted, ref, watch,nextTick} from 'vue';
import { storeToRefs } from 'pinia'
import {useGridSelectorStore} from '@/store/gridSelector'
import * as d3 from 'd3';

const gridStore = useGridSelectorStore()
const { num } = storeToRefs(gridStore);

const EntityDiagram = ref(null);
let chartInstance = null;
const tableData = ref([])
const filterTableData = ref([])

// const treeData = ref(null)
const treeData = ref([])

var maxValue = ref(0)
// 对数颜色比例尺
var colorScale = ref(null)
// 数量比例尺
// 统计第二层所有children的value之和
var sumValue = ref([])
var valueScale = ref(null)
var leafValueScale = ref(null)
const customInterpolator = d3.interpolateRgbBasis(["#B8CFE2", "#345E80"]);

const fetchData = async(bound) => {
  const params = {
      start_lon:bound.lonStart,
      start_lat:bound.latStart,
      end_lon:bound.lonEnd,
      end_lat:bound.latEnd,
  }
  console.log(params)
  const tree_response = await fetch('http://localhost:5000/api/getIndustry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  treeData.value = await tree_response.json()
  console.log("树数据：",treeData.value)

  const res = await fetch('http://localhost:5000/api/getIndustryDetail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  let data = await res.json()
  filterTableData.value.push(...data);
  // tableData.value = filterTableData.value
  tableData.value.push(...filterTableData.value);
  console.log("表格数据：",filterTableData.value)

}
const drawTreeChart = () => {
    d3.select(EntityDiagram.value).selectAll('*').remove();

    const svgHeight = EntityDiagram.value.clientHeight;
    const svgWidth = EntityDiagram.value.clientWidth;
    // const {svgWidth,svgHeight} = EntityDiagram.value.getBoundingClientRect();
     //console.log(svgHeight,svgWidth);
    const svg = d3.select(EntityDiagram.value)
        .append('svg') 
        .attr('width',svgWidth)
        .attr('height',svgHeight)
        .append('g')
        .attr('transform',`translate(${svgWidth/2},${svgHeight/2})`);
    const cx = svgWidth * 0.5; // adjust as needed to fit
    const cy = svgHeight * 0.54; // adjust as needed to fit
    const radius = Math.min(svgWidth, svgHeight) / 2 - 5;

    // Create a radial cluster layout. The layout’s first dimension (x)
    // is the angle, while the second (y) is the radius.
    const tree = d3.cluster()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    // Sort the tree and apply the layout.
    const root = tree(d3.hierarchy(treeData.value)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

    // Append links.
    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll()
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y));

    // Append nodes. 颜色编码数值大小
    svg.append("g")
        .selectAll()
        .data(root.descendants())
        .join("circle")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr("r", d => {
          if(d.children){
            // 按照数量大小设置半径
            // console.log(valueScale(d3.sum(d.children,c=>c.data.value)));
            return valueScale(d3.sum(d.children,c=>c.data.value));
          }
          if(d.data.value == undefined) {
            console.log(leafValueScale(0));
            return leafValueScale(0);
          }
          else{
            //console.log(leafValueScale(d.data.value));
            return leafValueScale(d.data.value);
          }
          
        })
        .attr('fill',d => {
            if(d.children){
              return '#1d7bd1'
            }
            else{
              return '#73b5e7'
            }
            // return '#999'
        })
        .on('mouseover',function(e,d){
          d3.select(this).attr('stroke','black').attr('stroke-width',2);
          d3.select('#class-name').text(d.data.name);
          if(d.data.value){
            d3.select('#class-value').text(d.data.value);
          }
          else{
            if(d.data.children){
              // 如果不为空
              if(d.data.children.length > 0){
                if(d.data.name == '经营主体'){
                  d3.select('#class-value').text(tableData.value.length);
                }
                else{
                  d3.select('#class-value').text(d3.sum(d.data.children,c=>c.value));
                }
                // d3.select('#class-value').text(d3.sum(d.children,c=>c.data.value));
              }
              // else{
              //   if(d.name === '经营主体'){
              //     d3.select('#class-value').text(tableData.value.length);
              //   }
              //   else{
              //     d3.select('#class-value').text(0);
              //   }
              // }
            }
          }
          d3.select('#tooltip').style('display','block');
        })
        .on('mousemove',function(e,d){
          var svgRect = svg.node().getBoundingClientRect();
          var mouseX = e.clientX - svgRect.left;
          var mouseY = e.clientY - svgRect.top;
          //console.log(mouseX, mouseY);
          d3.select('#tooltip').style('left', (mouseX - 5)+ 'px').style('top', ( mouseY + 40) + 'px');
        })
        .on('mouseout',function(e,d){
          d3.select(this).attr('stroke','none');
          d3.select('#tooltip').style('display','none');
        })
        .on('click',function(e,d){
          console.log(e.srcElement.__data__.data.name)
          if(d.data.name == '经营主体'){
            filterTableData.value = tableData.value
            return;
          }
          if(d.children){
            //过滤数据
            filterTableData.value = tableData.value.filter(item => item.hyclass == e.srcElement.__data__.data.name)
            console.log(tableData.value)
          }
          else{
            filterTableData.value = tableData.value.filter(item => item.hycode.substring(0,2) == e.srcElement.__data__.data.name)
            console.log(tableData.value)
          }
        })
}

const exportTable = () => {
  const BOM = "\uFEFF";
  const headers = "名称,地址,经营范围,行业门类,行业代码\n";
  const rows = tableData.value.map(d => `${d.name},${d.address},${d.businessscope}`).join("\n");
  const csvContent = BOM + headers + rows;
  console.log(csvContent);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "table_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

}
onMounted( async ()=>{
    //await nextTick(); 
    //drawPieChart();
    //drawTreeChart();
})
watch(num,(newNum)=>{
  console.log("detailTable bound change")

  const grids = gridStore.grids;
  console.log(grids);
  for (let bound of grids.values())
    fetchData(bound);
})
watch(treeData,(newData)=>{
  maxValue = d3.max(treeData.value.children,d => d3.max(d.children,c=>c.value));
  console.log("最大值：",maxValue);
  colorScale = d3.scaleSequential().domain([0,maxValue]).interpolator(customInterpolator);
  treeData.value.children.forEach(d=>{ 
  sumValue.value.push(d3.sum(d.children,c=>c.value))
    })
  valueScale = d3.scaleLinear().domain([0,d3.max(sumValue.value)]).range([4,7]);
  leafValueScale = d3.scaleLinear().domain([0,maxValue]).range([2,5]);
  console.log("treeData change")
  drawTreeChart();
})
watch(tableData,(newData)=>{
  console.log("tableData change")
})
</script>

<style scoped>
.container{
  /* overflow-y: scroll; */
  height: 80vh;
  width: 25rem;
  justify-content: center;
}
.entityClass{
  height: 50%;
  width: 90%;
}
#tooltip{
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  border: 1px solid #000;
  border-radius: 5px;
  padding: 5px;
  z-index: 1000;
}
</style>