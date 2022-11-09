import babelParser from "@babel/parser";
import _babelTraverse, { NodePath } from "@babel/traverse";
import _babelGenerator from "@babel/generator";
import babelTypes, { type Expression } from "@babel/types";

import type { TLocalTransformOptions } from "./types";

// @ts-expect-error
const babelTraverse: typeof _babelTraverse = _babelTraverse.default;
// @ts-expect-error
const babelGenerator: typeof _babelGenerator = _babelGenerator.default;

const generateModuleAccess = (path: NodePath<Expression>, module: string | false) => {
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

export const transformJsValue = (
  exp: string,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  // @note wrap in (...)
  let ast = babelParser.parseExpression(`(${exp})`, {
    ranges: false, // this doesn't seem to work lol, as it still adds ranges?
    plugins: ["typescript"],
  });

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
        generateModuleAccess(path, module);

        path.skip();
      }
      // the identifier is object's prop key
      else if (parentPath.isObjectProperty({ key: node })) {
        // @note don't use parentPath.get('computed')
        // TypeError: Property key of ObjectProperty expected node to be of a type ["Identifier","StringLiteral","NumericLiteral","BigIntLiteral","DecimalLiteral","PrivateName"] but instead got "MemberExpression"

        if (parentPath.node.computed) {
          generateModuleAccess(path, module);
        } else {
          // if(!node.name.startsWidth(preservePrefix)) // @todo ?
          path.replaceWith(babelTypes.stringLiteral(localNameGenerator(node.name)));
        }

        // skip processing modified node
        path.skip();
      }
    },

    StringLiteral({ node }) {
      // @todo ? preservePrefix
      node.value = localNameGenerator(node.value);
    },

    TemplateElement(path) {
      let { node } = path;

      path.replaceWith(babelTypes.templateElement({ raw: localNameGenerator(node.value.cooked) }));

      path.skip();
    },
  });

  return babelGenerator(ast).code;
};
