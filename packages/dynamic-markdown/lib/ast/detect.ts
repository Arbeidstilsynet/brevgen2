import { buildAST, type ASTCondition, type ASTConditionOperand, type ASTNode } from "./build";
import { tokenize } from "./tokenize";

export function findMdVariables(input: string): Set<string> {
  const tokens = tokenize(input);
  const ast = buildAST(tokens);
  return findASTVariables(ast);
}

export function findASTVariables(nodes: ASTNode[]): Set<string> {
  const variables = new Set<string>();
  extractVariablesFromASTNodes(variables, nodes);
  return variables;
}

function extractVariablesFromASTNodes(variables: Set<string>, nodes: ASTNode[]): void {
  for (const node of nodes) {
    if (node.type === "var") {
      variables.add(node.value);
    } else if (node.type === "if") {
      extractVariablesFromCondition(variables, node.condition);
      extractVariablesFromASTNodes(variables, node.children);
    }
  }
}

function extractVariablesFromCondition(variables: Set<string>, condition: ASTCondition): void {
  if (condition.type === "truthy") {
    addVariableCandidate(variables, condition.operand);
    return;
  }

  addVariableCandidate(variables, condition.leftOperand);
  addVariableCandidate(variables, condition.rightOperand);
}

function addVariableCandidate(variables: Set<string>, operand: ASTConditionOperand): void {
  if (operand.literalValue !== undefined) {
    return;
  }

  const variableName = operand.value.startsWith("!") ? operand.value.slice(1) : operand.value;
  if (variableName) {
    variables.add(variableName);
  }
}
