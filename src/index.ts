import { Plugin, CSSModulesOptions } from "vite";

import {
  devNameGeneratorContext,
  prodNameGeneratorContext,
} from "./nameGenerators.js";

import { MagicString, parse as sfcParse } from "@vue/compiler-sfc";
import { transformPug } from "./transformPug2.js";
import { transformHtml } from "./transformHtml2.js";
import { transformScript } from "./transformScript.js";

// import type { Options as TPugOptions } from "pug";

interface TPluginOptions {
  /**
   * String to use as a prefix for skipping transformation of names. The prefix is removed in the resulting code.
   */
  preservePrefix: string;
  /**
   * You can use `$cssModule.className` macro, which will be statically replaced in your script with the resulting CSS module name if this flag is `true` (default).
   */
  scriptTransform: boolean;
  /**
   * Function returning a unique name for a unique input. It must maintain its internal state to return the same result for subsequent calls with identical input
   */
  nameGenerator: Exclude<CSSModulesOptions["generateScopedName"], string>;
}

type TLocalNameGenerator = (name: string) => string;

export interface TLocalTransformOptions {
  preservePrefix: string;
  localNameGenerator: TLocalNameGenerator;
  module?: string | false;
}

//@todo or switch to command === "build" ?
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
/**
 * @param options Object with optional properties
 *
 * @returns Vite plugin object
 */
function plugin({
  preservePrefix = "--",
  scriptTransform = true,
  nameGenerator = IS_DEVELOPMENT
    ? devNameGeneratorContext()
    : prodNameGeneratorContext(),
}: Partial<TPluginOptions> = {}): Plugin {
  return {
    name: "Vue CSS Modules",

    // execute hooks before vue() plugin
    enforce: "pre",

    // patch config with css module options
    // this is called only once (or when config file changes)
    config() {
      return {
        css: {
          modules: {
            generateScopedName: nameGenerator,
          },
        },
      };
    },

    transform(code, id) {
      if (id.match(/\.vue$/)) {
        // @note normalize line endings to avoid offset issues working with pug lexer...
        code = code.replace(/\r\n/g, "\n");

        const {
          descriptor: { template, script, scriptSetup, styles },
        } = sfcParse(code);

        const styleModule = styles.find(s => s.module);
        const styleModuleName =
          typeof styleModule?.module === "string"
            ? styleModule.module
            : "$style";

        // @note skip if there's no style modules and template is not marked for processing
        if (!styleModule && !template.attrs["css-modules"]) {
          return;
        }

        const localNameGenerator = (name: string) =>
          nameGenerator(name, id, styleModule?.content ?? "");

        const sfcTransform = new MagicString(code);

        if (template) {
          // @note undefined means html as well
          template.lang ??= "html";

          switch (template.lang) {
            case "pug":
              {
                transformPug(
                  template.content,
                  template.loc.start.offset,
                  sfcTransform,
                  {
                    preservePrefix,
                    localNameGenerator,
                    module: scriptTransform ? false : styleModuleName,
                  }
                );
              }
              break;

            case "html":
              {
                transformHtml(
                  template.content,
                  template.loc.start.offset,
                  sfcTransform,
                  {
                    preservePrefix,
                    localNameGenerator,
                    module: scriptTransform ? false : styleModuleName,
                  }
                );
              }
              break;

            default:
              console.warn(
                `[CSS Modules] Unsupported template language "${template.lang}"! Skipped`
              );

              return;
          }
        }

        if (scriptTransform) {
          if (scriptSetup) {
            transformScript(
              scriptSetup.content,
              scriptSetup.loc.start.offset,
              sfcTransform,
              localNameGenerator
            );
          }

          if (script) {
            transformScript(
              script.content,
              script.loc.start.offset,
              sfcTransform,
              localNameGenerator
            );
          }
        }

        return {
          code: sfcTransform.toString(),
          map: sfcTransform.generateMap({
            hires: "boundary",
            includeContent: true,
          }),
        };
      }
    },
  } satisfies Plugin;
}

export {
  plugin as default, //
  plugin as cssm,
  type TPluginOptions,
};

export {
  prodNameGeneratorContext, //
  devNameGeneratorContext,
};

export {
  removeCssModulesChunk, //
  type TRemoveCssModulesChunkOptions,
} from "./removeCssModulesChunk.js";
