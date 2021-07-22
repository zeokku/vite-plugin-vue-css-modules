[![npm](https://img.shields.io/npm/v/vite-plugin-vue-picm?color=pink&style=flat-square)](https://www.npmjs.com/package/vite-plugin-vue-picm)
[![npm](https://img.shields.io/npm/dw/vite-plugin-vue-picm?color=pink&style=flat-square)](https://www.npmjs.com/package/vite-plugin-vue-picm)
[![Discord](https://img.shields.io/discord/405510915845390347?color=pink&label=join%20discord&style=flat-square)](https://zeokku.com/discord)


# vite-plugin-vue-picm

Vite plugin for implicit usage of CSS modules inside of Vue SFC Pug templates

PICM = Pug Implicit CSS Modules

This plugin is a port of original vue-cli [plugin](https://github.com/zeokku/vue-cli-plugin-pug-with-css-modules) with a bunch of additions and tweaks (eventually I'll add them for the original one as well)

Implicit usage of CSS modules means you may write your Pug templates as usual without having to type `$style['...']` manually every time (see example below)

## Installation

```
yarn add -D vite-plugin-vue-picm
```

In `vite.config.ts`:

```javascript
import { plugin as picm } from "vite-plugin-vue-picm";

export default defineConfig({
    plugins: [picm(), vue(), ...],
    ...
})
```

Notice that the plugin should go **BEFORE** vue() plugin, so it could transform templates

(If you get errors regarding ESM importing, make sure to use "type": "module" in your project's package.json)

Don't forget to use `module` attribute and remove `scoped`

By default the plugin generates COMPONENT\_\_CLASSNAME values in development and minimized names during `vite build`

## Example

To use the plugin you won't need to change your templates. Look at the example:

```vue
<template lang="pug">
bob.sas(
  :class="{ state, locked }",
  @click="setState"
)
  .child 
    .grand-child

#id.a.z.x(:class="[b, c, d]")

div(:class="{d: someVar}" :id="someIdVar")
div(:class="a ? 'b' : c")
div(:class="someOtherVar")

bob
</template>

<style module>
.sas {
  //
}

.state {
  //
}

//
</style>
```

The plugin processes pug and transforms class and id attributes to use $style and then compiles into html:

```html
<bob
  :class="[ $style['sas'], {[$style['state']] : state}, {[$style['locked']] : locked} ]"
  @click="setState"
>
  <div :class="$style['child']">
    <div :class="$style['grand-child']"></div>
  </div>
</bob>
<div
  :id="$style['id']"
  :class="[ $style['a'], $style['z'], $style['x'], $style[b], $style[c], $style[d] ]"
></div>
<div :id="$style[someIdVar]" :class="{[$style['d']] : someVar}"></div>
<div :class="$style[a ? 'b' : c]"></div>
<div :class="$style[someOtherVar]"></div>
<bob></bob>
```

## Edge cases

Sometimes it's needed to preserve id/class names. In this scenario use `--` as a prefix to keep the name (Or you can select your own prefix using plugin options)

**ID Example:**

```vue
<template lang="pug">
svg <!-- preserve tag case -->
  filter#--filter-1
    //...

.element bababooey
</template>

<style module>
.element {
  filter: url(#filter-1);
}
</style>
```

_Notice, that the prefix is removed in the output_

**Computed :ID example**

```vue
<template lang="pug">
.element(:--id="someComputedId")
</template>
```

Output will have `:id="someComputedId"` instead of `:id="$style[someComputedId]"`

**Class example**

```vue
<template lang="pug">
.--element bababooey
.--element2 test

.this-will-be-minified bog
</template>

<style>
.element {
  //
}
</style>

<style module>
.this-will-be-minified {
  //
}

:global(.element2) {
  //
}
</style>
```
