import { MagicString } from "@vue/compiler-sfc";
import type { Loc } from "pug-lexer";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { transformJsValue } from "./transformJsValue.js";
import { TLocalTransformOptions } from "./index.js";
import { parseQuotedValue } from "./shared.js";

type TPugLexer = typeof import("pug-lexer");

let lex: TPugLexer;

const resolveLex = () => {
  if (!lex) {
    lex = require("pug-lexer");
  }
};

/**
 * Get offset in global SFC space
 * @param localOffset Current block offset inside of SFC
 */
const getOffset = (lines: string[], pos: Loc["start"], localOffset: number) => {
  let offset = localOffset;

  for (let l = 1; l < pos.line; l += 1) {
    offset += lines[l - 1].length;
  }

  offset += lines[pos.line - 1].slice(0, pos.column - 1).length;

  return offset;
};

/**
 * Get range in global SFC space
 * @param localOffset Current block offset inside of SFC
 */
const getRange = (lines: string[], loc: Loc, localOffset: number) => {
  return [
    getOffset(lines, loc.start, localOffset),
    getOffset(lines, loc.end, localOffset),
  ] as [startOffset: number, endOffset: number];
};

export const transformPug = (
  source: string,
  contentOffset: number,
  sfcTransform: MagicString,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  resolveLex();

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

          let range = getRange(lines, t.loc, contentOffset);

          if (value.startsWith(preservePrefix)) {
            // remove prefix
            sfcTransform.update(...range, value.slice(preservePrefix.length));
          } else {
            sfcTransform.update(...range, localNameGenerator(value));
          }
        }
        break;
      case "attribute":
        {
          // @note skip attrs without value
          if (!t.val) return;

          switch (t.name) {
            // div(class="a b" id="c")
            case "class":
            case "id":
              {
                let range = getRange(lines, t.loc, contentOffset);

                let { quote, value } = parseQuotedValue(t.val as string);

                const startOffset = range[1] - quote.length - value.length;

                const rgx = /\S+/g;

                let matchResult = rgx.exec(value);

                while (matchResult) {
                  const [match] = matchResult;

                  let name = match.startsWith(preservePrefix)
                    ? match.slice(preservePrefix.length)
                    : localNameGenerator(match);

                  sfcTransform.update(
                    startOffset + matchResult.index,
                    startOffset + matchResult.index + match.length,
                    name
                  );

                  matchResult = rgx.exec(value);
                }
              }
              break;

            case ":class":
            case ":id":
            case "v-bind:class":
            case "v-bind:id":
              {
                let [startOffset, endOffset] = getRange(
                  lines,
                  t.loc,
                  contentOffset
                );

                // @note :class={quote}{value}{quote}
                // @note damn pug normalizes \r\n into \n leading to offset issues
                let { value, quote } = parseQuotedValue(t.val as string);

                transformJsValue(
                  value,
                  endOffset - quote.length - value.length,
                  sfcTransform,
                  quote,
                  {
                    preservePrefix,
                    localNameGenerator,
                    module,
                  }
                );
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

                let range = getRange(lines, loc, contentOffset);

                let name = t.name.replace(
                  new RegExp(`(?<=^:?)${preservePrefix}`),
                  ""
                );

                sfcTransform.update(...range, name);
              }
              break;
          }
        }
        break;
    }
  });
};
