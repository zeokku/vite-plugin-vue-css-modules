[![npm](https://img.shields.io/npm/v/vite-plugin-vue-css-modules?color=pink&style=flat-square)](https://www.npmjs.com/package/vite-plugin-vue-css-modules)
[![npm](https://img.shields.io/npm/dw/vite-plugin-vue-css-modules?color=pink&style=flat-square)](https://www.npmjs.com/package/vite-plugin-vue-css-modules)
[![Discord](https://img.shields.io/discord/405510915845390347?color=pink&label=join%20discord&style=flat-square)](https://zeokku.com/discord)

# ✨ vite-plugin-vue-css-modules

⚡ **Ultimate solution** for using **CSS modules** without any hassle. Automatic replacement for Vue templates and scripts. You don't have to use `$style` object, just write the code as usual.

⚡ The plugin statically processes and replaces names, so there's also **no** scripting overhead due to accessing the `$style` object.

## Installation

```
pnpm add -D vite-plugin-vue-css-modules
# or
yarn add -D vite-plugin-vue-css-modules
# or
npm i -D vite-plugin-vue-css-modules
```

## Usage

In `vite.config.ts`:

```javascript
import { cssm, removeCssModulesChunk } from "vite-plugin-vue-css-modules";

export default defineConfig({
  plugins: [
    //...,
    cssm({
      scriptTransform: true,
    }),
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

The plugin accepts an object `{}` with options:

- `preservePrefix` - an arbitrary string to be used as a prefix for names so they would not be processed and instead would be preserved as-is without the prefix. Useful for styles unaffected by CSS modules or custom #id values **(default: `"--"`)**
- `scopeBehaviour` - corresponds to `CSSModulesOptions["scopeBehaviour"]` **(default: `"local"`)**
- `scriptTransform` - if it's `false` - the plugin **will** wrap variables inside of `<template>` in CSS module context variable like so `$style[var]`. If it's `true` then the plugin will transform `$cssModule` macros in `<script>` and `<script setup>` blocks and **will not** wrap anything in `<template>` (see more below) **(default: `false`)**
- `pugLocals` - an object containing variables for Pug templates **(default: `{}`)**
- `nameGenerator` - a function of type `CSSModulesOptions["generateScopedName"]` accepting `(name, filename, css)` arguments. This function will be called for each name in each file and it should return a result which will be used for generating a stylesheet. It is possible that the function may be called multiple times with the same pair of name and filename, so it must maintain its own state to return the same name in such case.

  The plugin provides two generators as **default** value. If `process.env.NODE_ENV === "production"` then the generator will minify resulting names, otherwise during development the generator returns `Component_Path__classname` type of string.

## Script handling

You can optionally use `removeCssModulesChunk()` plugin after `vue()` to strip out CSS module object for each component due to its redundancy, in this case `$style` and other CSS module context variables won't be available in `<template>`, so if you reference names in variables and then use them in `<template>`, you must use `$cssModule` macro in `<script>` (see below).

If you need to access CSS modules in Javascript, you have two options:

1. **_RECOMMENDED!_** Use `$cssModule` macro to access CSS modules (and set `scriptTransform` to `true`).

   If you're using Typescript, place the following code in your `env.d.ts` (or any other file) to get basic types support

   ```ts
   /// <reference types="vite-plugin-vue-css-modules/macros" />
   ```

   The macro will be statically replaced with a resulting name string, so you can reference the variable in `<template>` as usual. Since the replacement is static you're allowed to use only the following forms:

   <!-- prettier-ignore -->
   ```ts
   $cssModule["class-name"];
   // OR
   $cssModule['class2'];
   // OR
   // NOTICE! camel case will be transformed to hyphenated when using property notation
   // so this will be processed as 'another-class'
   $cssModule.anotherClass;
   ```

2. `useCssModule` Vue composition function. Depending on the usage of JS variables in `<template>` you may either enable or disable `scriptTransform`. If you use the result of `useCssModules()[...]` in your `<template>` then you should enable `scriptTransform`, so the plugin doesn't wrap these variables in `$style[...]`. Otherwise set it to `false`, so any referenced variables in `<template>` will be wrapped.

## Cross component referencing

Default name generators maintain a record which maps particular class from a particular component file to CSS modules name. This allows us to reference class names from other components, achieving global accessability of any class name in any component. Look at the example:

```vue
<!-- src/App.vue -->

<template lang="pug">
.app
  .class-name
</template>

<style module>
.app {
}

.class-name {
}
</style>
```

We can access class names from App.vue by using scope `App__`

```vue
<!-- src/components/Foo.vue -->

<template lang="pug">
.foo
  .App__class-name
</template>

<style module>
.foo {
}
</style>
```

Any class name is available from any component by using a scope prefix. Scope prefix must be specified following the rules:

1. Scope prefix is separated from class name by double underscore `__`
   `App__class-name`
1. Root directory is `/src/`. Subdirectories are denoted by single underscore `_`
   `/src/path/sub/Bar.vue` will be `path_sub_Bar__class-name`
1. If the file is in `/src/components/` folder then prefix must be `C[ComponentFileName]`
   `/src/components/Foo.vue` will be `CFoo__class-name`
   Subdirectories work the same:
   `/src/components/Foo/Bar.vue` will be `CFoo_Bar__class-name`
1. If the file is in `/src/views/` folder then prefix must be `V[ComponentFileName]`
   `/src/views/About.vue` will be `VAbout__class-name`

## Edge cases

Sometimes it's needed to preserve id/class names. Here is where `preservePrefix` option is used (in the example below we assume it's the default `--` value). Individual class names in both regular attributes and as string literals in `:class` having the prefix will not be processed but the prefix being removed. You can also use `--class` or `:--class` attributes to skip processing of entire attribute value.

```pug
.--escaped0
//- you can mix escaped as you want
.--escaped1.class0

#--escaped2

div(:--class="someRawVar")
div(:--id="someRawVar2")

div(--class="class0 class1")
```

will be turned into

```html
<div class="escaped0"></div>
<div class="escaped1 TRANSFORMED_class0"></div>

<div id="escaped2"></div>

<div :class="someRawVar"></div>
<div :id="someRawVar2"></div>

<div class="class0 class1"></div>
```

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
/// <reference path="vite-plugin-vue-css-modules/macros.d.ts" />

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
