import { assert, describe, expect, test } from "vitest";
import { ng, o, qng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformPug } from "../src/transformPug";

(["$style", false] as const).forEach(module =>
  describe("pug", () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    test("static class attribute", () => {
      let h = `.class0.class1`;
      let r = transformPug(h, opt);
      assert.equal(r, `<div class="${ng("class0")} ${ng("class1")}"></div>`);
    });

    test("static and variable class attributes", () => {
      let h = `.class0.class1(:class="varClass")`;
      let r = transformPug(h, opt);
      // prettier-ignore
      assert.equal(r,
        `<div class="${ng("class0")} ${ng("class1")}" :class="${module ? `${module}[varClass]` : 'varClass'}"></div>`      
      );
    });

    test("variable id", () => {
      //prettier-ignore
      let h = `div(:id="varId")`
      let r = transformPug(h, opt);

      //prettier-ignore
      assert.equal(r, `<div :id="${module ? `${module}[varId]` : 'varId'}"></div>`)
    });

    test("mixed class and id attributes", () => {
      // prettier-ignore
      let h = `.class0#id0(:class="varClass0")`
      let r = transformPug(h, opt);

      // prettier-ignore
      assert.equal(r, `<div class="${ng('class0')}" id="${ng('id0')}" :class="${module ? `${module}[varClass0]` : 'varClass0'}"></div>`);
    });

    test("nested elements", () => {
      // prettier-ignore
      let h = 
`.a
  .b(:class="varClass")
`;

      let r = transformPug(h, opt);

      // prettier-ignore
      assert.equal(r, 
`<div class="${ng("a")}">` +
    `<div class="${ng("b")}" :class="${module ? `${module}[varClass]` : 'varClass'}"></div>` +
`</div>`
    );
    });

    // --class escapes entire attribute
    test("escape static attributes", () => {
      let h = 'div(--class="class0 class1")';
      let r = transformPug(h, opt);

      assert.equal(r, `<div class="class0 class1"></div>`);

      h = 'div(--id="el")';
      r = transformPug(h, opt);

      assert.equal(r, '<div id="el"></div>');
    });

    test("escape inline attributes", () => {
      let h = ".--class0.--class1";
      let r = transformPug(h, opt);

      assert.equal(r, `<div class="class0 class1"></div>`);

      h = "#--id0";
      r = transformPug(h, opt);

      assert.equal(r, `<div id="id0"></div>`);
    });

    test("escape inline mixed class", () => {
      let h = ".--escape.class0";
      let r = transformPug(h, opt);

      assert.equal(r, `<div class="escape ${ng("class0")}"></div>`);
    });

    test("escape dynamic attributes", () => {
      let h = 'div(:--class="[class0, class1]")';
      let r = transformPug(h, opt);

      assert.equal(r, `<div :class="[class0, class1]"></div>`);

      h = 'div(:--id="el")';
      r = transformPug(h, opt);

      assert.equal(r, '<div :id="el"></div>');
    });
  })
);
