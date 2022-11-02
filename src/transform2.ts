import lex from "pug-lexer";
import parse from "pug-parser";
import walk from "pug-walk";

type TNameGenerator = (name: string) => string;

interface TTransformOptions {
  preservePrefix: string;
  nameGenerator: TNameGenerator;
}

/*
[] | {}
*/
const parseEntries = (str: string) => {
  return (
    str //
      .trim() // remove white spaces around " { ... } " => "{ ... }"
      .slice(1, -1) // remove {} or [] "{ a, b, c, }" => " a, b, c, "
      .trim() // " a, b, c, " => "a, b, c,"
      .split(/\s*,\s*/g) // split by entries "a, b, c," => ["a", "b", "c", ""]
      // @todo: technically it may split if string got ',' character
      .filter(e => e)
  );
};

/*
{
    [computed] : toggle0,
    static: toggle1,
    'string-const':toggle2,
    "another-one" :toggle3
}
*/
/**
 *
 * @param str
 * @param nameGenerator
 * @returns processed object string "{ ... }"
 */
const processClassObject = (str: string, nameGenerator: TNameGenerator) => {
  return (
    "{" +
    parseEntries(str)
      .map(e => {
        let [key, val] = e.split(/\s*:\s*/);

        // e.g. { visible }
        val ??= key;

        // [computed]
        if (key.startsWith("[")) {
          key = `[$style[${key.slice(1, -1)}]]`;
        }
        // 'key' | "key" | key
        else {
          key = `'${nameGenerator(parseQuotedValue(key).value)}'`;
        }

        return key + ":" + val;
      })
      .join(",") +
    "}"
  );
};

// values may be wrapped in quotes
const parseQuotedValue = (val: string) =>
  // prettier-ignore
  val.match(/(?<quote>['"`]?)(?<value>[^]*)\1/)
    .groups as { 
        quote: "" | "`" | '"' | "'"
        value: string
    };

/**
 *
 * @param source pug template
 * @param options prefix and name generator
 * @returns ast tree
 */
export const transform = (source: string, { preservePrefix, nameGenerator }: TTransformOptions) => {
  let ast = parse(lex(source));

  return walk(ast, node => {
    // if node has attributes
    if (node.attrs?.length) {
      // mutate class and id attributes
      node.attrs.forEach((attr: { name: string; val: string; mustEscape: boolean }) => {
        switch (attr.name) {
          // static
          case "class":
          case "id":
            {
              let { quote, value } = parseQuotedValue(attr.val);

              if (value.startsWith(preservePrefix)) {
                // remove prefix
                attr.val = "'" + value.slice(preservePrefix.length) + "'";
              } else {
                attr.val = "'" + nameGenerator(value) + "'";
              }
            }
            break;

          // escaped dynamic
          case ":--class":
          case ":--id":
            attr.name = ":" + attr.name.slice(3);
            break;

          // dynamic
          case ":class":
          case ":id":
          case "v-bind:class":
          case "v-bind:id":
            {
              let { quote, value } = parseQuotedValue(attr.val);

              value = value.trim();

              // @note values should be wrapped in quotes, otherwise nested js will be executed

              //[{b: var}, {var2}, 'c', "d", var3]
              if (value.startsWith("[")) {
                value =
                  "[" +
                  parseEntries(value)
                    .map(i => {
                      if (i.startsWith("{")) {
                        return processClassObject(i, nameGenerator);
                      }
                      // 'c', "d", var3
                      else {
                        let { quote: q, value: v } = parseQuotedValue(i);

                        // var3
                        if (q === "") {
                          return `$style[${i}]`;
                        }
                        // 'c', "d"
                        else {
                          return "'" + nameGenerator(v) + "'";
                        }
                      }
                    })
                    .join(",") +
                  "]";
              }
              // { ... }
              else if (value.startsWith("{")) {
                value = processClassObject(value, nameGenerator);
              }

              // 'class' | "class" | var ? 'class1' : 'class2'
              else {
                value = value.replace(/(['"`])([^]*?)\1/g, (_, quote, value) => {
                  return "'" + nameGenerator(value) + "'";
                });
              }

              attr.val = "`" + value + "`";
              attr.mustEscape = false;
            }
            break;
        }
      });
    }
  });
};
