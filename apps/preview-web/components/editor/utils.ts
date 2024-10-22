export const generateMdVarTypes = (vars: Record<string, string | boolean>) => {
  const types: Record<string, "string" | "boolean"> = {};
  for (const key in vars) {
    types[key] = typeof vars[key] as "string" | "boolean";
  }
  return types;
};
