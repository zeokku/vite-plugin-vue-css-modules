[![npm](https://img.shields.io/npm/v/vite-plugin-vue-static-css-modules?color=pink&style=flat-square)](https://www.npmjs.com/package/vite-plugin-vue-static-css-modules)
[![npm](https://img.shields.io/npm/dw/vite-plugin-vue-static-css-modules?color=pink&style=flat-square)](https://www.npmjs.com/package/vite-plugin-vue-static-css-modules)
[![Discord](https://img.shields.io/discord/405510915845390347?color=pink&label=join%20discord&style=flat-square)](https://zeokku.com/discord)

# ✨ vite-plugin-vue-static-css-modules

⚡ **Ultimate solution** for using **CSS modules** without any hassle. Automatic replacement for Vue templates and scripts. You don't have to use `$style` object, just write the code as usual.

⚡ The plugin statically processes and replaces names, so there's also **no** scripting overhead due to accessing the `$style` object.

## Installation

```
pnpm add -D vite-plugin-vue-static-css-modules
# or
yarn add -D vite-plugin-vue-static-css-modules
# or
npm i -D vite-plugin-vue-static-css-modules
```

## Usage

In `vite.config.ts`:

```javascript
import staticCssModules, { removeCssModulesChunk } from "vite-plugin-vue-static-css-modules";

export default defineConfig({
  plugins: [
    //...,
    staticCssModules(),
    vue(),
    // optionally
    removeCssModulesChunk(),
    //...
  ],
  //...
});
```

Notice that the plugin should go **BEFORE** `vue()` plugin, so it could transform `<template>` and `<script>` blocks.

If you used `<style scoped>` before, the plugin should work out of the box without any additional settings, just replace `scoped` by `module`.

## Options

The `staticCssModules()` plugin accepts an object `{}` with options:

- `preservePrefix` - an arbitrary string to be used as a prefix for names so they would not be processed and instead would be preserved as-is without the prefix. Useful for styles unaffected by CSS modules or custom #id values **(default: `"--"`)**
- `scopeBehaviour` - corresponds to `CSSModulesOptions["scopeBehaviour"]` **(default: `"local"`)**
- `scriptTransform` - if it's `false` - the plugin **will** wrap variables inside of `<template>` in CSS module context variable like so `$style[var]`. If it's `true` then the plugin will transform macros in `<script>` and `<script setup>` blocks and **will not** wrap anything in `<template>` (see more below) **(default: `false`)**
- `pugLocals` - an object containing variables for Pug templates **(default: `{}`)**
- `nameGenerator` - a function of type `CSSModulesOptions["generateScopedName"]` accepting (name, filename, css) arguments. This function will be called for each name in each file and it should return a result which will be used for generating a stylesheet. It is possible that the function may be called multiple times with the same pair of name and filename, so it must maintain its own state to return the same name in such case.

  The plugin provides two generators as **default** value. If `process.env.NODE_ENV === "production"` then the generator will minify resulting names, otherwise during development the generator returns `COMPONENT__CLASSNAME` type of string.

## Script handling

You can optionally use `removeCssModulesChunk()` plugin after `vue()` to strip out CSS module object for each component due to its redundancy, in this case `$style` and other CSS module context variables won't be available in `<template>`, so if you reference names in variables and use them in `<template>`, you must use `$cssModule` macro in `<script>` (see below).

If you need to access CSS modules in Javascript, you have two options:

1. _RECOMMENDED!_ Use `$cssModule` macro to access CSS modules (and set `scriptTransform` to `true`).

   If you're using Typescript, place the following code in your `env.d.ts` (or any other file) to get types support

   ```ts
   /// <reference path="vite-plugin-vue-static-css-modules/macros.d.ts" />
   ```

   The macro will be statically replaced with a resulting name string, so you can reference the variable in `<template>` as usual. Since the replacement is static you're allowed to use only the following forms:

   <!-- prettier-ignore -->
   ```ts
   $cssModule["class-name"];
   // OR
   $cssModule['class2'];
   // OR
   $cssModule.anotherClass;
   ```

2. `useCssModule` Vue composition function. Depending on the usage of JS variables in `<template>` you may either enable or disable `scriptTransform`. If you use the result of `useCssModules()[...]` in your `<template>` then you should enable `scriptTransform`, so the plugin doesn't wrap these variables in `$style[...]`. Otherwise set it to `false`, so any other referenced variables in `<template>` will be wrapped.

## Example

To use the plugin you won't need to change your templates. Look at the example:

```vue
<template lang="pug">
.class0.class2(:class="varClass")
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

console.log("script");
</script>

<script lang="ts" setup>
/// <reference path="vite-plugin-vue-static-css-modules/macros" />

const props = defineProps<{ title: string }>();

let varClass = $cssModule.test;

let varClass0 = $cssModule["test-class"];

let varClass1 = $cssModule["test-class2"];

let varClass2 = $cssModule[`test-class3`];

alert("test!");
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
```

Result with `scriptTransform` enabled:

```vue
<template>
  <div class="TEST__class0 TEST__class2" :class="varClass">
    <div class="TEST__class3" id="TEST__id0">test</div>
  </div>
  <div class="TEST__class0">
    <div :class="varClass"></div>
    <div :class="'TEST__class4'"></div>
    <div :class="'TEST__class5'"></div>
    <div :class="v ? 'TEST__class6' : 'TEST__class7'"></div>
  </div>
  <div
    :class="[
      {
        TEST__b: v,
      },
      {
        TEST__cv: cv,
      },
      'TEST__c',
      'TEST__d',
      nop,
    ]"
  >
    Yop
  </div>
  <span
    :class="{
      [computed]: toggle0,
      TEST__static: toggle1,
      'TEST__string-const': toggle2,
      'TEST__another-one': toggle3,
    }"
  ></span>
  <div :class="v0 ? 'TEST__class8' : v1 ? 'TEST__class9' : v2 ? class10 : 'TEST__class11'">
    <div :class="v0 ? varClass0 : varClass1">Now this is processed</div>
  </div>
  <div class="escaped0"></div>
  <div id="escaped1"></div>
  <div :class="someRawVar"></div>
  <div :id="someRawVar2"></div>
</template>

<script lang="ts">
export const aaaa = "test";

console.log("script");
</script>

<script lang="ts" setup>
/// <reference path="../macros.d.ts" />

const props = defineProps<{ title: string }>();

let varClass = "TEST__test";

let varClass0 = "TEST__test-class";

let varClass1 = "TEST__test-class2";

let varClass2 = "TEST__test-class3";

alert("test!");
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
```

Result with `scriptTransform` disabled. Notice that variables are wrapped in `$style`

```vue
<template>
  <div class="TEST__class0 TEST__class2" :class="$style[varClass]">
    <div class="TEST__class3" id="TEST__id0">test</div>
  </div>
  <div class="TEST__class0">
    <div :class="$style[varClass]"></div>
    <div :class="'TEST__class4'"></div>
    <div :class="'TEST__class5'"></div>
    <div :class="v ? 'TEST__class6' : 'TEST__class7'"></div>
  </div>
  <div
    :class="[
      {
        TEST__b: v,
      },
      {
        TEST__cv: cv,
      },
      'TEST__c',
      'TEST__d',
      $style[nop],
    ]"
  >
    Yop
  </div>
  <span
    :class="{
      [$style[computed]]: toggle0,
      TEST__static: toggle1,
      'TEST__string-const': toggle2,
      'TEST__another-one': toggle3,
    }"
  ></span>
  <div :class="v0 ? 'TEST__class8' : v1 ? 'TEST__class9' : v2 ? $style[class10] : 'TEST__class11'">
    <div :class="v0 ? $style[varClass0] : $style[varClass1]">Now this is processed</div>
  </div>
  <div class="escaped0"></div>
  <div id="escaped1"></div>
  <div :class="someRawVar"></div>
  <div :id="someRawVar2"></div>
</template>
```

## Edge cases

Sometimes it's needed to preserve id/class names. Here is where `preservePrefix` option is used. From the examples above:

```pug
.--escaped0
#--escaped1

div(:--class="someRawVar")
div(:--id="someRawVar2")
```

was turned into

```html
<div class="escaped0"></div>
<div id="escaped1"></div>
<div :class="someRawVar"></div>
<div :id="someRawVar2"></div>
```

no matter the settings
