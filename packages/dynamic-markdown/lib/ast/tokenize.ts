export type Token = {
  type: "md" | "logic" | "var";
  value: string;
  line: number;
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;

  while (i < input.length) {
    if (isStartOfDynamicSection(input, i)) {
      const { token, newIndex, newLine } = extractDynamicSection(input, i, line);
      tokens.push(token);
      i = newIndex;
      line = newLine;
    } else if (isEndOfDynamicSection(input, i)) {
      throw new TypeError(`Unclosed dynamic section at line ${line}`);
    } else {
      const { token, newIndex, newLine } = extractMarkdown(input, i, line);
      tokens.push(token);
      i = newIndex;
      line = newLine;
    }
  }

  return tokens;
}

function isStartOfDynamicSection(input: string, index: number): boolean {
  return input[index] === "{" && input[index + 1] === "{";
}

function isEndOfDynamicSection(input: string, index: number): boolean {
  return input[index] === "}" && input[index + 1] === "}";
}

function extractDynamicSection(
  input: string,
  startIndex: number,
  startLine: number,
): { token: Token; newIndex: number; newLine: number } {
  let i = startIndex + 2;
  let nestedLevel = 1;
  let line = startLine;

  while (i < input.length && nestedLevel > 0) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (char === "\n") {
      line++;
    }

    if (char === "{" && nextChar === "{") {
      nestedLevel++;
      i++;
    } else if (char === "}" && nextChar === "}") {
      nestedLevel--;
      i++;
    }

    i++;
  }

  if (nestedLevel !== 0) {
    throw new TypeError(`Unclosed dynamic section at line ${line}`);
  }

  const content = input.slice(startIndex + 2, i - 2).trim();

  return {
    token: { type: getTokenType(content), value: content, line: startLine },
    newIndex: i,
    newLine: line,
  };
}

function getTokenType(content: string) {
  if (content.toLowerCase().startsWith("if ")) {
    return "logic";
  }
  return "var";
}

function extractMarkdown(
  input: string,
  startIndex: number,
  startLine: number,
): { token: Token; newIndex: number; newLine: number } {
  let i = startIndex;
  let line = startLine;

  while (
    i < input.length &&
    !isStartOfDynamicSection(input, i) &&
    !isEndOfDynamicSection(input, i)
  ) {
    if (input[i] === "\n") {
      line++;
    }
    i++;
  }

  return {
    token: { type: "md", value: input.slice(startIndex, i), line: startLine },
    newIndex: i,
    newLine: line,
  };
}
