import { ASTNode, parseLogicToken } from "./build";
import { Token, tokenize } from "./tokenize";

export function findMdVariables(input: string): Set<string> {
  const tokens = tokenize(input);
  const variables = new Set<string>();

  extractVariablesFromTokens(variables, tokens);
  return variables;
}

function extractVariablesFromTokens(variables: Set<string>, tokens: Token[]) {
  for (const token of tokens) {
    if (token.type === "var") {
      variables.add(token.value);
    } else if (token.type === "logic") {
      const { value, children } = parseLogicToken(token);
      extractVariablesFromCondition(variables, value);
      if (children) {
        extractVariablesFromASTNodes(variables, children);
      }
    }
  }
}

function extractVariablesFromASTNodes(variables: Set<string>, nodes: ASTNode[]) {
  for (const node of nodes) {
    if (node.type === "var") {
      variables.add(node.value);
    } else if (node.type === "if" && node.value) {
      extractVariablesFromCondition(variables, node.value);
      if (node.children) {
        extractVariablesFromASTNodes(variables, node.children);
      }
    }
  }
}

function extractVariablesFromCondition(variables: Set<string>, condition: string) {
  const conditionParts = condition.split(/\s+/);
  for (const part of conditionParts) {
    if (!["if", "==", "!=", "true", "false"].includes(part.toLowerCase()) && isNaN(Number(part))) {
      variables.add(part);
    }
  }
}
