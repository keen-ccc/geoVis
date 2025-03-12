// stores/counter.js
import { defineStore } from 'pinia'

export const useGridSelectorStore = defineStore('gridSelector', {
  state: () => {
    return { 
      gridID: -1,
      bound:{
        latStart: 0, latEnd:0, lonStart:0, lonEnd:0
    } }
  },
  // 也可以这样定义
  // state: () => ({ count: 0 })
  actions: {
    selectGrid(id, point1, point2) {
        this.gridID = id
        var newbound = {
              latStart: Math.min(point1[1], point2[1]), latEnd:Math.max(point1[1], point2[1]), lonStart:Math.min(point1[0], point2[0]), lonEnd:Math.max(point1[0], point2[0])
          }
        this.bound = newbound
    },
    cancelGrid() {
        this.gridID = -1;
        this.bound = {
            latStart: 0, latEnd:0, lonStart:0, lonEnd:0
        }
    }
  },
  persist : true
})