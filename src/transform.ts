import lex from "pug-lexer";
import parse from "pug-parser";
import walk from "pug-walk";

const classObjParse = (classObjString: string): string[] => {
  let result: string[] = [];

  //remove {} and split entries
  classObjString
    .trim()
    .slice(1, -1)
    .trim()
    .split(/\s*,\s*/)
    .forEach((e) => {
      let [key, val] = e.split(/\s*:\s*/);

      //if key is a string
      key = key.startsWith("'") ? key.slice(1, -1) : key;

      // in case of {var2}
      val = val || key;

      result.push(`{[$style['${key}']] : ${val}}`);
    });

  return result;
};

interface TransformOptions {
  preservePrefix: string;
}

const transform = (source: string, { preservePrefix }: TransformOptions) => {
  let ast = parse(lex(source));

  ast = walk(ast, (node) => {
    if (node.attrs && node.attrs.length) {
      let classes = [];

      let idName = "";

      //values are wrapped into 'quotes'
      node.attrs.forEach((attr: { name: string; val: string }) => {
        switch (attr.name) {
          case "class":
            //'className'
            classes.push(
              attr.val.startsWith("'" + preservePrefix)
                ? //? attr.val.replace(new RegExp(`(?<=^')${preservePrefix}`), "")
                  "'" + attr.val.slice(1 + preservePrefix.length)
                : `$style[${attr.val}]`
            );

            break;

          case ":class":
          case "v-bind:class":
            //remove quotes
            let c = attr.val.slice(1, -1);

            //[{b: var}, {var2}, 'c', var3]
            if (c.startsWith("[")) {
              c.slice(1, -1)
                .trim()
                .split(/\s*,\s*/)
                .forEach((e) => {
                  if (e.startsWith("{")) {
                    classes = classes.concat(classObjParse(e));
                  } else {
                    classes.push(`$style[${e}]`);
                  }
                });
            }
            //{class1, class2: var}
            else if (c.startsWith("{")) {
              classes = classes.concat(classObjParse(c));
            }
            // var, x ? y : z
            else {
              classes.push(`$style[${c}]`);
            }

            break;

          case "id":
            //'id'
            idName = attr.val.startsWith(`'${preservePrefix}`)
              ? attr.val.slice(1, -1)
              : `$style[${attr.val}]`;

            break;

          case ":id":
          case "v-bind:id":
            //"id" -> remove quotes "
            idName = `$style[${attr.val.slice(1, -1)}]`;
            break;

          case ":--id":
            idName = attr.val.slice(1, -1);
            break;

          default:
            break;
        }
      });

      if (classes.length || idName) {
        let finalAttrs = node.attrs.filter(
          (a) =>
            ![
              "class",
              ":class",
              "v-bind:class",
              "id",
              ":id",
              "v-bind:id",
              ":--id",
            ].includes(a.name)
        );

        if (classes.length) {
          let resultingClassAttr =
            classes.length == 1 ? classes[0] : "[ " + classes.join(", ") + " ]";

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
          } else {
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
