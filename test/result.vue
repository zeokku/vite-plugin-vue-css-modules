<template ><div class="TEST__class0"> </div><div class="TEST__class0 TEST__class2"></div><div class="TEST__class3" id="TEST__id0">test</div><div :class='[{},{},"TEST__c","TEST__d",null]'></div><span :class="{}"></span><div></div><div :class="class4"></div><div :class="class5"></div><div :class="TEST__class7"></div><div :class="TEST__class11"></div><div>@todo This won't be processed</div><div class="escaped0"> </div><div id="escaped1"> </div><div :class="someRawVar"></div><div :id="someRawVar2"></div></template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {

    },
    async setup(props, { emit }) {
        alert('test!')
        return {}
    }
})
</script>

<style lang="less" module="a">
.class0 {
    display: flex;
}

.class2 {
    display: grid;
}

.class1 {
    display: ruby;
}
</style>