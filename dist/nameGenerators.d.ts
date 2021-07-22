declare const prodNameGeneratorContext: () => (name: string, filename: string, css: string) => string;
declare const devNameGeneratorContext: () => (name: string, filename: string, css: string) => string;
export { prodNameGeneratorContext, devNameGeneratorContext };
