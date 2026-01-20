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
      style="width: 100%;"
      height="450"
      :row-class-name="tableRowClassName"
      ref="tableRef"
    >
      <el-table-column prop="name" label="名称"  />
      <el-table-column prop="address" label="地址"  />
      <el-table-column label="经营范围">
        <template #default="scope">
          <div :class="isExpanded(scope.$index) ? 'cell-expanded' : 'cell-collapse'" :style="collapseStyle(scope.$index)">
            {{ scope.row.businessscope }}
          </div>
          <el-link v-if="shouldShowExpand(scope.$index)" type="primary" @click="toggleExpand(scope.$index)">
            {{ isExpanded(scope.$index) ? '收起' : '展开' }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="hyclass" label="行业门类" />
      <el-table-column prop="entityType" label="主体类型" />
      <el-table-column prop="estdate" label="成立日期" />
    </el-table>
  </div>
    
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch,nextTick} from 'vue';
import { storeToRefs } from 'pinia'
import {useGridSelectorStore} from '@/store/gridSelector'
import { useEntityFilterStore } from '@/store/entityFilter'
import * as d3 from 'd3';

const gridStore = useGridSelectorStore()
const { bound } = storeToRefs(gridStore);
const entityFilter = useEntityFilterStore()

// helper to format date-range from store
const getFilterDates = () => {
  const r = entityFilter.estdateRange
  if (!r || !Array.isArray(r) || r.length !== 2) return { start_date: null, end_date: null }
  return { start_date: r[0], end_date: r[1] }
}

const EntityDiagram = ref(null);
let chartInstance = null;
const tableData = ref([])
const filterTableData = ref([])
const expandedRows = ref(new Set())
const isExpanded = (i) => expandedRows.value.has(i)
const toggleExpand = (i) => {
  const s = expandedRows.value
  if (s.has(i)) s.delete(i)
  else s.add(i)
  expandedRows.value = new Set(s)
}

const tableRef = ref(null)
const rowClampHeights = ref([])
const rowOverflows = ref([])
const tableRowClassName = () => ''
const collapseStyle = (i) => {
  if (isExpanded(i)) return {}
  return {
    maxHeight: (rowClampHeights.value[i] || 24) + 'px',
    overflow: 'hidden',
    display: 'block',
    wordBreak: 'break-word'
  }
}
const shouldShowExpand = (i) => isExpanded(i) || !!rowOverflows.value[i]

const recomputeClamp = () => {
  const tableEl = tableRef.value?.$el || tableRef.value
  const rows = tableEl?.querySelectorAll?.('.el-table__body tbody tr') || []
  const heights = []
  const overflows = []
  rows.forEach((tr, idx) => {
    const nameCell = tr.children?.[0]
    const addrCell = tr.children?.[1]
    const nameContent = nameCell?.querySelector?.('.cell') || nameCell
    const addrContent = addrCell?.querySelector?.('.cell') || addrCell
    const h1 = nameContent?.clientHeight || 0
    const h2 = addrContent?.clientHeight || 0
    const clamp = Math.max(h1, h2)
    heights[idx] = clamp > 0 ? clamp : 24
    const bsCell = tr.children?.[2]
    const bsWrapper = bsCell?.querySelector?.('.cell') || bsCell
    const bsContent = bsWrapper?.firstElementChild || bsWrapper
    const full = bsContent?.scrollHeight || 0
    overflows[idx] = full > (heights[idx] || 24)
  })
  rowClampHeights.value = heights
  rowOverflows.value = overflows
}

const treeData = ref(null)

var maxValue = ref(0)
// 对数颜色比例尺
var colorScale = ref(null)
// 数量比例尺
// 统计第二层所有children的value之和
var sumValue = ref([])
var radiusScale = ref(null)
const customInterpolator = d3.interpolateRgbBasis(["#B8CFE2", "#345E80"]);

