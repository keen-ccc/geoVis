<script setup>

</script>

<template>
    <div class="grid-container">
        <div class="title">
            GeoVis
        </div>
        <div class="map-container">
            <p>map</p>
        </div>
        <div class="info-container">
            <div class="info-radar">
                <p>radar chart</p>
            </div>
            <div class="info-table">
                <p>this is a table</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-container{
    height: 100vh;
    width: 100%;
    display:grid;
    grid-template-columns: 3fr 1fr;
    grid-template-rows:2rem 1fr;
}
.title{
    grid-column:span 2;
    grid-row:1;
    background-color: white;
    font-weight: bold;
    vertical-align: middle;
    font-size: 1.5rem;

}
.map-container{
    grid-column:1;
    grid-row:span 2;
    border:2px solid #b5b5b5;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
}
.info-container{
    grid-column:2;
    grid-row:span 2;
    display:grid;
    grid-template-rows: 1fr 1.5fr;
    margin: 2px;
}
.info-radar{
    border:2px solid #b5b5b5;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
}
.info-table{
    border:2px solid #b5b5b5;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
}
</style>