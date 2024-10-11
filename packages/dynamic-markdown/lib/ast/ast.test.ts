import { describe, expect, test } from "vitest";
import { ASTNode, buildAST } from "./build";
import { evaluateAST } from "./evaluate";
import { Token, tokenize } from "./tokenize";

describe("tokenizing", () => {
  test("simple", () => {
    const input = `# Welcome
{{ if isUser == Hello :: Hey! }}
{{ userAge }}`;

    const expectedTokens: Token[] = [
      { type: "md", value: "# Welcome\n", line: 1 },
      { type: "logic", value: "if isUser == Hello :: Hey!", line: 2 },
      { type: "md", value: "\n", line: 2 },
      { type: "var", value: "userAge", line: 3 },
    ];

    expect(tokenize(input)).toEqual(expectedTokens);
  });

  test("nested", () => {
    const input = `# Welcome
{{ if isUser == Hello :: {{ userName }}! }}
{{ userAge }}`;

    const expectedTokens: Token[] = [
      { type: "md", value: "# Welcome\n", line: 1 },
      {
        type: "logic",
        value: "if isUser == Hello :: {{ userName }}!",
        line: 2,
      },
      { type: "md", value: "\n", line: 2 },
      { type: "var", value: "userAge", line: 3 },
    ];

    expect(tokenize(input)).toEqual(expectedTokens);
  });
});

describe("AST", () => {
  test("simple", () => {
    const input = `# Welcome
{{ if isUser == true :: Hey! }}
{{ userAge }}`;

    const expectedAST: ASTNode[] = [
      { type: "md", value: "# Welcome\n", line: 1 },
      {
        type: "if",
        value: "isUser == true",
        line: 2,
        children: [{ type: "md", value: "Hey!", line: 2 }],
      },
      { type: "md", value: "\n", line: 2 },
      { type: "var", value: "userAge", line: 3 },
    ];

    const tokens = tokenize(input);
    expect(buildAST(tokens)).toEqual(expectedAST);
  });

  test("nested", () => {
    const input = `# Welcome
{{ if isUser == true :: Hello, {{ userName }}! }}
{{ userAge }}`;

    const expectedAST: ASTNode[] = [
      { type: "md", value: "# Welcome\n", line: 1 },
      {
        type: "if",
        value: "isUser == true",
        line: 2,
        children: [
          { type: "md", value: "Hello, ", line: 2 },
          { type: "var", value: "userName", line: 2 },
          { type: "md", value: "!", line: 2 },
        ],
      },
      { type: "md", value: "\n", line: 2 },
      { type: "var", value: "userAge", line: 3 },
    ];

    const tokens = tokenize(input);
    expect(buildAST(tokens)).toEqual(expectedAST);
  });
});

describe("evaluating", () => {
  test("simple", () => {
    const input = `# Welcome
{{ if isUser == true :: Hey! }}
{{ userAge }}`;

    const variables = {
      isUser: true,
      userAge: 25,
    };

    const expectedOutput = `# Welcome
Hey!
25`;

    const tokens = tokenize(input);
    const astNodes = buildAST(tokens);
    expect(evaluateAST(astNodes, variables)).toEqual(expectedOutput);
  });

  test("nested", () => {
    const input = `# Welcome
{{ if isUser == true :: {{ userName }}! }}
{{ userAge }}`;

    const variables = {
      isUser: true,
      userName: "World",
      userAge: 25,
    };

    const expectedOutput = `# Welcome
World!
25`;

    const tokens = tokenize(input);
    const astNodes = buildAST(tokens);
    expect(evaluateAST(astNodes, variables)).toEqual(expectedOutput);
  });
});
