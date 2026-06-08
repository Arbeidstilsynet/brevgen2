import { DynamicMarkdownParseError } from "./error";
import { Token, tokenize } from "./tokenize";

export type ASTConditionOperand = {
  value: string;
  literalValue?: number | boolean;
};

export type ASTCondition =
  | {
      type: "truthy";
      operand: ASTConditionOperand;
      negated: boolean;
    }
  | {
      type: "comparison";
      leftOperand: ASTConditionOperand;
      operator: string;
      rightOperand: ASTConditionOperand;
    };

export type ASTIfNode = {
  type: "if";
  value: string;
  condition: ASTCondition;
  children: ASTNode[];
  line: number;
};

export type ASTNode =
  | {
      type: "md" | "var";
      value: string;
      line: number;
    }
  | ASTIfNode;

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
    }
    i++;
  }

  return ast;
}

function parseLogicToken(token: Token): ASTIfNode {
  const [condition, output] = splitAndValidateLogicToken(token);
  const cleanedCondition = cleanCondition(condition);
  const children = tokenizeAndAdjustLines(output, token.line);

  return {
    type: "if",
    value: cleanedCondition,
    condition: parseCondition(cleanedCondition),
    children: buildAST(children),
    line: token.line,
  };
}

function splitAndValidateLogicToken(token: Token): [logic: string, children: string] {
  const parts = splitLogicToken(token.value);

  if (parts.length !== 2) {
    throw DynamicMarkdownParseError.invalidSection(token.value, token.line);
  }

  return parts as [string, string];
}

function cleanCondition(condition: string): string {
  const conditionParts = condition.split(" ");
  conditionParts.shift(); // Remove logic keyword
  return conditionParts.join(" ").trim();
}

function parseCondition(condition: string): ASTCondition {
  let i = 0;
  const length = condition.length;

  i = skipWhitespace(i, length, condition);

  let leftOperand = "";
  while (i < length && condition[i] !== " ") {
    leftOperand += condition[i];
    i++;
  }

  i = skipWhitespace(i, length, condition);

  let operator = "";
  while (i < length && condition[i] !== " ") {
    operator += condition[i];
    i++;
  }

  if (operator === "") {
    const negated = leftOperand.startsWith("!");
    return {
      type: "truthy",
      operand: parseOperand(negated ? leftOperand.slice(1) : leftOperand),
      negated,
    };
  }

  i = skipWhitespace(i, length, condition);

  let rightOperand = "";
  while (i < length) {
    rightOperand += condition[i];
    i++;
  }

  return {
    type: "comparison",
    leftOperand: parseOperand(leftOperand),
    operator,
    rightOperand: parseOperand(rightOperand),
  };
}

function parseOperand(operand: string): ASTConditionOperand {
  if (!Number.isNaN(Number(operand))) {
    return { value: operand, literalValue: Number(operand) };
  }

  if (operand.toLowerCase() === "true" || operand.toLowerCase() === "false") {
    return { value: operand, literalValue: operand.toLowerCase() === "true" };
  }

  return { value: operand };
}

function skipWhitespace(i: number, length: number, condition: string): number {
  while (i < length && condition[i] === " ") {
    i++;
  }
  return i;
}

function tokenizeAndAdjustLines(output: string, startLine: number): Token[] {
  const childTokens = tokenize(output);
  let currentLine = startLine;

  return childTokens.map((childToken) => {
    childToken.line = currentLine;
    currentLine += countNewLines(childToken.value);
    return childToken;
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
