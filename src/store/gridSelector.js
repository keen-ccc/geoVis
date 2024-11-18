// stores/counter.js
import { defineStore } from 'pinia'

export const useGridSelectorStore = defineStore('gridSelector', {
  state: () => {
    return { gridID: -1 }
  },
  // 也可以这样定义
  // state: () => ({ count: 0 })
  actions: {
    // selectGrid(point1, point2) {
    //     var newbound = {
    //         latStart: Math.min(point1[1], point2[1]), latEnd:Math.max(point1[1], point2[1]), lonStart:Math.min(point1[0], point2[0]), lonEnd:Math.max(point1[0], point2[0])
    //     }
    //     this.bound = newbound
    // },
    selectGrid(id) {
      this.gridID = id
    },
    cancelGrid() {
      this.gridID = -1
    }
  },
  persist : true
})