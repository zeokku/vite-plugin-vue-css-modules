import { Plugin, CSSModulesOptions } from "vite";
interface PluginOptions {
    preservePrefix: string;
    scopeBehaviour: CSSModulesOptions["scopeBehaviour"];
    pugLocals: {
        [name: string]: string;
    };
    pugOptions: any;
}
declare function plugin({ preservePrefix, scopeBehaviour, pugLocals: optionsLocals, pugOptions, }?: Partial<PluginOptions>): Plugin;
export { plugin, PluginOptions };
export { prodNameGeneratorContext, devNameGeneratorContext, } from "./nameGenerators.js";
