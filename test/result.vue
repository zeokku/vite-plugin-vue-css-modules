<template >
<div class="TEST__class0 TEST__class2"> 
  <div class="TEST__class3" id="TEST__id0">test</div>
</div>
<div class="TEST__class0"> 
  <div :class="$style[varClass]"></div>
  <div :class="'TEST__class4'"></div>
  <div :class="'TEST__class5'"></div>
  <div :class="v ? 'TEST__class6' : 'TEST__class7'"></div>
</div>
<div :class="[{
  'TEST__b': v
}, {
  'TEST__cv': cv
}, 'TEST__c', 'TEST__d', $style[nop]]">Yop</div><span :class="({
  [$style[computed]]: toggle0,
  'TEST__static': toggle1,
  'TEST__string-const': toggle2,
  'TEST__another-one': toggle3
})"></span>
<div :class="v0 ? 'TEST__class8' : v1 ? 'TEST__class9' : v2 ? $style[class10] : 'TEST__class11'">
  <div :class="v0 ? $style[varClass0] : $style[varClass1]">Now this is processed</div>
</div>
<div class="escaped0"> </div>
<div id="escaped1"> </div>
<div :class="someRawVar"></div>
<div :id="someRawVar2"></div></template>

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