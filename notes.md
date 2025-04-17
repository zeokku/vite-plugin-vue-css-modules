https://astexplorer.net/

# @blog isObjectProperty(props?: object | null): this is NodePath<t.ObjectProperty>;

`this is ...` - cool thing

# babel hell

babel traverse doesn't process the root node, so visitors won't be called on that.
solution is to wrap ast into ExpressionStatement but it then generates the result with a semicolon as if using `parse` insted of `parseExpression`

ended up just using parse and `.slice(0, -1)` to remove the semicolon

# @todo linking class names from other components options

options:

```js
{
    linkingSeparator: '__',
    linkingDir: '_',
    aliases: {
        '$': 'App' // $class -> App__class
    }
}
```
