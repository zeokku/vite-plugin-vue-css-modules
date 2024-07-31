import * as babelParser from "@babel/parser";

import babelTraverse from "@babel/traverse";
import type { NodePath } from "@babel/traverse";

import babelGenerator from "@babel/generator";

import * as babelTypes from "@babel/types";
import type { Expression } from "@babel/types";

import type { TLocalTransformOptions } from "./";

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
  // rip `parseExpression`, the time difference is negligible i'm sure
  // to sacrifice better code readability
  let ast = babelParser.parse(`(${exp})`, {
    ranges: false, // this doesn't seem to work lol, as it still adds ranges?
    plugins: ["typescript"],
  });

  // process root node
  // visitor[ast.type]?.({ node: ast });

  // @note wrap ast into expression statement to serve as root element during traversal
  // ast = babelTypes.expressionStatement(ast) as any;

  // @note TRAVERSE ACCEPTS PARENT NODE! SO IT WON'T PROCESS THE ROOT NODE!!!
  babelTraverse(ast, {
    noScope: true,

    Identifier(path) {
      let { parentPath, node } = path;

      if (
        // !parentPath || // undefined when using parseExpression. the exp is an identifier
        parentPath.isExpressionStatement() || // identifier
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
          if (!node.name.startsWith(preservePrefix))
            path.replaceWith(babelTypes.stringLiteral(localNameGenerator(node.name)));
        }

        // skip processing modified node
        path.skip();
      }
    },

    StringLiteral({ node, parentPath }) {
      // @note skip comparisons variable === '', function calls fn('str'), because these strings are not related to classnames
      if (parentPath.isBinaryExpression() || parentPath.isCallExpression()) return;

      if (node.value.startsWith(preservePrefix)) {
        node.value = node.value.slice(preservePrefix.length);
      } else {
        node.value = localNameGenerator(node.value);
      }
    },

    TemplateElement(path) {
      let { node } = path;

      path.replaceWith(babelTypes.templateElement({ raw: localNameGenerator(node.value.cooked) }));

      path.skip();
    },
  });

  // remove ; at the end
  return babelGenerator(ast, { minified: true }).code.slice(0, -1);
};
