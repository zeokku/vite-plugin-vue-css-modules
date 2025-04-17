import * as babelParser from "@babel/parser";
import babelTraverse, { type NodePath } from "@babel/traverse";
import * as babelTypes from "@babel/types";

import type { MagicString } from "@vue/compiler-sfc";

import type { TLocalTransformOptions } from "./";
import { parseQuotedValue } from "./shared.js";

type TQuote = "'" | '"' | "" | "`" | undefined;

/**
 * Select non-conflicting quote character to the attribute value wrapping quotes
 */
const quoteRotation = (attributeQuote: TQuote) => {
  // @note use single quote if attribute wrapping uses double quotes otherwise use double quotes (in case of backtick quotes or no quotes)
  return attributeQuote === '"' ? "'" : '"';
};

const generateModuleAccess = (
  path: NodePath<babelTypes.Identifier>,
  module: string | false,
  contentOffset: number,
  sfcTransform: MagicString
) => {
  if (module) {
    const { node } = path;
    const { range } = node;
    const startOffset = contentOffset + range[0] - 1;
    const endOffset = contentOffset + range[1] - 1;

    sfcTransform.update(startOffset, endOffset, `${module}[${node.name}]`);
  }
};

export const transformJsValue = (
  source: string,
  contentOffset: number,
  sfcTransform: MagicString,
  attributeQuote: TQuote,
  { preservePrefix, localNameGenerator, module }: TLocalTransformOptions
) => {
  // @note wrap in (...) to serve as root element during traversal, because traverse accepts parent node which won't be processed
  let ast = babelParser.parse(`(${source})`, {
    ranges: true,
    plugins: ["typescript"],
  });

  babelTraverse(ast, {
    noScope: true,

    Identifier(path) {
      let { parentPath, node } = path;

      if (
        parentPath.isExpressionStatement() || // identifier
        // @note [class0, class1]
        parentPath.isArrayExpression() ||
        // @note q ? class : b
        parentPath.isConditionalExpression({ consequent: node }) ||
        // @note q ? a : class
        parentPath.isConditionalExpression({ alternate: node })
      ) {
        generateModuleAccess(path, module, contentOffset, sfcTransform);

        path.skip();
      }
      // the identifier is object's prop key
      else if (parentPath.isObjectProperty({ key: node })) {
        // @note don't use parentPath.get('computed')
        // TypeError: Property key of ObjectProperty expected node to be of a type ["Identifier","StringLiteral","NumericLiteral","BigIntLiteral","DecimalLiteral","PrivateName"] but instead got "MemberExpression"

        // @note { [identifier]: value }
        if (parentPath.node.computed) {
          generateModuleAccess(path, module, contentOffset, sfcTransform);

          // @note { a: 0 }
          // { 'b': 1 } will be processed in StringLiteral
        } else {
          const { range } = node;
          const startOffset = contentOffset + range[0] - 1;
          const endOffset = contentOffset + range[1] - 1;

          // @note CAN HAPPEN! e.g. `{ $escaped: toggle }` prefixes can be symbols which are allowed in unquoted properties (identifiers)
          if (node.name.startsWith(preservePrefix)) {
            sfcTransform.update(
              startOffset,
              endOffset,
              node.name.slice(preservePrefix.length)
            );
          } else {
            const transformedClass = localNameGenerator(node.name);

            const selectedQuote = quoteRotation(attributeQuote);
            const quotedTransformedClass =
              selectedQuote + transformedClass + selectedQuote;

            sfcTransform.update(
              startOffset,
              endOffset,
              // @note { class } -> { "transformedClass": class }
              parentPath.node.shorthand
                ? `${quotedTransformedClass}: ${node.name}`
                : quotedTransformedClass
            );
          }
        }

        // skip processing modified node
        path.skip();
      }
    },

    StringLiteral({ node, parentPath }) {
      // @note skip comparisons variable === '', function calls fn('str'), because these strings are not related to classnames
      if (
        parentPath.isBinaryExpression() ||
        parentPath.isCallExpression() ||
        parentPath.isOptionalCallExpression()
      )
        return;

      const { value } = parseQuotedValue(node.extra!.raw as string);

      // prettier-ignore
      const startOffset = contentOffset + node.range[0]
      // @note skip (
      - 1
      // @note offset quote  
      + 1;

      const endOffset = contentOffset + node.range[1] - 1 - 1;

      if (value.startsWith(preservePrefix)) {
        sfcTransform.update(
          startOffset,
          endOffset,
          value.slice(preservePrefix.length)
        );
      } else {
        sfcTransform.update(startOffset, endOffset, localNameGenerator(value));
      }
    },

    // @note `aaaa${0}`, aaaa is template element
    TemplateElement(path) {
      let { node } = path;

      const startOffset = contentOffset + node.range[0] - 1;
      const endOffset = contentOffset + node.range[1] - 1;

      sfcTransform.update(
        startOffset,
        endOffset,
        localNameGenerator(node.value.raw)
      );

      path.skip();
    },
  });
};
