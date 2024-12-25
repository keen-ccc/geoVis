export const dotColors = {
    '中国银行':'#7D43B7',
    '交通银行':'#87ceeb',
    '中国工商银行':'#fb804f',
    '中国建设银行':'#E274B8',
    '中国农业银行':'#1D7BD1',
    '中国邮政储蓄银行':'#2b587d',
}

export const expressDotColors = {
    '菜鸟':'#1D7BD1',
    '顺丰':'#7D43B7',
    '圆通':'#E274B8',
    '中通':'#fb804f',
    '申通':'#87ceeb',
    '韵达':'#2b587d',
    '邮政':'#29b530',
    '京东':'#ee9c82',
}
export const getDotColors = (type) => {
    return dotColors[type]
}
export const getExpressDotColors = (type) => {
    return expressDotColors[type]
}
export default getDotColors;