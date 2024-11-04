<script setup>
import * as d3 from 'd3'
import CateringSvg from '../../src/assets/catering.svg'
import BankSvg from '../assets/bank.svg'
import ExpressSvg from '../../src/assets/express.svg'
import CompanySvg from '../../src/assets/company.svg'
import MallSvg from '../../src/assets/mall.svg'

const props = defineProps({
    value: String
})
const svgComponents = {
    "银行": BankSvg,
    "物流": ExpressSvg,
    "餐饮": CateringSvg,
    "企业": CompanySvg,
    "商场": MallSvg
}
</script>
<template>
    <div v-if="svgComponents[value]" style="margin-right: 3rem;">
        <component :is="svgComponents[value]" class="svg-icon"></component>
    </div>
</template>
<style scoped>
.svg-icon{
    width: 2rem;
    height: 2rem;
}
</style>