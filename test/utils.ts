import type { TLocalTransformOptions } from "../src";

/**
 * wrap in quotes (string literal)
 * @param s string value
 * @param c quote char (default: `"`)
 * @returns
 */
export const q = (s: string, c = '"') => c + s + c;

/**
 * mock name generator
 * @param n name
 * @returns
 */
export const ng = n => "TEST__" + n;

/**
 * name generator that returns name in quotes
 * @param n name
 * @param c quote char (default: `"`)
 * @returns
 */
export const qng = (n: string, c = '"') => q(ng(n), c);

/**
 * generate options object
 * @param preservePrefix
 * @returns
 */
export const o = (preservePrefix = "--"): TLocalTransformOptions => ({
  preservePrefix,
  localNameGenerator: ng,
});

/**
 * Remove whitespace from template string to align with minified result code
 * @param strings
 * @param values
 */
export const nows = (strings: TemplateStringsArray, ...values: string[]) => {
  const fullString = strings.reduce(
    (res, str, i) => res + str + (values[i] ?? ""),
    ""
  );

  return fullString.replace(/\s+/g, "");
};

/**
 * Generate CSS module access if using module, otherwise return value itself
 */
export const md = (value: string, module: string | false) =>
  module ? `${module}[${value}]` : value;
