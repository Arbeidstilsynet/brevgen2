export class DynamicMarkdownParseError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "DynamicMarkdownParseError";
  }

  static invalidSection(section: string, line: number): DynamicMarkdownParseError {
    return new DynamicMarkdownParseError(
      `Invalid dynamic section format at line ${line}: ${section}`,
    );
  }

  static unclosedSection(line: number): DynamicMarkdownParseError {
    return new DynamicMarkdownParseError(`Unclosed dynamic section at line ${line}`);
  }

  static undefinedVariable(variableName: string, line: number): DynamicMarkdownParseError {
    return new DynamicMarkdownParseError(`Undefined variable at line ${line}: ${variableName}`);
  }

  static undefinedVariables(variables: string[], line: number): DynamicMarkdownParseError {
    return new DynamicMarkdownParseError(
      `Undefined variables at line ${line}: ${variables.join(", ")}`,
    );
  }

  static unsupportedOperator(operator: string, line: number): DynamicMarkdownParseError {
    return new DynamicMarkdownParseError(`Unsupported operator at line ${line}: ${operator}`);
  }
}
