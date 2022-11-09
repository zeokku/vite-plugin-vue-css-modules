import { readFileSync, writeFileSync } from "fs";

import pluginFactory from "../dist/index.js";

let nameGenerator = name => "TEST__" + name;

const plugin = pluginFactory({ nameGenerator });

let testVue = readFileSync("./test/test.vue").toString();

let result = plugin.transform(testVue, "test.vue");

writeFileSync("./test/result.vue", result);
