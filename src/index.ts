import { Plugin, CSSModulesOptions } from "vite";

import { devNameGeneratorContext, prodNameGeneratorContext } from "./nameGenerators.js";

import { parse as sfcParse } from "@vue/compiler-sfc";
import { transformPug } from "./transformPug.js";
import { transformHtml } from "./transformHtml.js";

// import type { Options as TPugOptions } from "pug";

//@todo parse5 to parse html?
//https://lihautan.com/manipulating-ast-with-javascript/

interface TPluginOptions {
  preservePrefix: string;
  scopeBehaviour: CSSModulesOptions["scopeBehaviour"];
  scriptTransform: boolean;

  pugLocals: Record<string, any>;

  // pug: {
  //   locals?: Record<string, string>;
  //   options: PugOptions;
  // };
  nameGenerator: Exclude<CSSModulesOptions["generateScopedName"], string>;
}

//@todo or switch to command === "build" ?
const dev = process.env.NODE_ENV !== "production";
/**
 *
 * @param options object with optional properties:
 *
 * **`preservePrefix`** - string to use a prefix for keeping the names raw, the prefix is removed in the resulting code
 *
 * **`scriptTransform`** - you can use `$useCssModule('className')` macro, which will be statically replaced in your script with the resulting CSS module name
 *
 * @returns Vite plugin object
 */
function plugin({
  preservePrefix = "--",
  scopeBehaviour = "local",
  scriptTransform = true,
  pugLocals = {},
  nameGenerator = dev ? devNameGeneratorContext() : prodNameGeneratorContext(),
}: Partial<TPluginOptions> = {}): Plugin {
  pugLocals.dev = dev;

  return {
    name: "Vue Static CSS Modules",

    // patch config with css module options
    // this is called only once (or when config file changes)
    config() {
      return {
        css: {
          modules: {
            scopeBehaviour,
            generateScopedName: nameGenerator,
          },
        },
      };
    },

    transform(code, id) {
      if (id.match(/\.vue$/)) {
        let {
          descriptor: { template, script, styles },
        } = sfcParse(code);

        //skip sfc if there's no module styles
        // @todo let styleModule: string | boolean = s.module;
        if (!styles.find(s => s.module)) {
          return;
        }

        let localNameGenerator = (name: string) => nameGenerator(name, id, "");

        // undefined means html as well
        template.lang ??= "html";

        let transformedTemplate;

        if (template.lang === "pug") {
          transformedTemplate = transformPug(template.content, pugLocals, {
            preservePrefix,
            localNameGenerator,
            module: scriptTransform ? false : "$style",
          });
        } else if (template.lang === "html") {
          transformedTemplate = transformHtml(template.content, {
            preservePrefix,
            localNameGenerator,
            module: scriptTransform ? false : "$style",
          });
        } else {
          console.error(`Unsupported template language "${template.lang}"! Skipped`);
          return;
        }

        return code //
          .replace('lang="pug"', "") // pug transform returns html
          .replace(template.content, transformedTemplate);
      }
    },
  };
  // @todo satisfies Plugin;
}

export {
  plugin as default, //
  plugin,
  TPluginOptions,
};

export {
  prodNameGeneratorContext, //
  devNameGeneratorContext,
};

export {
  removeCssModulesChunk, //
  TRemoveCssModulesChunkOptions,
} from "./removeCssModulesChunk.js";
