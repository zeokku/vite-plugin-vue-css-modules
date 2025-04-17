import { assert, describe, expect, test } from "vitest";
import { dqng, md, ng, o, sqng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformHtml } from "../src/transformHtml2";
import { MagicString } from "@vue/compiler-sfc";

const transform = (fixture: string, opt: TLocalTransformOptions) => {
  const sfcTransform = new MagicString(fixture);

  transformHtml(fixture, 0, sfcTransform, opt);

  return sfcTransform.toString();
};

(["$style", false] as const).forEach(module =>
  describe(`html (module: ${module})`, () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    test("static class attribute", () => {
      let h = `<div class="class0 class1"></div>`;
      let r = transform(h, opt);
      assert.equal(r, `<div class="${ng("class0")} ${ng("class1")}"></div>`);
    });

    test("static and variable class attributes", () => {
      let h = `<div class="class0 class1" :class="varClass"></div>`;
      let r = transform(h, opt);
      // prettier-ignore
      assert.equal(r,
        `<div class="${ng("class0")} ${ng("class1")}" :class="${md('varClass', module)}"></div>`      
      );
    });

    test("variable id", () => {
      //prettier-ignore
      let h = `<div :id="varId"></div>`
      let r = transform(h, opt);

      //prettier-ignore
      assert.equal(r, `<div :id="${md('varId', module)}"></div>`)
    });

    test("mixed class and id attributes", () => {
      // prettier-ignore
      let h = `<div id="id0" class="class0" :class="varClass0"></div>`
      let r = transform(h, opt);

      // prettier-ignore
      assert.equal(r, `<div id="${ng('id0')}" class="${ng('class0')}" :class="${md('varClass0', module)}"></div>`);
    });

    test("nested elements", () => {
      // prettier-ignore
      let h = 
`<div class="a">
    <div class="b" :class="varClass"></div>
</div>`;

      let r = transform(h, opt);

      // prettier-ignore
      assert.equal(r, 
`<div class="${ng("a")}">
    <div class="${ng("b")}" :class="${md('varClass', module)}"></div>
</div>`
    );
    });

    // --class escapes entire attribute
    test("escape static attributes", () => {
      let h = '<div --class="class0 class1"></div>';
      let r = transform(h, opt);

      assert.equal(r, `<div class="class0 class1"></div>`);

      h = '<div --id="el"></div>';
      r = transform(h, opt);

      assert.equal(r, '<div id="el"></div>');
    });

    test("escape dynamic attributes", () => {
      let h = '<div :--class="[class0, class1]"></div>';
      let r = transform(h, opt);

      assert.equal(r, `<div :class="[class0, class1]"></div>`);

      h = '<div :--id="el"></div>';
      r = transform(h, opt);

      assert.equal(r, '<div :id="el"></div>');
    });

    test("object property quote rotation", () => {
      let h = `<div :class="{ shorthand }"></div>`;
      let r = transform(h, opt);

      assert.equal(
        r,
        `<div :class="{ ${sqng("shorthand")}: shorthand }"></div>`
      );

      // @todo there's a possible error with `:class={shorthand}` technically possible in html but will result in incorrect `:class={"TEST__shorthand": shorthand}` result
      h = `<div :class='{ shorthand }'></div>`;
      r = transform(h, opt);

      assert.equal(
        r,
        `<div :class='{ ${dqng("shorthand")}: shorthand }'></div>`
      );
    });
  })
);
