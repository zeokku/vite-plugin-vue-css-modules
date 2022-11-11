<template>
    <div class="class0 class2" :class="varClass">
        <div class="class3" id="id0">test</div>
    </div>
    <div class="class0">
        <div :class="varClass"></div>
        <div :class="'class4'"></div>
        <div :class='"class5"'></div>
        <div :class="v ? 'class6' : `class7`"></div>
    </div>
    <div :class="[{ b: v }, { cv }, 'c', `d`, varClass2]">Yop</div><span :class="{
        [computed]: toggle0,
        static: toggle1,
        'string-const': toggle2,
    }"></span>
    <div :class="v0 ? 'class8' : v1 ? 'class9' : v2 ? class10 : 'class11'">
        <div :class="v0 ? varClass0 : varClass1">Now this is processed</div>
    </div>
    <div class="--escaped0"> </div>
    <div id="--escaped1"> </div>
    <div :--class="someRawVar"></div>
    <div :--id="someRawVar2"></div>
</template>

<script lang="ts">
export const aaaa = "test";

console.log('script');
</script>

<script lang="ts" setup>
/// <reference path="../macros.d.ts" />

const props = defineProps<{ title: string }>();

let varClass = $cssModule.test;

let varClass0 = $cssModule['test-class']

let varClass1 = $cssModule["test-class2"]

let varClass2 = $cssModule[`test-class3`]


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