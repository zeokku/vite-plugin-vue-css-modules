import { Plugin, CSSModulesOptions } from "vite";
import { devNameGeneratorContext, prodNameGeneratorContext } from "./nameGenerators.js";
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
export { prodNameGeneratorContext, devNameGeneratorContext };
