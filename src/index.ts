import fs from "node:fs/promises";

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

interface ICssModulesPluginOptions {
  /**
   * String to use as a prefix for skipping transformation of names. The prefix is removed in the resulting code.
   *
   * @default "--"
   */
  preservePrefix: string;
  /**
   * You can use `$cssModule.className` macro, which will be statically replaced in your script with the resulting CSS module name if this flag is `true`.
   *
   * @default true
   */
  scriptTransform: boolean;
  /**
   * Function returning a unique name for a unique input. It must maintain its internal state to return the same result for subsequent calls with identical input.
   *
   * @default process.env.NODE_ENV === "production" ? prodNameGeneratorContext() : devNameGeneratorContext()
   */
  nameGenerator: Exclude<CSSModulesOptions["generateScopedName"], string>;
}

type TLocalNameGenerator = (name: string) => string;

export interface ILocalTransformOptions {
  preservePrefix: string;
  localNameGenerator: TLocalNameGenerator;
  module?: string | false;
}

/**
 * @param options Object with optional properties
 *
 * @returns Vite plugin object
 */
function plugin({
  preservePrefix = "--",
  scriptTransform = true,
  nameGenerator = process.env.NODE_ENV === "production"
    ? prodNameGeneratorContext()
    : devNameGeneratorContext(),
}: Partial<ICssModulesPluginOptions> = {}): Plugin {
  return {
    name: "vue-css-modules",

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

    async transform(code, id) {
      const [filename, queryString] = id.split("?");

      if (!filename.match(/\.vue$/)) return;

      // {vue: '', type: 'template', lang.js: ''}
      const query = new URLSearchParams(queryString);

      // .vue?vue&type=template&lang.js
      const isTemplateModule = query.get("type") === "template";
      // @note on full SFC update query is empty
      const isFullSfcUpdate = queryString === undefined;

      // @note exit early on other virtual modules (like styles which are processed in a separate plugin)
      if (!isTemplateModule && !isFullSfcUpdate) return;

      const {
        descriptor: { template, script, scriptSetup, styles },
      } = sfcParse(
        isTemplateModule
          ? // @note Re-read from disk, so it's fresh on HMR. We need full SFC descriptor to decide whether we need to transform template
            await fs.readFile(filename, "utf8")
          : code
      );

      const styleModule = styles.find(s => s.module);
      const styleModuleName =
        typeof styleModule?.module === "string" ? styleModule.module : "$style";

      // @note skip if there's no style modules and template is not marked for processing
      if (!styleModule && !template?.attrs["css-modules"]) {
        return;
      }

      const localNameGenerator = (name: string) =>
        nameGenerator!(name, filename, styleModule?.content ?? "");

      const codeTransform = new MagicString(code);

      // @note update template only when its corresponding virtual module is being loaded
      // @note this way we avoid double parsing and transform of template on full SFC load (initial vite startup and when script is changed)
      if (isTemplateModule) {
        // @note undefined means html as well
        template!.lang ??= "html";

        const templateContent = code;
        const templateStart = 0;

        switch (template!.lang) {
          case "pug":
            {
              transformPug(templateContent, templateStart, codeTransform, {
                preservePrefix,
                localNameGenerator,
                module: scriptTransform ? false : styleModuleName,
              });
            }
            break;

          case "html":
            {
              transformHtml(templateContent, templateStart, codeTransform, {
                preservePrefix,
                localNameGenerator,
                module: scriptTransform ? false : styleModuleName,
              });
            }
            break;

          default:
            console.warn(
              `[CSS Modules] Unsupported template language "${
                template!.lang
              }"! Skipped`
            );

            return;
        }

        return {
          code: codeTransform.toString(),
          map: codeTransform.generateMap({
            hires: "boundary",
            includeContent: true,
          }),
        };
      }

      if (isFullSfcUpdate && scriptTransform) {
        if (scriptSetup) {
          transformScript(
            scriptSetup.content,
            scriptSetup.loc.start.offset,
            codeTransform,
            localNameGenerator
          );
        }

        if (script) {
          transformScript(
            script.content,
            script.loc.start.offset,
            codeTransform,
            localNameGenerator
          );
        }

        return {
          code: codeTransform.toString(),
          map: codeTransform.generateMap({
            hires: "boundary",
            includeContent: true,
          }),
        };
      }
    },
  };
}

export {
  plugin as default, //
  plugin as cssModules,
  type ICssModulesPluginOptions,
};

export {
  prodNameGeneratorContext, //
  devNameGeneratorContext,
};

export {
  removeCssModuleExports,
  type IRemoveCssModuleExportsOptions,
} from "./removeCssModuleExports.js";
