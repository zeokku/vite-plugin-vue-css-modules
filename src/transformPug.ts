import type { Options as TPugOptions } from "pug";

import type { TLocalTransformOptions } from "./types";

import { createRequire } from "module";
import { transformJsValue } from "./transformJsValue";
const require = createRequire(import.meta.url);

let pug: {
  parse: typeof import("pug-parser"); //
  lex: typeof import("pug-lexer");
  walk: typeof import("pug-walk");
  generate: typeof import("pug-code-gen");
  wrap: typeof import("pug-runtime/wrap");
};

const resolvePug = () => {
  pug = {
    lex: require("pug-lexer"),
    parse: require("pug-parse"),
    walk: require("pug-walk"),
    generate: require("pug-code-gen"),
    wrap: require("pug-runtime/wrap"),
  };
};

// values may be wrapped in quotes
const parseQuotedValue = (val: string) =>
  // prettier-ignore
  val.match(/(?<quote>['"`]?)(?<value>[^]*)\1/)
    .groups as { 
        quote: "" | "`" | '"' | "'"
        value: string
    };

export const transformPug = (
  source: string,
  pugLocals: Record<string, any>,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  let pugOptions = { doctype: "html", compileDebug: pugLocals.dev }; /*satisfies TPugOptions*/

  if (!pug) resolvePug();

  let { lex, parse, walk, generate, wrap } = pug;

  let ast = parse(lex(source));

  ast = walk(ast, node => {
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
                attr.val = "'" + localNameGenerator(value) + "'";
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

              value = transformJsValue(value, { preservePrefix, localNameGenerator, module });

              //   attr.val = "`" + value + "`";
              attr.val = value;
              //   attr.mustEscape = false;
            }
            break;
        }
      });
    }
  });

  let templateFn = wrap(generate(ast, pugOptions));

  //template({locals}), locals are vars referenced by using #{var} in pug src | { var: 'bob' }
  return templateFn(pugLocals) as string;
};