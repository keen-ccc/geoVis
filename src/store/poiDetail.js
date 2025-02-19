import {defineStore} from 'pinia'

export const usePoiDetailStore = defineStore('poiDetail', {
    state: () => {
        poiData:[]
    },
    actions: {
        setPoiData(data){
            this.poiData = data
        }
    }
})    