import { assert, describe, expect, test } from "vitest";
import { o, q, qng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformJsValue } from "../src/transformJsValue";

const testValue = (value: string, options: TLocalTransformOptions, cb: (result: string) => void) =>
  test(value, () => {
    cb(transformJsValue(value, options));
  });

(["$style", false] as const).forEach(module => {
  describe(`transform js value (module: ${module})`, () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    testValue("varClass", opt, r => {
      assert.equal(r, module ? `${module}[varClass]` : "varClass");
    });

    testValue(`'class'`, opt, r => {
      assert.equal(r, qng("class"));
    });

    testValue(`"class"`, opt, r => {
      assert.equal(r, qng("class"));
    });

    testValue(`'--escaped'`, opt, r => {
      assert.equal(r, q("escaped"));
    });

    testValue("f ? 'x' : `y`", opt, r => {
      assert.equal(r, `f?${qng("x")}:${qng("y", "`")}`);
    });

    testValue(`v0 ? 'class0' : v1 ? "class1" : v2 ? class2 : \`class3\``, opt, r => {
      // prettier-ignore
      assert.equal(r, 
        module ? 
        `v0?${qng('class0')}:v1?${qng('class1', '"')}:v2?${module}[class2]:${qng('class3', '`')}` : 
        `v0?${qng('class0')}:v1?${qng('class1', '"')}:v2?class2:${qng('class3', '`')}`
      )
    });

    testValue("v0 ? varClass0 : varClass1", opt, r => {
      // prettier-ignore
      assert.equal(r, 
        module ?
        `v0?${module}[varClass0]:${module}[varClass1]` :
        `v0?varClass0:varClass1`
      )
    });

    testValue("variable === '' || 'class'", opt, r => {
      // prettier-ignore
      assert.equal(r,
        // @note no idea why babel changes quotes of empty strings
        `variable===""||${qng("class")}`
      );
    });

    testValue("s1.normalize('NFKD') === s2.normalize('NFKD') && 'classname'", opt, r => {
      assert.equal(r, `s1.normalize("NFKD")===s2.normalize("NFKD")&&${qng("classname")}`);
    });

    testValue("s1?.normalize('NFKD') === s2.normalize('NFKD') && 'classname'", opt, r => {
      assert.equal(r, `s1?.normalize("NFKD")===s2.normalize("NFKD")&&${qng("classname")}`);
    });

    testValue("[{ a: f0 }, { c }, 'd', `e`, varClass]", opt, r => {
      // prettier-ignore
      assert.equal(r, 
        module ? 
        `[{${qng('a', '"')}:f0},{${qng('c', '"')}:c},${qng('d')},${qng('e', '`')},${module}[varClass]]` : 
        `[{${qng('a', '"')}:f0},{${qng('c', '"')}:c},${qng('d')},${qng('e', '`')},varClass]`
      );
    });

    testValue("flag ? ['--escaped', 'class0'] : []", opt, r => {
      // prettier-ignore
      assert.equal(r, 
        `flag?["escaped",${qng('class0')}]:[]`
      );
    });

    testValue(`{ [computed]: toggle0, static: toggle1, 'string-const': toggle2 }`, opt, r => {
      // prettier-ignore
      assert.equal(r, 
        module ? 
        // @note ()
        `({[${module}[computed]]:toggle0,${qng('static', '"')}:toggle1,${qng('string-const')}:toggle2})` : 
        `({[computed]:toggle0,${qng('static', '"')}:toggle1,${qng('string-const')}:toggle2})`
      )
    });

    testValue(`{ '--escaped': toggle0 }`, opt, r => {
      assert.equal(r, `({"escaped":toggle0})`);
    });

    opt = {
      ...o("$"),
      module,
    };

    testValue(`{ $escaped: toggle0 }`, opt, r => {
      assert.equal(r, `({"escaped":toggle0})`);
    });
  });
});
