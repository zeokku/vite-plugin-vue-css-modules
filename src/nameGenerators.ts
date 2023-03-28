import incstr from "incstr";
import path from "path";

import type { TPluginOptions } from ".";

// filename
// C:/.../src/views/About.vue?vue&type=style&index=0&lang.module.less

// https://bobbyhadz.com/blog/javascript-remove-file-extension-from-string
const removeExtension = (filename: string) => {
  return filename.substring(0, filename.lastIndexOf(".")) || filename;
};

const deriveScope = (filename: string) =>
  path
    .relative("./src/", removeExtension(filename.split("?")[0]))
    // @note prefix instead of long paths
    .replace(/components[\\/]/, "C")
    .replace(/views[\\/]/, "V")
    .replace(/[\\/]/g, "_");

const prodNameGeneratorContext = (): TPluginOptions["nameGenerator"] => {
  let namesMap: Record<string, string> = {};

  //move dash to the end to optimize name generation
  let generateName = incstr.idGenerator({
    alphabet: "_abcdefghijklmnopqrstuvwxyz0123456789-",
  });

  //the function is called for each CSS rule, so cache the pairs of minified name with og name
  return (name, filename) => {
    let key = name.split("__", 2).length === 2 ? name : deriveScope(filename) + "__" + name;

    if (namesMap[key]) return namesMap[key];

    for (;;) {
      let newName = generateName();

      // @note hyphen prefixes are reserved for vendor classes, also it can't start with a digit
      // in addition exclude ^ad or any _ad, -ad constructions to avoid adblock problem
      if (!/^[-\d]|(?:[-_]+|^)ad/.test(newName)) {
        namesMap[key] = newName;

        return newName;
      }
    }
  };
  // satisfies TPluginOptions['nameGenerator'];
};

const devNameGeneratorContext = (): TPluginOptions["nameGenerator"] => {
  return (name, filename) => {
    let provided = name.split("__", 2);

    if (provided.length === 2) {
      return name;
    } else {
      let scope = deriveScope(filename);

      return scope + "__" + name;
    }
  };
};

export { prodNameGeneratorContext, devNameGeneratorContext };
