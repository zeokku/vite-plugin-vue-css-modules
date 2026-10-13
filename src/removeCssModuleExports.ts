import { MagicString } from "@vue/compiler-sfc";
import { Plugin } from "vite";

export interface IRemoveCssModuleExportsOptions {
  ignore: RegExp[];
}

export function removeCssModuleExports({
  ignore = [],
}: Partial<IRemoveCssModuleExportsOptions> = {}): Plugin {
  return {
    name: "vue-css-modules:remove-exports",

    enforce: "post",

    transform(code, id) {
      const [filename, queryString] = id.split("?");

      if (!filename.match(/\.vue$/)) return;

      for (let rgx of ignore) {
        if (rgx.test(id)) return;
      }

      const query = new URLSearchParams(queryString);

      const isStyleModule =
        query.get("type") === "style" &&
        // e.g. `lang.module.scss`
        query.keys().some(v => v.startsWith("lang.module"));

      if (!isStyleModule) return;

      const codeTransform = new MagicString(code);

      const rgx = /export default {[^]+?}/g;

      codeTransform.replace(rgx, "export default {}");

      return {
        code: codeTransform.toString(),
        map: codeTransform.generateMap({
          hires: "boundary",
          includeContent: true,
        }),
      };

      // @note In new vue plugin versions if we omit __cssModules context, entire stylesheet will be skipped
      // return code.replace(/\[["']__cssModules["'],.+?\],?/g, "");
    },
  };
}
