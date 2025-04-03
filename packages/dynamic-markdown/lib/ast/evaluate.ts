import { ASTNode, buildAST } from "./build";
import { DynamicMarkdownParseError } from "./error";
import { tokenize } from "./tokenize";

export type VariableValue = string | number | boolean | null;

const VALID_OPERATORS = ["==", "!="] as const;
type ValidOperator = (typeof VALID_OPERATORS)[number];

function isValidOperator(operator: string): operator is ValidOperator {
  return VALID_OPERATORS.includes(operator as ValidOperator);
}

export function isNegatedVariable(variableName: string) {
  return variableName.startsWith("!");
}

export function evaluateAST(ast: ASTNode[], variables: Record<string, VariableValue>): string {
  let result = "";

  for (const node of ast) {
    if (node.type === "md") {
      result += node.value;
    } else if (node.type === "if") {
      if (evaluateCondition(node.value, variables, node.line)) {
        result += evaluateAST(node.children!, variables);
      }
    } else if (node.type === "var") {
      result += processVariable(node.value, variables, node.line);
    }
  }

  return result;
}

function processVariable(
  variableName: string,
  variables: Record<string, VariableValue>,
  line: number,
): string {
  if (variableName in variables) {
    const resolvedValue = variables[variableName];
    if (typeof resolvedValue === "string") {
      // Tokenize and evaluate the resolved value to handle nested variables
      const nestedTokens = tokenize(resolvedValue);
      const nestedAST = buildAST(nestedTokens);
      return evaluateAST(nestedAST, variables);
    }
    return String(resolvedValue);
  } else {
    throw DynamicMarkdownParseError.undefinedVariable(variableName, line);
  }
}

function evaluateCondition(
  condition: string,
  variables: Record<string, VariableValue>,
  line: number,
): boolean {
  const { leftOperand, operator, rightOperand, isTruthyCheck } = parseCondition(condition);

  if (isTruthyCheck) {
    if (leftOperand in variables) {
      return Boolean(variables[leftOperand]);
    } else if (isNegatedVariable(leftOperand) && leftOperand.slice(1) in variables) {
      return !variables[leftOperand.slice(1)];
    } else {
      const variablename = isNegatedVariable(leftOperand) ? leftOperand.slice(1) : leftOperand;
      throw DynamicMarkdownParseError.undefinedVariable(variablename, line);
    }
  }

  if (!isValidOperator(operator)) {
    throw DynamicMarkdownParseError.unsupportedOperator(operator, line);
  }

  const [leftIsCertainlyValue, leftValue] = processOperand(leftOperand, variables);
  const [rightIsCertainlyValue, rightValue] = processOperand(rightOperand, variables);

  if (!leftIsCertainlyValue && !rightIsCertainlyValue) {
    throw DynamicMarkdownParseError.undefinedVariables([leftOperand, rightOperand], line);
  }

  switch (operator) {
    case "==":
      return compareValues(leftValue, rightValue);
    case "!=":
      return !compareValues(leftValue, rightValue);
  }
}

type ParsedCondition = {
  leftOperand: string;
  operator: string;
  rightOperand: string;
  isTruthyCheck: boolean;
};

function parseCondition(condition: string): ParsedCondition {
  let i = 0;
  const length = condition.length;

  i = skipWhitespace(i, length, condition);

  // Extract left operand
  let leftOperand = "";
  while (i < length && condition[i] !== " ") {
    leftOperand += condition[i];
    i++;
  }

  i = skipWhitespace(i, length, condition);

  // Extract operator
  let operator = "";
  while (i < length && condition[i] !== " ") {
    operator += condition[i];
    i++;
  }

  // Handle missing operator, i.e. truthyness check
  if (operator === "") {
    return { leftOperand, operator: "", rightOperand: "", isTruthyCheck: true };
  }

  i = skipWhitespace(i, length, condition);

  // Extract right operand
  let rightOperand = "";
  while (i < length) {
    rightOperand += condition[i];
    i++;
  }

  return { leftOperand, operator, rightOperand, isTruthyCheck: false };
}

function processOperand(
  operand: string,
  variables: Record<string, VariableValue>,
): [isCertainlyValue: boolean, value: VariableValue] {
  if (operand in variables) {
    return [true, variables[operand]];
  }

  if (!isNaN(Number(operand))) {
    return [true, Number(operand)];
  }

  if (operand.toLowerCase() === "true" || operand.toLowerCase() === "false") {
    return [true, operand.toLowerCase() === "true"];
  }

  return [false, operand]; // variable name or string value
}

function skipWhitespace(i: number, length: number, condition: string) {
  while (i < length && condition[i] === " ") {
    i++;
  }
  return i;
}

function compareValues(left: VariableValue, right: VariableValue): boolean {
  return left?.toString() === right?.toString();
}
