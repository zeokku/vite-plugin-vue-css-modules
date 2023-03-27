import type { TLocalTransformOptions } from "../src";

/**
 * wrap in quotes (string literal)
 * @param s string value
 * @param c quote char
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
 * @param c quote char
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
