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
    <el-button plain @click='exportTable'>导出</el-button>

    <el-table
      :data="tableData"
      style="width: 90%;"
      max-height="400"
      :row-class-name="tableRowClassName"
    >
      <el-table-column prop="name" label="名称" width="100" />
      <el-table-column prop="address" label="地址" width="100" />
      <el-table-column prop="businessscope" label="经营范围" />
    </el-table>
  </div>
    
</template>

<script setup>
import * as echarts from 'echarts';
import * as d3 from 'd3';
import { onMounted, ref , nextTick} from 'vue';

const EntityDiagram = ref(null);
let chartInstance = null;
const tableData = [{'name': '崇州市崇阳五福旅社', 'address': '崇州市崇阳街道早觉东街126号', 'businessscope': '住宿服务(依法须经批准的项目，经相关部门批准后方可开展经营活动)。'}, {'name': '天府新区成都片区三星镇思力菜油加工坊', 'address': '天府新区三星镇云崖村8组', 'businessscope': '菜子油来料加工【服务】。'}, {'name': '双流县公兴屠场', 'address': '成都市双流县公兴镇坛罐窑街58号', 'businessscope': '畜禽屠宰［加工］。'}, {'name': '双流县楠林茶楼', 'address': '成都市双流县黄水镇玉龙南街225号', 'businessscope': '茶座。'}, {'name': '彭州市磁峰镇世杰矿产品经营部', 'address': '成都市彭州市磁峰镇鹿坪村', 'businessscope': '煤矸石、石灰石、黄沙、建筑辅助材料销售（国家法律法规规定需要前置许可证 和禁止经营的除外）。'}, {'name': '成华区海源经营部', 'address': '成都市成华区文德路185号', 'businessscope': '预包装食品、卷烟、雪茄烟零售。'}, {'name': '武侯区东明汽车电器维修部', 'address': '成都市武侯区簇桥三河村2组', 'businessscope': '三类机动车维修（电气系统维修）。（凭许可证经营，有效期至2011年3月16日）。'}]

const exampleData = {'name': 'Entity', 'children': [{'name': '农、林、牧、渔业', 'children': [{'name': '1', 'value': 9}, {'name': '2', 'value': 5}, {'name': '3', 'value': 4}, {'name': '4', 'value': 1}, {'name': '5', 'value': 1}]}, {'name': '采矿业', 'children': [{'name': '6', 'value': 1}, {'name': '12', 'value': 1}, {'name': '10', 'value': 2}]}, {'name': '制造业', 'children': [{'name': '15', 'value': 29}, {'name': '33', 'value': 21}, {'name': '14', 'value': 19}, {'name': '35', 'value': 19}, {'name': '13', 'value': 15}, {'name': '18', 'value': 15}, {'name': '34', 'value': 15}, {'name': '26', 'value': 11}, {'name': '19', 'value': 10}, {'name': '30', 'value': 10}, {'name': '31', 'value': 9}, {'name': '29', 'value': 9}, {'name': '21', 'value': 8}, {'name': '38', 'value': 7}, {'name': '17', 'value': 6}, {'name': '20', 'value': 5}, {'name': '41', 'value': 5}, {'name': '22', 'value': 4}, {'name': '32', 'value': 4}, {'name': '27', 'value': 3}, {'name': '23', 'value': 3}, {'name': '39', 'value': 2}, {'name': '24', 'value': 2}, {'name': '40', 'value': 2}, {'name': '36', 'value': 2}, {'name': '37', 'value': 2}]}, {'name': '电力、热力、燃气及水生产和供应业', 'children': [{'name': '44', 'value': 2}, {'name': '45', 'value': 1}, {'name': '46', 'value': 1}]}, {'name': '建筑业', 'children': [{'name': '50', 'value': 30}, {'name': '47', 'value': 7}, {'name': '49', 'value': 4}, {'name': '48', 'value': 3}]}, {'name': '批发和零售业', 'children': [{'name': '51', 'value': 259}, {'name': '52', 'value': 97}]}, {'name': '交通运输、仓储和邮政业', 'children': [{'name': '54', 'value': 15}, {'name': '59', 'value': 3}, {'name': '53', 'value': 1}, {'name': '60', 'value': 1}, {'name': '58', 'value': 1}, {'name': '55', 'value': 1}]}, {'name': '住宿和餐饮业', 'children': [{'name': '62', 'value': 45}, {'name': '61', 'value': 12}]}, {'name': '信息传输、软件和信息技术服务业', 'children': [{'name': '65', 'value': 34}, {'name': '64', 'value': 3}, {'name': '63', 'value': 1}]}, {'name': '金融业', 'children': []}, {'name': '房地产业', 'children': [{'name': '70', 'value': 38}]}, {'name': '租赁和商务服务业', 'children': [{'name': '72', 'value': 88}, {'name': '71', 'value': 8}]}, {'name': '科学研究和技术服务业', 'children': [{'name': '74', 'value': 15}, {'name': '75', 'value': 6}, {'name': '73', 'value': 6}]}, {'name': '水利、环境和公共设施管理业', 'children': [{'name': '78', 'value': 5}, {'name': '77', 'value': 1}]}, {'name': '居民服务、修理和其他服务业', 'children': [{'name': '80', 'value': 23}, {'name': '82', 'value': 9}, {'name': '81', 'value': 7}]}, {'name': '教育', 'children': [{'name': '83', 'value': 2}]}, {'name': '卫生和社会工作', 'children': [{'name': '84', 'value': 3}]}, {'name': '文化、体育和娱乐业', 'children': [{'name': '90', 'value': 3}, {'name': '87', 'value': 2}, {'name': '88', 'value': 2}]}, {'name': '公共管理、社会保障和社会组织', 'children': []}, {'name': '国际组织', 'children': []}]}

