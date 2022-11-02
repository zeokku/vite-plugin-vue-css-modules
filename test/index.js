import generateCode from "pug-code-gen";
import wrap from "pug-runtime/wrap.js";

import { readFileSync, writeFileSync } from "fs";

import { transform } from "../dist/transform2.js";

let preservePrefix = "--";
let nameGenerator = name => "TEST__" + name;

let ast = transform(readFileSync("./test/test.pug").toString(), { preservePrefix, nameGenerator });

writeFileSync("./test/ast.json", JSON.stringify(ast, null, 4));

let funcStr = generateCode(ast, {});

let template = wrap(funcStr);

let htmlTemplateCode = template({});

writeFileSync("./test/result.html", htmlTemplateCode);
