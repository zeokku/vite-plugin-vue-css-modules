import MagicString from "magic-string";

import { transformJsValue } from "./transformJsValue.js";

import { createRequire } from "module";
import { TLocalTransformOptions } from "./index.js";
const require = createRequire(import.meta.url);

let lex: typeof import("pug-lexer");

const resolveLex = () => {
  if (!lex) {
    lex = require("pug-lexer");
  }
};

// values may be wrapped in quotes
const parseQuotedValue = (val: string) =>
  // prettier-ignore
  val.match(/(?<quote>['"`]?)(?<value>[^]*)\1/)
    .groups as { 
        quote: "" | "`" | '"' | "'"
        value: string
    };

const getOffset = (lines: string[], pos: import("pug-lexer").Loc["start"]) => {
  let offset = 0;

  for (let l = 0; l < pos.line - 1; l += 1) {
    offset += lines[l].length;
  }

  offset += lines[pos.line - 1].slice(0, pos.column - 1).length;

  return offset;
};

const getRange = (lines: string[], loc: import("pug-lexer").Loc) => {
  return [getOffset(lines, loc.start), getOffset(lines, loc.end)] as [number, number];
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

  tokens.forEach(t => {
    switch (t.type) {
      // .class | #id
      case "class":
      case "id":
        {
          let value = t.val;

          // @note lexer includes . or # into range, yet ignores in value
          // we only need to replace the name itself, so we skip . or #
          t.loc.start.column += 1;

          let range = getRange(lines, t.loc);

          if (value.startsWith(preservePrefix)) {
            // remove prefix
            sourceTransform.update(...range, value.slice(preservePrefix.length));
          } else {
            sourceTransform.update(...range, localNameGenerator(value));
          }
        }
        break;
      case "attribute":
        {
          // @note technically we can have div(class="...") but we won't process this case
          // @todo :class=
        }
        break;
    }
  });

  return {
    code: sourceTransform.toString(),
    map: sourceTransform.generateMap(),
  };
};
