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
const { bound } = storeToRefs(gridStore);

const EntityDiagram = ref(null);
let chartInstance = null;
const tableData = ref([])
const filterTableData = ref([])

const treeData = ref(null)

var maxValue = ref(0)
// 对数颜色比例尺
var colorScale = ref(null)
// 数量比例尺
// 统计第二层所有children的value之和
var sumValue = ref([])
var valueScale = ref(null)
var leafValueScale = ref(null)
const customInterpolator = d3.interpolateRgbBasis(["#B8CFE2", "#345E80"]);

const fetchData = async (bound) => {
  const params = {
    start_lon: bound.lonStart,
    start_lat: bound.latStart,
    end_lon: bound.lonEnd,
    end_lat: bound.latEnd,
  }

  try {
    // 获取树数据
    const [treeResponse, tableResponse] = await Promise.all([
      fetch('http://localhost:5000/api/getIndustry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }),
      fetch('http://localhost:5000/api/getIndustryDetail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
    ]);

    return {
      tree: await treeResponse.json(),
      table: await tableResponse.json()
    };
  } catch (error) {
    console.error('请求失败:', error);
    return { tree: null, table: [] };
  }
}

function mergeTreeData(trees) {
  if (trees.length === 0) return null;

  // 创建基准树结构（经营主体作为根节点）
  const mergedTree = {
    name: '经营主体',
    value: 0,  // 临时值，后续替换为实际总数
    children: []
  };

  // 递归合并函数（支持三层结构）
  const deepMerge = (targetNodes, sourceNodes) => {
    const nodeMap = new Map(targetNodes.map(n => [n.name, n]));
    
    for (const sourceNode of sourceNodes) {
      let targetNode = nodeMap.get(sourceNode.name);
      
      if (!targetNode) {
        // 新节点创建（保留原始结构）
        targetNode = {
          ...sourceNode,
          value: sourceNode.value || 0,
          children: []
        };
        targetNodes.push(targetNode);
        nodeMap.set(sourceNode.name, targetNode);
      } else {
        // 合并数值（处理undefined）
        targetNode.value += sourceNode.value || 0;
      }

      // 递归合并子节点（行业门类→子行业）
      if (sourceNode.children?.length) {
        targetNode.children = deepMerge(
          targetNode.children,
          sourceNode.children
        );
      }
    }
    
    return targetNodes;
  };

  // 合并所有树的子节点（第二层行业门类）
  trees.forEach(tree => {
    mergedTree.children = deepMerge(
      mergedTree.children,
      tree.children || []
    );
  });

  // 设置经营主体总数值
  mergedTree.value = tableData.value.length;

  // 数值校验与修正（处理三层结构）
  const validateTree = (node) => {
    if (node.children?.length) {
      // 行业门类节点：值=子节点总和
      const sum = d3.sum(node.children, c => c.value);
      node.value = sum > 0 ? sum : node.value;
      node.children.forEach(validateTree);
    } else {
      // 末端节点：保留原始值
      node.value = node.value || 0;
    }
  };
  validateTree(mergedTree);

  // 智能清理空节点（保留结构层级）
  // const cleanTree = (nodes) => {
  //   return nodes.filter(n => {
  //     if (n.children?.length) {
  //       n.children = cleanTree(n.children);
  //       return true; // 保留父节点即使自身值为0
  //     }
  //     return n.value > 0; // 只过滤末端零值
  //   });
  // };
  // mergedTree.children = cleanTree(mergedTree.children);

  return mergedTree;
}

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
          if (d.children) {
            if(d.data.name == '经营主体'){
              return 5;
            }
            return valueScale.value(  // 使用.value访问响应式对象
              d3.sum(d.children, c => c.data.value)
            );
          }
          return leafValueScale.value( // 使用.value访问响应式对象
            d.data.value || 0  // 处理undefined情况
          );
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
        .on('mouseover', function(e, d) {
          d3.select(this).attr('stroke', 'black').attr('stroke-width', 2);
          d3.select('#class-name').text(d.data.name);

          // 逻辑分层判断
          if (d.data.name === '经营主体') {
            // 经营主体特殊处理（优先判断）
            d3.select('#class-value').text(tableData.value.length);
          } else if (d.children) { 
            // 中间层级节点（有子节点）
            const sum = d3.sum(d.children, c => c.data.value || 0);
            d3.select('#class-value').text(sum);
          } else { 
            // 末端节点（精确显示数值，包含0）
            d3.select('#class-value').text(d.data.value ?? 0);
          }

          d3.select('#tooltip').style('display', 'block');
        })
        .on('mousemove',function(e,d){
          var svgRect = svg.node().getBoundingClientRect();
          var mouseX = e.clientX - svgRect.left;
          var mouseY = e.clientY - svgRect.top;
          //console.log(mouseX, mouseY);
          d3.select('#tooltip').style('left', (mouseX - 10)+ 'px').style('top', ( mouseY + 50) + 'px');
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

watch(
    () => gridStore.num,
    async (newVal) => {
      // 清空旧数据（响应式安全）
      treeData.value = null;
      tableData.value = [];
      filterTableData.value = [];
      sumValue.value = [];
      maxValue.value = 0;
      colorScale.value = null;
      valueScale.value = null;
      leafValueScale.value = null;

      const grids = gridStore.grids;
      const promises = [];

      // 存储临时数据的数组
      const allTreeData = [];
      const allTableData = [];


      for (const bound of grids.values()) {
        promises.push(
          fetchData(bound).then(({tree, table }) => {
            allTreeData.push(tree);
            allTableData.push(...table);
          })
        );
      }

      // 等待所有数据加载完成
      await Promise.all(promises);

      console.log("allTreeData",allTreeData)//没问题
      // 合并树数据
      if (allTreeData.length > 0) {
        treeData.value = mergeTreeData(allTreeData);
      }
      console.log("treeData",treeData.value)
      // 合并表格数据
      tableData.value = allTableData;
      filterTableData.value = allTableData;

      //tableData.value = filterTableData.value;

      if(!treeData.value){
        console.log("treeData为空",treeData.value)
        d3.select(EntityDiagram.value).selectAll('*').remove();
        return;
      }

      // 重新绘制图表
      if (treeData.value?.children) {
      
        maxValue.value = d3.max(treeData.value.children, d => 
          d3.max(d.children, c => c.value)
        );
        colorScale.value = d3.scaleSequential()
          .domain([0, maxValue.value])
          .interpolator(customInterpolator);
        
        sumValue.value = treeData.value.children.map(d => 
          d3.sum(d.children, c => c.value)
        );

        console.log("maxValue",maxValue.value)
        console.log("sumValue",sumValue.value)
        
        valueScale.value = d3.scaleLinear()
          .domain([0, d3.max(sumValue.value)])
          .range([4,7]);

        console.log("valueScale",valueScale.value)
        
        leafValueScale.value = d3.scaleLinear()
          .domain([0, maxValue.value])
          .range([2,5]);


        drawTreeChart();
      }      

    }
)
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