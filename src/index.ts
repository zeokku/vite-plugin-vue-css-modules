import { Plugin, CSSModulesOptions } from "vite";

import { devNameGeneratorContext, prodNameGeneratorContext } from "./nameGenerators.js";

import { parse as sfcParse } from "@vue/compiler-sfc";
import { transformPug } from "./transformPug.js";
import { transformHtml } from "./transformHtml.js";
import { transformScript } from "./transformScript.js";

// import type { Options as TPugOptions } from "pug";

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

type TLocalNameGenerator = (name: string) => string;

export interface TLocalTransformOptions {
  preservePrefix: string;
  localNameGenerator: TLocalNameGenerator;
  module?: string | false;
}

//@todo or switch to command === "build" ?
const dev = process.env.NODE_ENV !== "production";
/**
 *
 * @param options object with optional properties:
 *
 * **`preservePrefix`** - string to use as a prefix for keeping the names raw, the prefix is removed in the resulting code
 *
 * **`scriptTransform`** - you can use `$useCssModule('className')` macro, which will be statically replaced in your script (if this flag is `true`) with the resulting CSS module name. It's recommended to enable this only for production to save processing time during the development
 *
 * **`nameGenerator`** - function returning a unique name for a unique input. It must maintain its internal state to return the same result for subsequent calls with identical input
 *
 * @returns Vite plugin object
 */
function plugin({
  preservePrefix = "--",
  scopeBehaviour = "local",
  scriptTransform = false,
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
          descriptor: { template, script, scriptSetup, styles },
        } = sfcParse(code);

        // console.log(
        //   template.content.length,
        //   template.loc.end.offset - template.loc.start.offset,
        //   JSON.stringify(
        //     sfcParse(code),
        //     (key, value) => {
        //       if (["source", "content", "mappings", "ast", "sourcesContent"].includes(key))
        //         return "<<omitted>>";

        //       return value;
        //     },
        //     4
        //   )
        // );

        //skip sfc if there's no module styles
        // @todo let styleModuleName: string | boolean = s.module;
        let styleModule = styles.find(s => s.module);

        if (!styleModule) {
          return;
        }

        let localNameGenerator = (name: string) => nameGenerator(name, id, styleModule.content);

        let transformedSfc = code;

        let templateOffsetChange = 0;

        if (template) {
          // undefined means html as well
          template.lang ??= "html";

          let transformedTemplate: string;

          switch (template.lang) {
            case "pug":
              {
                transformedTemplate = transformPug(
                  template.content,
                  {
                    preservePrefix,
                    localNameGenerator,
                    module: scriptTransform ? false : "$style",
                  },
                  pugLocals
                );
              }
              break;
            case "html":
              {
                transformedTemplate = transformHtml(template.content, {
                  preservePrefix,
                  localNameGenerator,
                  module: scriptTransform ? false : "$style",
                });
              }
              break;
            default:
              console.warn(
                `[CSS Modules] Unsupported template language "${template.lang}"! Skipped`
              );

              return;
          }

          //#region correct template lines count to fix source maps (fix #2)

          let templateLines = 1 + template.loc.end.line - template.loc.start.line;
          let transformedTemplateLines = 1 + (transformedTemplate.match(/\r?\n/g)?.length ?? 0);

          // @todo @bug in node.js this doesn't work and count all \r and \n separately for some reason?
          // .match(/^/gm).length; so instead match \r\n

          let templateLinesDifference = templateLines - transformedTemplateLines;

          if (templateLinesDifference > 0)
            transformedTemplate += "\n".repeat(templateLinesDifference);
          else console.warn(`[CSS Modules] Resulting <template> is longer than source!`);

          //#endregion

          templateOffsetChange = transformedTemplate.length - template.content.length;

          // @note use slice as it's faster than replace
          transformedSfc =
            transformedSfc
              .slice(0, template.loc.start.offset) //
              .replace(`lang="${template.lang}"`, (sub: string) => {
                templateOffsetChange -= sub.length;
                return "";
              }) +
            transformedTemplate +
            transformedSfc.slice(template.loc.end.offset);
        }

        if (scriptTransform) {
          let scriptSetupOffsetChange = 0;

          if (scriptSetup) {
            let transformedScriptSetup = transformScript(scriptSetup.content, localNameGenerator);

            scriptSetupOffsetChange = transformedScriptSetup.length - scriptSetup.content.length;

            let offset = template
              ? scriptSetup.loc.start.offset < template.loc.start.offset
                ? // if script setup before template
                  0
                : //after template
                  templateOffsetChange
              : 0;

            transformedSfc =
              transformedSfc.slice(0, scriptSetup.loc.start.offset + offset) +
              transformedScriptSetup +
              transformedSfc.slice(scriptSetup.loc.end.offset + offset);
          }

          if (script) {
            let transformedScript = transformScript(script.content, localNameGenerator);

            let offset = 0;

            // add offset caused by template transform
            offset += template
              ? script.loc.start.offset < template.loc.start.offset
                ? 0
                : templateOffsetChange
              : 0;

            // add offset caused by script setup transform
            if (scriptSetup) {
              offset +=
                script.loc.start.offset < scriptSetup.loc.start.offset
                  ? 0
                  : scriptSetupOffsetChange;
            }

            transformedSfc =
              transformedSfc.slice(0, script.loc.start.offset + offset) +
              transformedScript +
              transformedSfc.slice(script.loc.end.offset + offset);
          }
        }

        return transformedSfc;
      }
    },
  };
  // @todo satisfies Plugin;
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
