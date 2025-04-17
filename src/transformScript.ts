import type { MagicString } from "@vue/compiler-sfc";
import type { TLocalTransformOptions } from "./";

import { hyphenate } from "@vue/shared";

export const transformScript = (
  source: string,
  contentOffset: number,
  sfcTransform: MagicString,
  localNameGenerator: TLocalTransformOptions["localNameGenerator"]
) => {
  const rgx = /\$cssModule(?:\[['"`]([\w\-]+)['"`]\]|\.(\w+))/g;

  let matchResult = rgx.exec(source);

  while (matchResult) {
    const [match, classNameComputed, classNameProp] = matchResult;
    const sfcOffsetStart = contentOffset + matchResult.index;

    // @note convert property notation in camel case to hyphens
    let name = classNameProp ? hyphenate(classNameProp) : classNameComputed;

    // @note wrap in quotes
    name = JSON.stringify(localNameGenerator(name));

    sfcTransform.update(sfcOffsetStart, sfcOffsetStart + match.length, name);

    matchResult = rgx.exec(source);
  }
};
