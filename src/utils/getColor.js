export const dotColors = {
    '中国银行':'#c0dfa1',
    '交通银行':'#011936',
    '中国工商银行':'#9fc490',
    '中国建设银行':'#465362',
    '中国农业银行':'#82a3a1'
}

export const expressDotColors = {
    '菜鸟':'#c0dfa1',
    '顺丰':'#011936',
    '圆通':'#9fc490',
    '中通':'#465362',
    '申通':'#82a3a1',
    '韵达':'#82a3a1',
    '邮政':'#82a3a1',
    '京东':'#82a3a1',
}
export const getDotColors = (type) => {
    return dotColors[type]
}
export const getExpressDotColors = (type) => {
    return expressDotColors[type]
}
export default getDotColors;