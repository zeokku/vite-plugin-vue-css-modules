import { assert, describe, expect, test } from "vitest";
import { dqng, md, ng, o, sqng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformPug } from "../src/transformPug2";
import { MagicString } from "@vue/compiler-sfc";

const transform = (fixture: string, opt: TLocalTransformOptions) => {
  const sfcTransform = new MagicString(fixture);

  transformPug(fixture, 0, sfcTransform, opt);

  return sfcTransform.toString();
};

(["$style", false] as const).forEach(module =>
  describe(`pug (module: ${module})`, () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    test("static class attribute", () => {
      let h = `.class0.class1`;
      let r = transform(h, opt);
      assert.equal(r, `.${ng("class0")}.${ng("class1")}`);
    });

    test("static and variable class attributes", () => {
      let h = `.class0.class1(:class="varClass")`;
      let r = transform(h, opt);
      // prettier-ignore
      assert.equal(r,
        `.${ng("class0")}.${ng("class1")}(:class="${md('varClass', module)}")`      
      );
    });

    test("variable id", () => {
      //prettier-ignore
      let h = `div(:id="varId")`
      let r = transform(h, opt);

      //prettier-ignore
      assert.equal(r, `div(:id="${md('varId', module)}")`)
    });

    test("mixed class and id attributes", () => {
      // prettier-ignore
      let h = `.class0#id0(:class="varClass0")`
      let r = transform(h, opt);

      // prettier-ignore
      assert.equal(r, `.${ng('class0')}#${ng('id0')}(:class="${md('varClass0', module)}")`);
    });

    test("nested elements", () => {
      // prettier-ignore
      let h = 
`.a
  .b(:class="varClass")
`;

      let r = transform(h, opt);

      // prettier-ignore
      assert.equal(r, 
`.${ng("a")}
  .${ng("b")}(:class="${md('varClass', module)}")
`
    );
    });

    // --class escapes entire attribute
    test("escape static attributes", () => {
      let h = 'div(--class="class0 class1")';
      let r = transform(h, opt);

      assert.equal(r, `div(class="class0 class1")`);

      h = 'div(--id="el")';
      r = transform(h, opt);

      assert.equal(r, 'div(id="el")');
    });

    test("escape inline attributes", () => {
      let h = ".--class0.--class1";
      let r = transform(h, opt);

      assert.equal(r, ".class0.class1");

      h = "#--id0";
      r = transform(h, opt);

      assert.equal(r, "#id0");
    });

    test("escape inline mixed class", () => {
      let h = ".--escape.class0";
      let r = transform(h, opt);

      assert.equal(r, `.escape.${ng("class0")}`);
    });

    test("escape dynamic attributes", () => {
      let h = 'div(:--class="[class0, class1]")';
      let r = transform(h, opt);

      assert.equal(r, `div(:class="[class0, class1]")`);

      h = 'div(:--id="el")';
      r = transform(h, opt);

      assert.equal(r, 'div(:id="el")');
    });

    test("object property quote rotation", () => {
      let h = `div(:class="{ shorthand }")`;
      let r = transform(h, opt);

      assert.equal(r, `div(:class="{ ${sqng("shorthand")}: shorthand }")`);

      // @todo there's a possible error with `:class={shorthand}` technically possible in html but will result in incorrect `:class={"TEST__shorthand": shorthand}` result
      h = `div(:class='{ shorthand }')`;
      r = transform(h, opt);

      assert.equal(r, `div(:class='{ ${dqng("shorthand")}: shorthand }')`);
    });
  })
);
