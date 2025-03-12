// stores/counter.js
import { defineStore } from 'pinia'

export const useGridSelectorStore = defineStore('gridSelector', {
  state: () => {
    return { 
      num:0,
      grids: new Map()
    }
  },
  // 也可以这样定义
  // state: () => ({ count: 0 })
  actions: {
    selectGrid(id, point1, point2) {
      if (this.grids.has(id)) {
        this.grids.delete(id);
        this.num = this.grids.size;
      } else {
        var newbound = {
            latStart: Math.min(point1[1], point2[1]), latEnd:Math.max(point1[1], point2[1]), lonStart:Math.min(point1[0], point2[0]), lonEnd:Math.max(point1[0], point2[0])
        };
        this.grids.set(id, newbound);
        this.num = this.grids.size;
      }
    },
    clearGrid() {
      this.grids = new Map();
      this.num = 0;
    }
    // cancelGrid() {
    //     this.gridID = -1;
    //     this.bound = {
    //         latStart: 0, latEnd:0, lonStart:0, lonEnd:0
    //     }
    // }
  },
  getters: {
    findGrid: (state) => {
      return (id) => state.grids.has(id);
    }
  },
  persist : true
})