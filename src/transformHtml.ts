import { Parser } from "htmlparser2";
import { DomHandler } from "domhandler";

import type { TLocalTransformOptions } from "./";

import { transformJsValue } from "./transformJsValue.js";

import render from "dom-serializer";

export const transformHtml = (
  source: string,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  const handler = new DomHandler(null, null, ({ attribs }) => {
    for (let [key, value] of Object.entries(attribs)) {
      switch (key) {
        // static
        case "class":
        case "id":
          {
            // class is a single string "class1 class2"
            // split by whitespace and filter empty
            attribs[key] = value
              .split(/\s+/g)
              .filter(e => e)
              .map(e => {
                if (e.startsWith(preservePrefix)) {
                  return e.slice(preservePrefix.length);
                } else {
                  return localNameGenerator(e);
                }
              })
              .join(" ");
          }
          break;

        // escaped dynamic
        case `:${preservePrefix}class`:
        case `:${preservePrefix}id`:
          {
            attribs[":" + key.slice(1 + preservePrefix.length)] = attribs[key];
            delete attribs[key];
          }
          break;
        // dynamic
        case ":class":
        case ":id":
        case "v-bind:class":
        case "v-bind:id":
          {
            value = transformJsValue(value, { preservePrefix, localNameGenerator, module });

            attribs[key] = value.replace(/`|"/g, "'");
          }
          break;
      }
    }
  });
  const parser = new Parser(handler);

  parser.parseComplete(source);

  return render(handler.dom, {
    encodeEntities: false,
  });
};
