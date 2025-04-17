import MagicString from "magic-string";

import { transformJsValue } from "./transformJsValue.js";

import { createRequire } from "module";
import { TLocalTransformOptions } from "./index.js";
const require = createRequire(import.meta.url);

import type { Loc } from "pug-lexer";

type TPugLexer = typeof import("pug-lexer");

let lex: TPugLexer;

const resolveLex = () => {
  if (!lex) {
    lex = require("pug-lexer");
  }
};

// values may be wrapped in quotes
const parseQuotedValue = (val: string) =>
  // prettier-ignore
  val.match(/(?<quote>['"`]?)(?<value>[^]*)\1/)!
    .groups as { 
        quote: "" | "`" | '"' | "'"
        value: string
    };

const getOffset = (lines: string[], pos: Loc["start"]) => {
  let offset = 0;

  for (let l = 1; l < pos.line; l += 1) {
    offset += lines[l - 1].length;
  }

  offset += lines[pos.line - 1].slice(0, pos.column - 1).length;

  return offset;
};

const getRange = (lines: string[], loc: Loc) => {
  return [getOffset(lines, loc.start), getOffset(lines, loc.end)] as const;
};

export const transformPug = (
  source: string,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  resolveLex();

  let sourceTransform = new MagicString(source);
  // @note include new line chars so we get proper offset
  let lines = source.split(/(?<=\r?\n)/g);

  let tokens = lex(source);

  // console.log(JSON.stringify(tokens, null, 4));

  tokens.forEach(t => {
    switch (t.type) {
      // .class | #id | .--class | #--id
      case "class":
      case "id":
        {
          let value = t.val as string;

          // @note lexer includes . or # into range, yet ignores in value we only need to replace the name itself, so we skip . or #
          t.loc.start.column += 1;

          let range = getRange(lines, t.loc);

          if (value.startsWith(preservePrefix)) {
            // remove prefix
            sourceTransform.update(
              ...range,
              value.slice(preservePrefix.length)
            );
          } else {
            sourceTransform.update(...range, localNameGenerator(value));
          }
        }
        break;
      case "attribute":
        {
          switch (t.name) {
            // div(class="a" id="b")
            case "class":
            case "id":
              {
                // @note skip attrs without value
                if (!t.val) return;

                let range = getRange(lines, t.loc);

                let { quote, value } = parseQuotedValue(t.val as string);

                if (value.startsWith(preservePrefix)) {
                  value = value.slice(preservePrefix.length);
                } else {
                  value = localNameGenerator(value);
                }

                sourceTransform.update(
                  ...range,
                  `${t.name}=${quote}${value}${quote}`
                );
              }
              break;

            case ":class":
            case ":id":
            case "v-bind:class":
            case "v-bind:id":
              {
                // @note skip attrs without value
                if (!t.val) return;

                let range = getRange(lines, t.loc);

                let { value } = parseQuotedValue(t.val as string);

                value = transformJsValue(value, {
                  preservePrefix,
                  localNameGenerator,
                  module,
                });

                // @note value can only have ` or " quotes after babel transform
                sourceTransform.update(...range, `${t.name}='${value}'`);
              }
              break;

            case `${preservePrefix}class`:
            case `${preservePrefix}id`:
            case `:${preservePrefix}class`:
            case `:${preservePrefix}id`:
              {
                let loc = t.loc;
                loc.end.line = loc.start.line;
                loc.end.column = loc.start.column + t.name.length;

                let range = getRange(lines, loc);

                let name = t.name.replace(
                  new RegExp(`(?<=^:?)${preservePrefix}`),
                  ""
                );

                sourceTransform.update(...range, name);
              }
              break;
          }
        }
        break;
    }
  });

  return {
    code: sourceTransform.toString(),
    map: sourceTransform.generateMap(),
  };
};
