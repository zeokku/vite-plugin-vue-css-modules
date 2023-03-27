import { assert, describe, expect, test } from "vitest";
import { ng, o, qng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformHtml } from "../src/transformHtml";

(["$style", false] as const).forEach(module =>
  describe("html", () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    test("static class attribute", () => {
      let h = `<div class="class0 class1"></div>`;
      let r = transformHtml(h, opt);
      assert.equal(r, `<div class="${ng("class0")} ${ng("class1")}"></div>`);
    });

    test("static and variable class attributes", () => {
      let h = `<div class="class0 class1" :class="varClass"></div>`;
      let r = transformHtml(h, opt);
      // prettier-ignore
      assert.equal(r,
        `<div class="${ng("class0")} ${ng("class1")}" :class="${module ? `${module}[varClass]` : 'varClass'}"></div>`      
      );
    });

    test("variable id", () => {
      //prettier-ignore
      let h = `<div :id="varId"></div>`
      let r = transformHtml(h, opt);

      //prettier-ignore
      assert.equal(r, `<div :id="${module ? `${module}[varId]` : 'varId'}"></div>`)
    });

    test("mixed class and id attributes", () => {
      // prettier-ignore
      let h = `<div id="id0" class="class0" :class="varClass0"></div>`
      let r = transformHtml(h, opt);

      // prettier-ignore
      assert.equal(r, `<div id="${ng('id0')}" class="${ng('class0')}" :class="${module ? `${module}[varClass0]` : 'varClass0'}"></div>`);
    });

    test("nested elements", () => {
      // prettier-ignore
      let h = 
`<div class="a">
    <div class="b" :class="varClass"></div>
</div>`;

      let r = transformHtml(h, opt);

      // prettier-ignore
      assert.equal(r, 
`<div class="${ng("a")}">` +
    `<div class="${ng("b")}" :class="${module ? `${module}[varClass]` : 'varClass'}"></div>` +
`</div>`
    );
    });

    // --class escapes entire attribute
    test("escape static attributes", () => {
      let h = '<div --class="class0 class1"></div>';
      let r = transformHtml(h, opt);

      assert.equal(r, `<div class="class0 class1"></div>`);

      h = '<div --id="el"></div>';
      r = transformHtml(h, opt);

      assert.equal(r, '<div id="el"></div>');
    });

    test("escape dynamic attributes", () => {
      let h = '<div :--class="[class0, class1]"></div>';
      let r = transformHtml(h, opt);

      assert.equal(r, `<div :class="[class0, class1]"></div>`);

      h = '<div :--id="el"></div>';
      r = transformHtml(h, opt);

      assert.equal(r, '<div :id="el"></div>');
    });
  })
);
