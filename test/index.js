import { readFileSync, writeFileSync } from "fs";

import pluginFactory from "../dist/index.js";

let nameGenerator = name => "TEST__" + name;

const plugin = pluginFactory({
  scriptTransform: true,
  nameGenerator,
});

let testVue = readFileSync("./test/test.vue").toString();
let testPugVue = readFileSync("./test/test.pug.vue").toString();

writeFileSync("./test/result.vue", plugin.transform(testVue, "test.vue"));
writeFileSync("./test/result.pug.vue", plugin.transform(testPugVue, "test.vue"));
