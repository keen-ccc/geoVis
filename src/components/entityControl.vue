<template>
    <div class="entity-control">
        <div style="display:flex;width:100%">
            <div class="title-bar"></div>
            <p style="font-size: 16px;font-weight:bold;margin:0.2rem">数据筛选</p>
        </div>

        <div>
            <div style="margin-top:1rem;margin-left: 0.5rem;">
                <p style="font-weight: 600;">邮政业务</p>
            </div>
            <div>
                <p class="label-title">客户类型</p>
                <div class="label-content">
                    <el-radio-group v-model="radio1" size="large">
                      <el-radio-button label="邮政客户" value="yz" />
                      <el-radio-button label="非邮政客户" value="not-yz" />
                    </el-radio-group>
                </div>
                <p class="label-title">加办业务</p>
                <div class="label-content">
                    <el-checkbox-group v-model="checkboxGroup1" size="large">
                      <el-checkbox-button v-for="yewu in yewu" :key="yewu" :value="yewu">
                        {{ yewu }}
                      </el-checkbox-button>
                    </el-checkbox-group>
                </div>
            </div>
        </div>
        <div>
            <div style="margin-top:1rem;margin-left: 0.5rem;">
                <p style="font-weight: 600;">主体字段</p>
            </div>
            <div>
                <p class="label-title">成立日期</p>
                <div class="label-content">
                  <el-date-picker
                    v-model="date"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    @clear="applyFilter"
                  />
                </div>
                <p class="label-title">主体类型</p>
                <div class="label-content">
                  <el-checkbox-group v-model="entityTypes" size="midium">
                    <el-checkbox-button label="企业" value="企业" />
                    <el-checkbox-button label="个体工商户" value="个体工商户" />
                  </el-checkbox-group>
                </div>
                <!-- <p class="label-title">法人信息</p>
                <div class="label-content">
                  <el-input v-model="farenInput" placeholder="请输入法人信息"  style="width: 95%;"></el-input>
                </div> -->
            </div>
        </div>
        <div class="confirm-button">
            <el-button type="primary" @click="applyFilter">确认</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEntityFilterStore } from '@/store/entityFilter'

const entityFilter = useEntityFilterStore()

const checkboxGroup1 = ref(['Shanghai'])
const yewu = ['定期', '理财', '基金', '保险','信用卡']
const date = ref('')
const entityTypes = ref([])
const farenInput = ref('')

function applyFilter(){
    
    const v = date.value
    let startDate = null
    let endDate = null
    
    if (v && Array.isArray(v) && v.length === 2) {
        const [s, e] = v
        const format = (d) => {
            if (!d) return null
            if (typeof d === 'string') return d
            try { return d.toISOString().split('T')[0] } catch { return String(d) }
        }
        startDate = format(s)
        endDate = format(e)
    }
    // console.log('entityFilter:', entityTypes.value)
    entityFilter.setEstdateRange([startDate, endDate])
    entityFilter.setEntityTypes(entityTypes.value)
}
</script>
<style scoped>
.title-bar{
    height:22px;
    width:8px;
    background-color: rgb(54, 54, 54);
    margin:4px 0 0 4px;
}
.label-title{
    /* font-weight: 600; */
    margin-left: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 12px;
    color: #333;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.label-content{
    margin-left: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 12px;
    color: #333;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.confirm-button{
    display: flex;
    justify-content: right;
    align-items: center;
    margin-top: 0.8rem;
    margin-right: 1rem;
}
</style>