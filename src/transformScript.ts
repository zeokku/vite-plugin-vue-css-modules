import type { TLocalTransformOptions } from "./types";

export const transformScript = (
  code: string,
  localNameGenerator: TLocalTransformOptions["localNameGenerator"]
) => {
  return code.replace(
    /\$style(?:\[['"`]([\w\-]+)['"`]\]|\.(\w+))/g,
    (_, classNameComputed: string, classNameProp: string) => {
      // wrap in quotes
      return JSON.stringify(localNameGenerator(classNameComputed ?? classNameProp));
    }
  );
};
