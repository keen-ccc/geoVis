export const dotColors = {
    '中国银行':'#c0dfa1',
    '交通银行':'#011936',
    '中国工商银行':'#9fc490',
    '中国建设银行':'#465362',
    '中国农业银行':'#82a3a1'
}

export const getDotColors = (type) => {
    return dotColors[type]
}
export default getDotColors;