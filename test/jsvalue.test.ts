import { assert, describe, expect, test } from "vitest";
import { o, md, sq, sqng, dqng, bqng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformJsValue } from "../src/transformJsValue";
import { MagicString } from "@vue/compiler-sfc";

const testValue = (
  value: string,
  options: TLocalTransformOptions,
  cb: (result: string) => void
) =>
  test(value, () => {
    const sfcTransform = new MagicString(value);

    transformJsValue(value, 0, sfcTransform, '"', options);

    cb(sfcTransform.toString());
  });

(["$style", false] as const).forEach(module => {
  describe(`transform js value (module: ${module})`, () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    testValue("varClass", opt, r => {
      assert.equal(r, md("varClass", module));
    });

    testValue(`'class'`, opt, r => {
      assert.equal(r, sqng("class"));
    });

    testValue(`"class"`, opt, r => {
      assert.equal(r, dqng("class"));
    });

    testValue(`'--escaped'`, opt, r => {
      assert.equal(r, sq("escaped"));
    });

    testValue("f ? 'x' : `y`", opt, r => {
      assert.equal(r, `f ? ${sqng("x")} : ${bqng("y")}`);
    });

    testValue(
      `v0 ? 'class0' : v1 ? "class1" : v2 ? class2 : \`class3\``,
      opt,
      r => {
        // @note double quoted string should be singlequoted
        // prettier-ignore
        assert.equal(r, 
        `v0 ? ${sqng('class0')} : v1 ? ${dqng('class1')} : v2 ? ${md('class2', module)} : ${bqng('class3')}`
      )
      }
    );

    testValue("v0 ? varClass0 : varClass1", opt, r => {
      // prettier-ignore
      assert.equal(r, 
        `v0 ? ${md('varClass0', module)} : ${md('varClass1', module)}`
      )
    });

    testValue("variable === '' || 'class'", opt, r => {
      // prettier-ignore
      assert.equal(r,
        // @note no idea why babel changes quotes
        `variable === '' || ${sqng("class")}`
      );
    });

    testValue(
      "s1.normalize('NFKD') === s2.normalize('NFKD') && 'classname'",
      opt,
      r => {
        // prettier-ignore
        assert.equal(
          r,
          `s1.normalize('NFKD') === s2.normalize('NFKD') && ${sqng("classname")}`
        );
      }
    );

    testValue(
      "s1?.normalize('NFKD') === s2.normalize('NFKD') && 'classname'",
      opt,
      r => {
        // prettier-ignore
        assert.equal(
          r,
          `s1?.normalize('NFKD') === s2.normalize('NFKD') && ${sqng("classname")}`
        );
      }
    );

    testValue("[{ a: f0 }, { c }, 'd', `e`, varClass]", opt, r => {
      // prettier-ignore
      assert.equal(r, 
        `[{ ${sqng('a')}: f0 }, { ${sqng('c')}: c }, ${sqng('d')}, ${bqng('e')}, ${md('varClass', module)}]` 
      );
    });

    testValue("flag ? ['--escaped', 'class0'] : []", opt, r => {
      // prettier-ignore
      assert.equal(r, 
        `flag ? ['escaped', ${sqng('class0')}] : []`
      );
    });

    testValue(
      `{ [computed]: toggle0, static: toggle1, 'string-const': toggle2 }`,
      opt,
      r => {
        // prettier-ignore
        assert.equal(r, 
        // @note ()
        // prettier-ignore
`{ [${md('computed', module)}]: toggle0, ${sqng('static')}: toggle1, ${sqng('string-const')}: toggle2 }` 
      )
      }
    );

    testValue(`{ '--escaped': toggle0 }`, opt, r => {
      assert.equal(r, `{ 'escaped': toggle0 }`);
    });

    testValue(
      `{ $escaped: toggle0 }`,
      {
        ...o("$"),
        module,
      },
      r => {
        assert.equal(r, `{ escaped: toggle0 }`);
      }
    );
  });
});
