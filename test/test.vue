<template lang="pug">
.class0 
.class0.class2
#id0.class3 test
div(:class="[{b: v}, {cv}, 'c', `d`, nop]")
span(:class=`{
    [computed] : toggle0,
    static: toggle1,
    'string-const':toggle2,
    "another-one" :toggle3
}`)
div(:class="varClass")
div(:class="'class4'")
div(:class='"class5"')
div(:class="v ? 'class6' : `class7`")
div(:class="v0 ? 'class8' : v1 ? 'class9' : v2 ? class10 :'class11'")
div(:class="v0 ? varClass0 : varClass1") @todo This won't be processed
.--escaped0 
#--escaped1 
div(:--class="someRawVar")
div(:--id="someRawVar2")
</template>

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