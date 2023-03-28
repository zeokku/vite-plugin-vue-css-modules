investigate a possibility to render css module names statically instead of dynamically, since we have a name map during the processing
https://twitter.com/Linus_Borg/status/1310844386536718339
https://github.com/vuejs/vue-next/issues/2417

check to specifying `<style>` in the beginning of the file before `<template>`

# @todo !!! USE 4.9 SATISFIES FOR PLUGIN TO PRESERVE OWN TYPINGS

# @todo `$cssModule('name')` script macro to statically replace names in resulting code and completely dropping embedding of css modules code chunk

https://astexplorer.net/

# @blog isObjectProperty(props?: object | null): this is NodePath<t.ObjectProperty>;

`this is ...` - cool thing

# @todo try iterator for name generator

# babel hell

babel traverse doesn't process the root node, so visitors won't be called on that.
solution is to wrap ast into ExpressionStatement but it then generates the result with a semicolon as if using `parse` insted of `parseExpression`

ended up just using parse and `.slice(0, -1)` to remove the semicolon

# `.replace()` must be quite slow, use `slice` instead with offsets from vue-sfc parser

# @todo css dictionary names

# idea to enable script transform as `<script css-module-transform>` tag attribute?

# !!! allow linking class names from other components

options:

```js
{
    linkingPrefix: '-',
    linkingDir: '_',
    linkingSeparator: '--'
}
```

// link from /src/
`.-components_menu_button--wrap` - link `.wrap` class from `/src/components/menu/Button.vue
