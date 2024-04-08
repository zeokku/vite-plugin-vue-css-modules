import lex from "pug-lexer";

let l = lex(
  `div(:class =   \`{
    sos,
    bob
  }\`)`,
  {
    // startingLine: new Number(0),
    // startingColumn: new Number(0),
  }
);

console.log(JSON.stringify(l, null, 4));
