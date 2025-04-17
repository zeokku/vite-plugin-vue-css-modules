import type { TLocalTransformOptions } from "../src";

/**
 * Wrap in quotes (string literal)
 * @param s string value
 * @param qc quote char
 * @returns
 */
const q = (s: string, qc: string) => qc + s + qc;

export const sq = (s: string) => q(s, "'");
export const dq = (s: string) => q(s, '"');
export const bq = (s: string) => q(s, "`");

/**
 * Mock name generator
 * @param n name
 * @returns
 */
export const ng = n => "TEST__" + n;

/**
 * Name generator that returns name in quotes
 * @param n name
 * @param qc quote char
 * @returns
 */
const qng = (n: string, qc: string) => q(ng(n), qc);

/**
 * Single quote {@linkcode qng | qng()}
 */
export const sqng = (n: string) => qng(n, "'");
/**
 * Double quote {@linkcode qng | qng()}
 */
export const dqng = (n: string) => qng(n, '"');
/**
 * Backtick quote {@linkcode qng | qng()}
 */
export const bqng = (n: string) => qng(n, "`");

/**
 * Generate options object
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
