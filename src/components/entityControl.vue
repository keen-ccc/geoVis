<template>
    <div class="entity-control">
        <p style="font-size: 16px;font-weight:bold;margin:0.2rem">主体标签筛选</p>
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
                <p class="label-title">注册时间</p>
                <div class="label-content">
                  <el-date-picker
                    v-model="value1"
                    type="daterange"
                    range-separator="To"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                  />
                </div>
                <p class="label-title">法人信息</p>
                <div class="label-content">
                  <el-input v-model="farenInput" placeholder="请输入法人信息"  style="width: 95%;"></el-input>
                </div>
            </div>
        </div>
        <div class="confirm-button">
            <el-button type="primary" >确认</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
const checkboxGroup1 = ref(['Shanghai'])
const yewu = ['定期', '理财', '基金', '保险','信用卡']
const value1 = ref('')
const farenInput = ref('')
</script>
<style scoped>
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