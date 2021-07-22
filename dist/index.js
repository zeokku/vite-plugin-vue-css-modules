import generateCode from "pug-code-gen";
import wrap from "pug-runtime/wrap.js";
import transform from "./transform.js";
import { devNameGeneratorContext, prodNameGeneratorContext, } from "./nameGenerators.js";
const debug = process.env.NODE_ENV !== "production";
function plugin({ preservePrefix = "--", scopeBehaviour = "local", pugLocals: optionsLocals = {}, pugOptions = {}, } = {}) {
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
        config(config, { command }) {
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
                    command === "build"
                        ? prodNameGeneratorContext()
                        : devNameGeneratorContext();
            }
        },
        transform(code, id) {
            if (id.match(/\.vue$/)) {
                if (!code.match(/<style[^>]+module/)) {
                    return null;
                }
                let templateCodeRegex = /(?<=<template\s+lang="pug">[\r\n]+)[^]*?(?=[\r\n]+<\/template>)/gim;
                let templateCode = templateCodeRegex.exec(code)[0];
                let ast = transform(templateCode, { preservePrefix });
                let funcStr = generateCode(ast, pugOptions);
                let template = wrap(funcStr);
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
export { plugin };
export { prodNameGeneratorContext, devNameGeneratorContext, } from "./nameGenerators.js";
