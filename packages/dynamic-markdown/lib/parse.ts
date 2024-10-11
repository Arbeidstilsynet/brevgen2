import { buildAST } from "./ast/build";
import { evaluateAST } from "./ast/evaluate";
import { tokenize } from "./ast/tokenize";

export const RESERVED_NAMES = ["if", "and", "or", "else", "for"] as const;

function validateVariables(variables: Record<string, unknown>): void {
  for (const key in variables) {
    if (RESERVED_NAMES.includes(key.toLowerCase() as (typeof RESERVED_NAMES)[number])) {
      throw new Error(`Variable name ${key} is reserved`);
    }
  }
}

export type ParseDynamicMdOptions = {
  variables: Record<string, string | number | boolean>;
};

export function parseDynamicMd(input: string, options?: ParseDynamicMdOptions): string {
  const { variables } = options ?? { variables: {} };

  validateVariables(variables);

  const tokens = tokenize(input);
  const ast = buildAST(tokens);
  const output = evaluateAST(ast, variables);

  return output;
}
