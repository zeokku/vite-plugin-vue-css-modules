import { readFileSync, writeFileSync } from "fs";

import pluginFactory from "../dist/index.js";

let nameGenerator = name => "MODULE__" + name;

const plugin = pluginFactory({
  scriptTransform: true,
  nameGenerator,
});

let testVue = readFileSync("./test/test.vue").toString();
const { code: code0, map: map0 } = plugin.transform(testVue, "test.vue");
writeFileSync("./test/result.vue", code0);
writeFileSync("./test/result.map", map0.toString());

let testPugVue = readFileSync("./test/test.pug.vue").toString();
const { code: code1, map: map1 } = plugin.transform(testPugVue, "test.pug.vue");
writeFileSync("./test/result.pug.vue", code1);
writeFileSync("./test/result.pug.map", map1.toString());
