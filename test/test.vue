<template lang="pug">
.class0.class2  
    #id0.class3 test

.class0 
    div(:class="varClass")
    div(:class="'class4'")
    div(:class='"class5"')
    div(:class="v ? 'class6' : `class7`")

div(:class="[{b: v}, {cv}, 'c', `d`, nop]") Yop

span(:class=`{
    [computed] : toggle0,
    static: toggle1,
    'string-const':toggle2,
    "another-one" :toggle3
}`)

div(:class="v0 ? 'class8' : v1 ? 'class9' : v2 ? class10 :'class11'")
    div(:class="v0 ? varClass0 : varClass1") Now this is processed

.--escaped0 
#--escaped1 

div(:--class="someRawVar")
div(:--id="someRawVar2")
</template>

<script lang="ts">
export const aaaa = "test";

console.log('script');
</script>

<script lang="ts" setup>

const props = defineProps<{ title: string }>();

var varClass0 = $style['test-class']

var varClass1 = $style["test-class2"]

var varClass2 = $style[`test-class3`]

var varClass3 = $style.header

alert('test!')
</script>

<style lang="less" module>
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