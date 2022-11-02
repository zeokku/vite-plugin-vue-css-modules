import { Plugin, UserConfig, CSSModulesOptions } from "vite";

import generateCode from "pug-code-gen";
import wrap from "pug-runtime/wrap.js";

import { transform } from "./transform2.js";
import { devNameGeneratorContext, prodNameGeneratorContext } from "./nameGenerators.js";

//@todo parse5 to parse html?
//https://lihautan.com/manipulating-ast-with-javascript/

interface PluginOptions {
  preservePrefix: string;
  scopeBehaviour: CSSModulesOptions["scopeBehaviour"];
  pugLocals: {
    [name: string]: string;
  };
  pugOptions: any;
  nameGenerator: Exclude<CSSModulesOptions["generateScopedName"], string>;
}

//@todo or switch to command === "build" ?
const dev = process.env.NODE_ENV !== "production";

function plugin({
  preservePrefix = "--",
  scopeBehaviour = "local",
  pugLocals = {},
  pugOptions = {},
  nameGenerator = dev ? devNameGeneratorContext() : prodNameGeneratorContext(),
}: Partial<PluginOptions> = {}) {
  Object.assign(pugLocals, { dev });

  Object.assign(pugOptions, { doctype: "html", compileDebug: dev });

  return {
    name: "Vue Pug with Implicit CSS Modules",

    // patch config with css module options
    // this is called only once (or when config file changes)
    config(config: UserConfig, { command }) {
      if (!config.css) {
        config.css = {};
      }

      if (!config.css.modules) {
        config.css.modules = {};
      }

      let options = config.css.modules;

      if (!options.scopeBehaviour) {
        options.scopeBehaviour = scopeBehaviour;
      }

      if (!options.generateScopedName) {
        options.generateScopedName = nameGenerator;
      }
    },

    transform(code, id) {
      if (id.match(/\.vue$/)) {
        //skip sfc if there's no module styles
        if (!code.match(/<style[^>]+module/)) {
          return null;
        }

        return code.replace(/<template.*>[\r\n]+([^]+)<\/template>/, (_, templateCode) => {
          let ast = transform(templateCode, {
            preservePrefix,
            nameGenerator: (name: string) => nameGenerator(name, id, ""),
          });

          //generate template function string
          let funcStr = generateCode(ast, pugOptions);

          //generate template function
          let template = wrap(funcStr);

          //template({locals}), locals are vars referenced by using #{var} in pug src | { var: 'bob' }
          let htmlTemplateCode = template(pugLocals);

          return [`<template>`, htmlTemplateCode, `</template>`].join("\n");
        });
      }

      return null;
    },
  };
  // @todo satisfies Plugin;
}

export {
  plugin as default, //
  plugin,
  PluginOptions,
};

export {
  prodNameGeneratorContext, //
  devNameGeneratorContext,
};

export {
  removeCssModulesChunk, //
  TRemoveCssModulesChunkOptions,
} from "./removeCssModulesChunk.js";
