<script setup>
import * as d3 from 'd3'
import CateringSvg from '../../src/assets/catering.svg'
import BankSvg from '../assets/bank.svg'
import ExpressSvg from '../../src/assets/express.svg'
import CompanySvg from '../../src/assets/company.svg'
import MallSvg from '../../src/assets/mall.svg'
import QichefuwuSvg from '../../src/assets/qichefuwu.svg'
import QichexiaoshouSvg from '../../src/assets/qichexiaoshou.svg'
import YuleSvg from '../../src/assets/yule.svg'
import ZhusuSvg from '../../src/assets/zhusu.svg'
import YiliaoSvg from '../../src/assets/yiliao.svg'
import WenhuaSvg from '../../src/assets/wenhua.svg'
import ZhengfuSvg from '../../src/assets/zhengfu.svg'

const props = defineProps({
    value: String
})
const svgComponents = {
    "银行": BankSvg,
    "物流": ExpressSvg,
    "餐饮": CateringSvg,
    "企业": CompanySvg,
    "购物": MallSvg,
    "医疗": YiliaoSvg,
    "科教文化": WenhuaSvg,
    "住宿": ZhusuSvg,
    "政府机构": ZhengfuSvg,
    "娱乐": YuleSvg,
    "汽车销售": QichexiaoshouSvg,
    "汽车服务": QichefuwuSvg
}
</script>
<template>
    <div v-if="svgComponents[value]" style="margin-right: 2rem;">
        <component :is="svgComponents[value]" class="svg-icon"></component>
    </div>
</template>
<style scoped>
.svg-icon{
    width: 2rem;
    height: 2rem;
}
</style>