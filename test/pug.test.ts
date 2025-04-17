import { assert, describe, expect, test } from "vitest";
import { md, ng, o, qng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformPug } from "../src/transformPug2";

(["$style", false] as const).forEach(module =>
  describe(`pug (module: ${module})`, () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    test("static class attribute", () => {
      let h = `.class0.class1`;
      let r = transformPug(h, opt);
      assert.equal(r.code, `.${ng("class0")}.${ng("class1")}`);
    });

    test("static and variable class attributes", () => {
      let h = `.class0.class1(:class="varClass")`;
      let r = transformPug(h, opt);
      // prettier-ignore
      assert.equal(r.code,
        `.${ng("class0")}.${ng("class1")}(:class='${md('varClass', module)}')`      
      );
    });

    test("variable id", () => {
      //prettier-ignore
      let h = `div(:id="varId")`
      let r = transformPug(h, opt);

      //prettier-ignore
      assert.equal(r.code, `div(:id='${md('varId', module)}')`)
    });

    test("mixed class and id attributes", () => {
      // prettier-ignore
      let h = `.class0#id0(:class="varClass0")`
      let r = transformPug(h, opt);

      // prettier-ignore
      assert.equal(r.code, `.${ng('class0')}#${ng('id0')}(:class='${md('varClass0', module)}')`);
    });

    test("nested elements", () => {
      // prettier-ignore
      let h = 
`.a
  .b(:class="varClass")
`;

      let r = transformPug(h, opt);

      // prettier-ignore
      assert.equal(r.code, 
`.${ng("a")}
  .${ng("b")}(:class='${md('varClass', module)}')
`
    );
    });

    // --class escapes entire attribute
    test("escape static attributes", () => {
      let h = 'div(--class="class0 class1")';
      let r = transformPug(h, opt);

      assert.equal(r.code, `div(class="class0 class1")`);

      h = 'div(--id="el")';
      r = transformPug(h, opt);

      assert.equal(r.code, 'div(id="el")');
    });

    test("escape inline attributes", () => {
      let h = ".--class0.--class1";
      let r = transformPug(h, opt);

      assert.equal(r.code, ".class0.class1");

      h = "#--id0";
      r = transformPug(h, opt);

      assert.equal(r.code, "#id0");
    });

    test("escape inline mixed class", () => {
      let h = ".--escape.class0";
      let r = transformPug(h, opt);

      assert.equal(r.code, `.escape.${ng("class0")}`);
    });

    test("escape dynamic attributes", () => {
      let h = 'div(:--class="[class0, class1]")';
      let r = transformPug(h, opt);

      assert.equal(r.code, `div(:class="[class0, class1]")`);

      h = 'div(:--id="el")';
      r = transformPug(h, opt);

      assert.equal(r.code, 'div(:id="el")');
    });
  })
);
