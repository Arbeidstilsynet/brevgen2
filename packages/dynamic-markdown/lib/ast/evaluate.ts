import { type ASTCondition, type ASTConditionOperand, type ASTNode, buildAST } from "./build";
import { DynamicMarkdownParseError } from "./error";
import { tokenize } from "./tokenize";

export type VariableValue = string | number | boolean | null;

const VALID_OPERATORS = ["==", "!="] as const;
type ValidOperator = (typeof VALID_OPERATORS)[number];

function isValidOperator(operator: string): operator is ValidOperator {
  return VALID_OPERATORS.includes(operator as ValidOperator);
}

export function evaluateAST(ast: ASTNode[], variables: Record<string, VariableValue>): string {
  let result = "";

  for (const node of ast) {
    if (node.type === "md") {
      result += node.value;
    } else if (node.type === "if") {
      if (evaluateCondition(node.condition, variables, node.line)) {
        result += evaluateAST(node.children, variables);
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
  condition: ASTCondition,
  variables: Record<string, VariableValue>,
  line: number,
): boolean {
  if (condition.type === "truthy") {
    const variableName = condition.operand.value;
    if (variableName in variables) {
      const result = Boolean(variables[variableName]);
      return condition.negated ? !result : result;
    }

    throw DynamicMarkdownParseError.undefinedVariable(variableName, line);
  }

  if (!isValidOperator(condition.operator)) {
    throw DynamicMarkdownParseError.unsupportedOperator(condition.operator, line);
  }

  const [leftIsCertainlyValue, leftValue] = processOperand(condition.leftOperand, variables);
  const [rightIsCertainlyValue, rightValue] = processOperand(condition.rightOperand, variables);

  if (!leftIsCertainlyValue && !rightIsCertainlyValue) {
    throw DynamicMarkdownParseError.undefinedVariables(
      [condition.leftOperand.value, condition.rightOperand.value],
      line,
    );
  }

  switch (condition.operator) {
    case "==":
      return compareValues(leftValue, rightValue);
    case "!=":
      return !compareValues(leftValue, rightValue);
  }
}

function processOperand(
  operand: ASTConditionOperand,
  variables: Record<string, VariableValue>,
): [isCertainlyValue: boolean, value: VariableValue] {
  if (operand.value in variables) {
    return [true, variables[operand.value]];
  }

  if (operand.literalValue !== undefined) {
    return [true, operand.literalValue];
  }

  return [false, operand.value]; // variable name or string value
}

function compareValues(left: VariableValue, right: VariableValue): boolean {
  return left?.toString() === right?.toString();
}
