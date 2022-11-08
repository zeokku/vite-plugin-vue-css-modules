import lex from "pug-lexer";
import parse from "pug-parser";
import walk from "pug-walk";

import babelParser from "@babel/parser";
import _babelTraverse, { NodePath } from "@babel/traverse";
import _babelGenerator from "@babel/generator";
import babelTypes, { Expression } from "@babel/types";
import { readFileSync, writeFileSync } from "fs";

// @ts-expect-error
const babelTraverse: typeof _babelTraverse = _babelTraverse.default;
// @ts-expect-error
const babelGenerator: typeof _babelGenerator = _babelGenerator.default;

type TNameGenerator = (name: string) => string;

interface TTransformOptions {
  preservePrefix: string;
  nameGenerator: TNameGenerator;
}

const generateModuleAccess = (path: NodePath<Expression>, module = "$style" as string | false) => {
  if (module) {
    path.replaceWith(
      //
      babelTypes.memberExpression(
        //
        babelTypes.identifier(module),
        path.node,
        true
      )
    );
  }
};
export const transform = (source: string, { preservePrefix, nameGenerator }: TTransformOptions) => {
  let exp = readFileSync("./test/test-exp.js").toString();

  // @note wrap in (...)
  let ast = babelParser.parseExpression(`(${exp})`, {
    ranges: false, // this doesn't seem to work lol, as it still adds ranges?
    plugins: ["typescript"],
  });

  // writeFileSync("./test/babel-ast.json", JSON.stringify(ast, null, 4));

  //ObjectExpression.properties[]{key, value, computed}

  // @ts-ignore
  babelTraverse(ast, {
    noScope: true,

    Identifier(path) {
      let { parentPath, node } = path;

      if (
        !parentPath || // undefined if exp is just an identifier
        parentPath.isArrayExpression() ||
        parentPath.isConditionalExpression({ consequent: node }) ||
        parentPath.isConditionalExpression({ alternate: node })
      ) {
        generateModuleAccess(path);

        path.skip();
      }
      // the identifier is object's prop key
      else if (parentPath.isObjectProperty({ key: node })) {
        // @note don't use parentPath.get('computed')
        // TypeError: Property key of ObjectProperty expected node to be of a type ["Identifier","StringLiteral","NumericLiteral","BigIntLiteral","DecimalLiteral","PrivateName"] but instead got "MemberExpression"

        if (parentPath.node.computed) {
          generateModuleAccess(path);
        } else {
          path.replaceWith(babelTypes.stringLiteral(nameGenerator(node.name)));
        }

        // skip processing modified node
        path.skip();
      }
    },

    StringLiteral({ node }) {
      node.value = nameGenerator(node.value);
    },

    TemplateElement(path) {
      let { node } = path;

      path.replaceWith(babelTypes.templateElement({ raw: nameGenerator(node.value.cooked) }));

      path.skip();
    },
  });

  writeFileSync("./test/babel-after.js", babelGenerator(ast).code);

  return parse(lex(source));
};
