import type { Options as TPugOptions } from "pug";

import type { TLocalTransformOptions } from "./";

import { transformJsValue } from "./transformJsValue.js";

import { createRequire } from "module";
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
    parse: require("pug-parser"),
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
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions,
  pugLocals: Record<string, any> = {}
) => {
  let pugOptions: TPugOptions = {
    doctype: "html",
    compileDebug: pugLocals.dev,
    // pretty: pugLocals.dev,
  }; /*satisfies TPugOptions*/

  if (!pug) resolvePug();

  let { lex, parse, walk, generate, wrap } = pug;

  let ast = parse(lex(source));

  walk(ast, node => {
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
          case `:${preservePrefix}class`:
          case `:${preservePrefix}id`:
            attr.name = ":" + attr.name.slice(1 + preservePrefix.length);
            break;

          // escaped static
          case `${preservePrefix}class`:
          case `${preservePrefix}id`:
            attr.name = attr.name.slice(preservePrefix.length);
            break;

          // dynamic
          case ":class":
          case ":id":
          case "v-bind:class":
          case "v-bind:id":
            {
              let { quote, value } = parseQuotedValue(attr.val);

              value = transformJsValue(value, { preservePrefix, localNameGenerator, module });

              attr.val = "`" + value.replace(/`|"/g, "'") + "`";

              // " -> &quot; and etc
              attr.mustEscape = false;
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
