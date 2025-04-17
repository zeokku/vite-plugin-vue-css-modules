import { assert, describe, expect, test } from "vitest";
import { sqng, dqng, bqng, md, ng, o } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformPug } from "../src/transformPug2";
import { MagicString } from "@vue/compiler-sfc";

(["$style", false] as const).forEach(module =>
  describe(`pug complex (module: ${module})`, () => {
    let opt: TLocalTransformOptions = {
      ...o(),
      module,
    };

    test("suite", () => {
      //prettier-ignore
      let fixture =
`.class0.class2(:class="varClass")
  #id0.class3 test
    div(class="aa", --id='bbb')

  .class(:class =
         "variable ? 'a' : \`b\`") multiline whitespaces

.class0 
    div(:class="varClass")
    div(:id="aaaid" :class="'class4'")
    div(:class='"class5"')
    div(:class="v ? 'class6' : \`class7\`")

div(:class='[{b: v}, {cv}, "c", \`d\`, nop]') Yop

span(:class=\`{
    [computed] : toggle0,
    static: toggle1,
    'string-const':toggle2,
    "another-one" :toggle3
}\`)

div(:class="v0 ? 'class8' : v1 ? 'class9' : v2 ? class10 :'class11'")
    div(:class="v0 ? varClass0 : varClass1") Now this is processed

.--escaped0 
#--escaped1 

div(:--class="someRawVar")
div(:--id="someRawVar2")`;

      const sfcTransform = new MagicString(fixture);

      transformPug(fixture, 0, sfcTransform, opt);

      let transformed = sfcTransform.toString();

      //prettier-ignore
      const expected = 
`.${ng("class0")}.${ng("class2")}(:class="${md('varClass', module)}")
  #${ng("id0")}.${ng("class3")} test
    div(class="${ng('aa')}", id='bbb')

  .${ng("class")}(:class =
         "variable ? ${sqng('a')} : ${bqng('b')}") multiline whitespaces

.${ng("class0")} 
    div(:class="${md('varClass', module)}")
    div(:id="${md('aaaid', module)}" :class="${sqng('class4')}")
    div(:class='${dqng("class5")}')
    div(:class="v ? ${sqng('class6')} : ${bqng('class7')}")

div(:class='[{${dqng('b')}: v}, {${dqng('cv')}: cv}, ${dqng('c')}, ${bqng('d')}, ${md('nop', module)}]') Yop

span(:class=\`{
    [${md('computed', module)}] : toggle0,
    ${dqng('static')}: toggle1,
    ${sqng('string-const')}:toggle2,
    ${dqng("another-one")} :toggle3
}\`)

div(:class="v0 ? ${sqng('class8')} : v1 ? ${sqng('class9')} : v2 ? ${md('class10', module)} :${sqng('class11')}")
    div(:class="v0 ? ${md('varClass0', module)} : ${md('varClass1', module)}") Now this is processed

.escaped0 
#escaped1 

div(:class="someRawVar")
div(:id="someRawVar2")`

      assert.equal(transformed, expected);
    });
  })
);
