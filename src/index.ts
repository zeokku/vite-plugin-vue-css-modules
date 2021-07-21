import { Plugin, UserConfig, CSSModulesOptions } from "vite";

import generateCode from "pug-code-gen";
import wrap from "pug-runtime/wrap.js";

import transform from "./transform.js";
import {
  devNameGenerator,
  nameGeneratorContext,
} from "./nameGeneratorContext.js";

//@todo parse5 to parse html
//https://lihautan.com/manipulating-ast-with-javascript/

interface PluginOptions {
  preservePrefix: string;
  scopeBehaviour: CSSModulesOptions["scopeBehaviour"];
  pugLocals: {
    [name: string]: string;
  };
  pugOptions: any;
}

const debug = process.env.NODE_ENV !== "production";

function plugin({
  preservePrefix = "--",
  scopeBehaviour = "local",
  pugLocals: optionsLocals = {},
  pugOptions = {},
}: Partial<PluginOptions> = {}): Plugin {
  let locals = {
    debug,
    ...optionsLocals,
  };

  pugOptions = {
    ...pugOptions,
    doctype: "html",
    compileDebug: debug,
  };

  return {
    name: "vue-pug-implicit-css-modules",

    //patch config with css module options
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
        options.generateScopedName =
          command === "build" ? nameGeneratorContext() : devNameGenerator;
        //command === "build" ? nameGeneratorContext() : "[name]__[local]";
      }
    },

    transform(code, id) {
      if (id.match(/\.vue$/)) {
        //skip sfc if there's no module styles
        if (!code.match(/<style[^>]+module/)) {
          return null;
        }

        let templateCodeRegex =
          /(?<=<template\s+lang="pug">[\r\n]+)[^]*?(?=[\r\n]+<\/template>)/gim;

        let templateCode = templateCodeRegex.exec(code)[0];

        let ast = transform(templateCode, { preservePrefix });

        //generate template function string
        let funcStr = generateCode(ast, pugOptions);

        //generate template function
        let template = wrap(funcStr);

        //template({locals}), locals are vars referenced by using #{var} in pug src | { var: 'bob' }
        let htmlTemplateCode = template(locals);

        let output = code
          .replace(templateCodeRegex, htmlTemplateCode)
          .replace('lang="pug"', "");

        return output;
      }

      return null;
    },
  };
}

export { plugin, PluginOptions };
export { nameGeneratorContext } from "./nameGeneratorContext.js";
