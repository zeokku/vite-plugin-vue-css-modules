import { assert, describe, expect, test } from "vitest";
import { md, ng, nows, o, qng } from "./utils";

import type { TLocalTransformOptions } from "../src";
import { transformPug } from "../src/transformPug2";

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

div(:class="[{b: v}, {cv}, 'c', \`d\`, nop]") Yop

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

      let r = transformPug(fixture, opt);

      //prettier-ignore
      const expected = 
`.${ng("class0")}.${ng("class2")}(:class='${md('varClass', module)}')
  #${ng("id0")}.${ng("class3")} test
    div(class="${ng('aa')}", id='bbb')

  .${ng("class")}(:class='${nows`variable ? ${qng('a')} : ${qng('b', '`')}`}') multiline whitespaces

.${ng("class0")} 
    div(:class='${md('varClass', module)}')
    div(:id='${md('aaaid', module)}' :class='${qng('class4')}')
    div(:class='${qng("class5")}')
    div(:class='${nows`v ? ${qng('class6')} : ${qng('class7', '`')}`}')

div(:class='${nows`[{${qng('b')}: v}, {${qng('cv')}: cv}, ${qng('c')}, ${qng('d', '`')}, ${md('nop', module)}]`}') Yop

span(:class='(${nows`{
    [${md('computed', module)}] : toggle0,
    ${qng('static')}: toggle1,
    ${qng('string-const')}: toggle2,
    ${qng("another-one")} : toggle3
}`})')

div(:class='${nows`v0 ? ${qng('class8')} : v1 ? ${qng('class9')} : v2 ? ${md('class10', module)} : ${qng('class11')}`}')
    div(:class='${nows`v0 ? ${md('varClass0', module)} : ${md('varClass1', module)}`}') Now this is processed

.escaped0 
#escaped1 

div(:class="someRawVar")
div(:id="someRawVar2")`

      assert.equal(r.code, expected);
    });
  })
);
