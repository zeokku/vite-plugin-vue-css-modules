import type { TLocalTransformOptions } from "./";

import { hyphenate } from "@vue/shared";

export const transformScript = (
  code: string,
  localNameGenerator: TLocalTransformOptions["localNameGenerator"]
) => {
  return code.replace(
    /\$cssModule(?:\[['"`]([\w\-]+)['"`]\]|\.(\w+))/g,
    (_, classNameComputed: string, classNameProp: string) => {
      // convert property notation in camel case to hyphens
      let name = classNameProp ? hyphenate(classNameProp) : classNameComputed;

      // wrap in quotes
      return JSON.stringify(localNameGenerator(name));
    }
  );
};
