import type { TLocalTransformOptions } from "./types";

import { transformJsValue } from "./transformJsValue.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// parse5 supports require

export const transformHtml = (
  source: string,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  //
};
