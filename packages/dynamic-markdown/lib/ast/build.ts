import { Token, tokenize } from "./tokenize";

export type ASTNode = {
  type: "md" | "if" | "var";
  value: string;
  children?: ASTNode[];
  line: number;
};

export function buildAST(tokens: Token[]): ASTNode[] {
  const ast: ASTNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "md") {
      ast.push({ type: "md", value: token.value, line: token.line });
    } else if (token.type === "logic") {
      ast.push(parseLogicToken(token));
    } else if (token.type === "var") {
      ast.push({ type: "var", value: token.value, line: token.line });
    } else {
      throw new TypeError(`Unsupported token type: ${token.type} at line ${token.line}`);
    }
    i++;
  }

  return ast;
}

export function parseLogicToken(token: Token): ASTNode {
  const [condition, output] = splitAndValidateLogicToken(token);
  const cleanedCondition = cleanCondition(condition);
  const children = tokenizeAndAdjustLines(output, token.line);

  return {
    type: "if",
    value: cleanedCondition,
    children: buildAST(children),
    line: token.line,
  };
}

function splitAndValidateLogicToken(token: Token): [logic: string, children: string] {
  const parts = splitLogicToken(token.value);

  if (parts.length !== 2) {
    throw new TypeError(`Invalid dynamic section format at line ${token.line}: ${token.value}`);
  }

  return parts as [string, string];
}

function cleanCondition(condition: string): string {
  const conditionParts = condition.split(" ");
  conditionParts.shift(); // Remove logic keyword
  return conditionParts.join(" ").trim();
}

function tokenizeAndAdjustLines(output: string, startLine: number): Token[] {
  const childTokens = tokenize(output);
  let currentLine = startLine;

  return childTokens.map((childToken) => {
    const adjustedToken = { ...childToken, line: currentLine };
    currentLine += countNewLines(childToken.value);
    return adjustedToken;
  });
}

function countNewLines(value: string): number {
  let newLineCount = 0;
  for (const char of value) {
    if (char === "\n") {
      newLineCount++;
    }
  }
  return newLineCount;
}

function splitLogicToken(value: string): string[] {
  const parts: string[] = [];
  let currentPart = "";
  let nestedLevel = 0;

  for (let i = 0; i < value.length; i++) {
    if (isOpeningBrace(value, i)) {
      nestedLevel++;
      currentPart += value[i];
    } else if (isClosingBrace(value, i)) {
      nestedLevel--;
      currentPart += value[i];
    } else if (isSeparator(value, i, nestedLevel)) {
      parts.push(currentPart);
      currentPart = "";
      i++; // Skip the next ':'
    } else {
      currentPart += value[i];
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  return parts;
}

function isOpeningBrace(value: string, index: number): boolean {
  return value[index] === "{" && value[index + 1] === "{";
}

function isClosingBrace(value: string, index: number): boolean {
  return value[index] === "}" && value[index + 1] === "}";
}

function isSeparator(value: string, index: number, nestedLevel: number): boolean {
  return nestedLevel === 0 && value[index] === ":" && value[index + 1] === ":";
}
