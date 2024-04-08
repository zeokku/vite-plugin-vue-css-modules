import { assert, describe, expect, test } from "vitest";
import { ng, o, qng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformPug } from "../src/transformPug2";

describe("pug", () => {
  let opt: TLocalTransformOptions = {
    ...o(),
    module: false,
  };

  test("static class attribute", () => {
    let h = `.class0.class1`;
    let r = transformPug(h, opt);
    console.log(r.code);

    // assert.equal(r, `<div class="${ng("class0")} ${ng("class1")}"></div>`);
  });
});
