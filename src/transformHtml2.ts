import type { MagicString } from "@vue/compiler-sfc";
import { parse, SyntaxKind, walk } from "html5parser";

import { TLocalTransformOptions } from "./index.js";
import { transformJsValue } from "./transformJsValue.js";

export const transformHtml = (
  source: string,
  contentOffset: number,
  sfcTransform: MagicString,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  const ast = parse(source);

  walk(ast, {
    enter(node) {
      if (node.type !== SyntaxKind.Tag) return;

      node.attributes.forEach(({ name, value }) => {
        if (!value) return;

        switch (name.value) {
          case "class":
          case "id":
            {
              const startOffset =
                contentOffset + value.start + (value.quote?.length ?? 0);

              const rgx = /\S+/g;

              let matchResult = rgx.exec(value.value);

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

                matchResult = rgx.exec(value.value);
              }
            }
            break;

          case ":class":
          case ":id":
          case "v-bind:class":
          case "v-bind:id":
            {
              const startOffset =
                contentOffset + value.start + (value.quote?.length ?? 0);

              transformJsValue(
                value.value,
                startOffset,
                sfcTransform,
                value.quote,
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
              let attrName = name.value.replace(
                new RegExp(`(?<=^:?)${preservePrefix}`),
                ""
              );

              sfcTransform.update(
                contentOffset + name.start,
                contentOffset + name.end,
                attrName
              );
            }
            break;
        }
      });
    },
  });
};
