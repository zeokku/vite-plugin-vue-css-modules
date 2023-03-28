import type { TLocalTransformOptions } from "./";

// @vue/compiler-sfc
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = (str: string) => str.replace(hyphenateRE, "-$1").toLowerCase();

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
