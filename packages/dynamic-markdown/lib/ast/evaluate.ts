import { ASTNode, buildAST } from "./build";
import { tokenize } from "./tokenize";

const VALID_OPERATORS = ["==", "!="];

export function evaluateAST(
  ast: ASTNode[],
  variables: Record<string, string | number | boolean>,
): string {
  let result = "";

  for (const node of ast) {
    if (node.type === "md") {
      result += node.value;
    } else if (node.type === "if") {
      if (evaluateCondition(node.value!, variables, node.line)) {
        result += evaluateAST(node.children!, variables);
      }
    } else if (node.type === "var") {
      result += processVariable(node.value!, variables, node.line);
    } else {
      throw new TypeError(`Unsupported node type: ${node.type} at line ${node.line}`);
    }
  }

  return result;
}

function processVariable(
  variableName: string,
  variables: Record<string, string | number | boolean>,
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
    throw new Error(`Undefined variable: ${variableName} at line ${line}`);
  }
}

function evaluateCondition(
  condition: string,
  variables: Record<string, string | number | boolean>,
  line: number,
): boolean {
  const { leftOperand, operator, rightOperand } = parseCondition(condition);

  if (!VALID_OPERATORS.includes(operator)) {
    throw new Error(`Unsupported operator: ${operator} at line ${line}`);
  }

  const [leftIsCertainlyValue, leftValue] = processOperand(leftOperand, variables);
  const [rightIsCertainlyValue, rightValue] = processOperand(rightOperand, variables);

  if (!leftIsCertainlyValue && !rightIsCertainlyValue) {
    throw new Error(`Undefined variables: ${leftOperand}, ${rightOperand} at line ${line}`);
  }

  switch (operator) {
    case "==":
      return compareValues(leftValue, rightValue);
    case "!=":
      return !compareValues(leftValue, rightValue);
    default:
      throw new Error(`Unsupported operator: ${operator} at line ${line}`);
  }
}

function parseCondition(condition: string) {
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

  i = skipWhitespace(i, length, condition);

  // Extract right operand
  let rightOperand = "";
  while (i < length) {
    rightOperand += condition[i];
    i++;
  }

  return { leftOperand, operator, rightOperand };
}

function processOperand(
  operand: string,
  variables: Record<string, string | number | boolean>,
): [isCertainlyValue: boolean, value: string | number | boolean] {
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

function compareValues(left: string | number | boolean, right: string | number | boolean): boolean {
  return left.toString() === right.toString();
}
