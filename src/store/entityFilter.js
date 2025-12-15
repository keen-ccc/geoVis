import { defineStore } from 'pinia'

export const useEntityFilterStore = defineStore('entityFilter', {
  state: () => ({
    // estdateRange: [startDate, endDate] as strings 'YYYY-MM-DD' or null
    estdateRange: null
  }),
  actions: {
    setEstdateRange(range) {
      this.estdateRange = range
    },
    clear() {
      this.estdateRange = null
    }
  }
})
