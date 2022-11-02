import { Plugin } from "vite";

export interface TRemoveCssModulesChunkOptions {
  ignore: RegExp[];
}

export function removeCssModulesChunk({
  ignore = [],
}: Partial<TRemoveCssModulesChunkOptions> = {}): Plugin {
  return {
    name: "Remove CSS Modules Chunk",
    transform(code, id) {
      if (/\.vue/g.test(id)) {
        for (let p of ignore) {
          if (p.test(id)) return null;
        }

        return code.replace(/\["__cssModules", .+?\],?/g, "");
      }
    },
  };
}
