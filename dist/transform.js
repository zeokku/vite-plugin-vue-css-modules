import lex from "pug-lexer";
import parse from "pug-parser";
import walk from "pug-walk";
const parseClassObject = (classObjString) => {
    let result = [];
    classObjString
        .trim()
        .slice(1, -1)
        .trim()
        .split(/\s*,\s*/)
        .forEach((e) => {
        let [key, val] = e.split(/\s*:\s*/);
        key = key.startsWith("'") ? key.slice(1, -1) : key;
        val = val || key;
        result.push(`{[$style['${key}']] : ${val}}`);
    });
    return result;
};
const transform = (source, { preservePrefix }) => {
    let ast = parse(lex(source));
    ast = walk(ast, (node) => {
        if (node.attrs && node.attrs.length) {
            let classes = [];
            let idName = "";
            node.attrs.forEach((attr) => {
                switch (attr.name) {
                    case "class":
                        classes.push(attr.val.startsWith("'" + preservePrefix)
                            ?
                                "'" + attr.val.slice(1 + preservePrefix.length)
                            : `$style[${attr.val}]`);
                        break;
                    case ":class":
                    case "v-bind:class":
                        let c = attr.val.slice(1, -1);
                        if (c.startsWith("[")) {
                            c.slice(1, -1)
                                .trim()
                                .split(/\s*,\s*/)
                                .forEach((e) => {
                                if (e.startsWith("{")) {
                                    classes = classes.concat(parseClassObject(e));
                                }
                                else {
                                    classes.push(`$style[${e}]`);
                                }
                            });
                        }
                        else if (c.startsWith("{")) {
                            classes = classes.concat(parseClassObject(c));
                        }
                        else {
                            classes.push(`$style[${c}]`);
                        }
                        break;
                    case "id":
                        idName = attr.val.startsWith(`'${preservePrefix}`)
                            ? attr.val.slice(1, -1)
                            : `$style[${attr.val}]`;
                        break;
                    case ":id":
                    case "v-bind:id":
                        idName = `$style[${attr.val.slice(1, -1)}]`;
                        break;
                    case `:${preservePrefix}id`:
                        idName = attr.val.slice(1, -1);
                        break;
                    default:
                        break;
                }
            });
            if (classes.length || idName) {
                let finalAttrs = node.attrs.filter((a) => ![
                    "class",
                    ":class",
                    "v-bind:class",
                    "id",
                    ":id",
                    "v-bind:id",
                    `:${preservePrefix}id`,
                ].includes(a.name));
                if (classes.length) {
                    let resultingClassAttr = classes.length == 1 ? classes[0] : "[ " + classes.join(", ") + " ]";
                    finalAttrs.unshift({
                        name: ":class",
                        val: '"' + resultingClassAttr + '"',
                        mustEscape: true,
                    });
                }
                if (idName) {
                    if (idName.startsWith(preservePrefix)) {
                        finalAttrs.unshift({
                            name: "id",
                            val: '"' + idName.slice(preservePrefix.length) + '"',
                            mustEscape: true,
                        });
                    }
                    else {
                        finalAttrs.unshift({
                            name: ":id",
                            val: '"' + idName + '"',
                            mustEscape: true,
                        });
                    }
                }
                node.attrs = finalAttrs;
            }
        }
    });
    return ast;
};
export default transform;