const fetchData = async (bound) => {
  const { start_date, end_date } = getFilterDates()
  const params = {
    start_lon: bound.lonStart,
    start_lat: bound.latStart,
    end_lon: bound.lonEnd,
    end_lat: bound.latEnd,
    start_date,
    end_date,
    entity_types: entityFilter.entityTypes && entityFilter.entityTypes.length > 0 ? entityFilter.entityTypes : null
  }

  try {
    // 获取树数据
    const [treeResponse, tableResponse] = await Promise.all([
      fetch('/api/getIndustry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }),
      fetch('/api/getIndustryDetail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
    ]);
    // console.log('fetchData params:', params);
    // console.log('fetchData treeResponse:', await treeResponse.json());
    // console.log('fetchData tableResponse:', await tableResponse.json());

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
  if (!Array.isArray(tableData.value) || tableData.value.length === 0) return null;

  const classMap = new Map();

  tableData.value.forEach(item => {
    const cls = item.hyclass || '未知';
    const code = (item.hycode || '').toString().substring(0, 2) || '00';

    if (!classMap.has(cls)) classMap.set(cls, new Map());
    const codeMap = classMap.get(cls);
    codeMap.set(code, (codeMap.get(code) || 0) + 1);
  });

  const mergedTree = {
    name: '经营主体',
    value: tableData.value.length,
    children: Array.from(classMap.entries()).map(([cls, codeMap]) => {
      const children = Array.from(codeMap.entries()).map(([code, cnt]) => ({ name: code, value: cnt }));
      const sum = children.reduce((s, c) => s + (c.value || 0), 0);
      return { name: cls, value: sum, children };
    })
  };

  return mergedTree;
}

const drawTreeChart = () => {
    const svgHeight = EntityDiagram.value.clientHeight;
    const svgWidth = EntityDiagram.value.clientWidth;
    // const {svgWidth,svgHeight} = EntityDiagram.value.getBoundingClientRect();
     //console.log(svgHeight,svgWidth);
    d3.select(EntityDiagram.value).selectAll('*').remove(); // 清空旧图表
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
              return 10;
            }
            const s = d3.sum(d.children, c => c.data.value)
            return radiusScale.value(s)
          }
          const v = d.data.value || 0
          return radiusScale.value(v)
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
  const headers = "名称,地址,经营范围,行业门类,主体类型,成立日期\n";
  const rows = tableData.value.map(d => 
    `"${d.name}","${d.address}","${d.businessscope}","${d.hyclass}","${d.entityType}","${d.estdate}"`
  ).join("\n");
  const csvContent = BOM + headers + rows;
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
    await nextTick()
    recomputeClamp()
})
onUnmounted(() => {
  // no-op reserved for future detach if listeners are added
})

const loadAllData = async () => {
  // 清空旧数据（响应式安全）
  treeData.value = null;
  tableData.value = [];
  filterTableData.value = [];
  sumValue.value = [];
  maxValue.value = 0;
  colorScale.value = null;
  // valueScale.value = null;
  // leafValueScale.value = null;

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

  // 先合并表格数据（chart 合并依赖表格长度）
  tableData.value = allTableData;
  filterTableData.value = allTableData;

  try {
    treeData.value = mergeTreeData(allTreeData);
  } catch (err) {
    console.error('mergeTreeData failed:', err);
    treeData.value = null;
  }

  if(!treeData.value){
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

    const maxLeaf = maxValue.value || 0
    const maxSum = d3.max(sumValue.value) || 0
    const maxVal = Math.max(maxLeaf, maxSum)
    radiusScale.value = d3.scaleSqrt()
      .domain([0, maxVal])
      .range([2, 10])

    drawTreeChart();
  }

  await nextTick()
  recomputeClamp()
}

// 当网格或筛选条件变化时加载数据
watch(
  () => gridStore.num,
  async () => { await loadAllData() }
)

// 当成立日期过滤变化时，重新加载数据
watch(
  () => entityFilter.estdateRange,
  async () => { await loadAllData() }
)

// 当主体类型过滤变化时，重新加载数据
watch(
  () => entityFilter.entityTypes,
  async () => { await loadAllData() },
  { deep: true }
)

watch(
  () => filterTableData.value,
  async () => {
    await nextTick()
    recomputeClamp()
  }
)
</script>

<style scoped>
.cell-collapse {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cell-expanded {
  white-space: normal;
}
</style>

<style scoped>
.container{
  /* overflow-y: scroll; */
  height: 80vh;
  width: 100%;
  justify-content: center;
}
.entityClass{
  height: 50%;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}
.entityClass > svg{
  display: block;
  margin: 0 auto; 
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