const maxValue = d3.max(exampleData.children,d => d3.max(d.children,c=>c.value));
console.log(maxValue);
// 对数颜色比例尺
const colorScale = d3.scaleSequential().domain([0,Math.log(maxValue)]).interpolator(d3.interpolateBlues);
// 数量比例尺
// 统计第二层所有children的value之和
const sumValue = []
exampleData.children.forEach(d=>{
  sumValue.push(d3.sum(d.children,c=>c.value))
})
// console.log(sumValue);
const valueScale = d3.scaleLinear().domain([0,d3.max(sumValue)]).range([3,7]);

const drawTreeChart = () => {
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
    const root = tree(d3.hierarchy(exampleData)
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
          else{
            return 4.5
          }
        })
        .attr('fill',d => {
            if(d.children){
              return '#999'
            }
            else{
              if(d.data.value){
                return colorScale(d.data.value);
              }
              else{
                return '#999'
              }
            }
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
                d3.select('#class-value').text(d3.sum(d.children,c=>c.data.value));
              }
              else{
                if(d.name === 'Entity'){
                }
                else{
                  d3.select('#class-value').text(0);
                }
              }
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
        });
}

// const drawPieChart = () => {
//     const svgHeight = EntityDiagram.value.clientHeight;
//     const svgWidth = EntityDiagram.value.clientWidth;
//     const svg = d3.select(EntityDiagram.value)
//         .append('svg') 
//         .attr('width',svgWidth)
//         .attr('height',svgHeight)
//         .append('g')
//         .attr('transform',`translate(${svgWidth/2},${svgHeight/2})`);
//     const color =  d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, exampleData.children.length + 1));
//     const radius = Math.min(svgWidth,svgHeight)/2;

//     // Prepare the layout.
//     const partition = exampleData => d3.partition()
//       .size([2 * Math.PI, radius])
//     (d3.hierarchy(exampleData)
//       .sum(d => d.value)
//       .sort((a, b) => b.value - a.value));

//     const arc = d3.arc()
//       .startAngle(d => d.x0)
//       .endAngle(d => d.x1)
//       .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
//       .padRadius(radius / 2)
//       .innerRadius(d => d.y0)
//       .outerRadius(d => d.y1 - 1);

//     const root = partition(exampleData);

//     // Add an arc for each element, with a title for tooltips.
//     const format = d3.format(",d");
//     svg.append("g")
//         .attr("fill-opacity", 0.6)
//         .selectAll("path")
//         .data(root.descendants().filter(d => d.depth))
//         .join("path")
//         .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
//         .attr("d", arc)
//         .append("title")
//         .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

//     // Add a label for each element.
//     svg.append("g")
//         .attr("pointer-events", "none")
//         .attr("text-anchor", "middle")
//         .attr("font-size", 10)
//         .attr("font-family", "sans-serif")
//         .selectAll("text")
//         .data(root.descendants().filter(d => d.depth && (d.y0 +
//         d.y1) / 2 * (d.x1 - d.x0) > 10))
//         .join("text")

// }
const exportTable = () => {
  const BOM = "\uFEFF";
  const headers = "名称,地址,经营范围\n";
  const rows = tableData.map(d => `${d.name},${d.address},${d.businessscope}`).join("\n");
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
    await nextTick(); 
    //drawPieChart();
    drawTreeChart();
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