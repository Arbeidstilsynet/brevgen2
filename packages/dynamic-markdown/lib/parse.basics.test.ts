import { expect, test } from "vitest";
import { parseDynamicMd, ParseDynamicMdOptions } from "./parse";

test("plain md unchanged", () => {
  const input = "# Hello, world!";
  expect(parseDynamicMd(input)).toEqual(input);
});

test("complex md unchanged", () => {
  const input = `   Early whitespace

# Hello, world!
  2 spaces
    Tab

## Some stuff
- List item 1
- List item 2

1. Numbered item 1
2. Numbered item 2
    a. Sub item 1
    b. Sub item 2

** Bold text **
* Italic text *
*
* [Link](https://example.com)
*
* ![Image](https://example.com/image.png)
*
* \`Code\`
*
* \`\`\`sh
* # Code block
* A=1
* echo $A
* \`\`\`
*
* > Blockquote
*
* Horizontal rule
* ---
*
* Table
* | Header A | Header B |
* |----------|----------|
* | Row 1A    | Row 1B    |
* | Row 2A    | Row 2B    |
*
* Extra whitespace
*
*
`;
  expect(parseDynamicMd(input)).toEqual(input);
});

test("only a single variable (with whitespace)", () => {
  const input = `{{ VARIABLE }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "Hello, world!",
    },
  };

  const expectedOutput = options.variables.VARIABLE;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("only a single variable (no whitespace)", () => {
  const input = `{{VARIABLE}}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "Hello, world!",
    },
  };

  const expectedOutput = options.variables.VARIABLE;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with variable", () => {
  const input = `# Test
    ## Header 2
    {{ VARIABLE }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "Hello, world!",
    },
  };

  const expectedOutput = `# Test
    ## Header 2
    Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with variable - variable content is not trimmed", () => {
  const input = `# Test
    ## Header 2
    {{ VARIABLE }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "    Hello, world!    ",
    },
  };

  const expectedOutput = `# Test
    ## Header 2
        Hello, world!${"    "}
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with multiple variables", () => {
  const input = `# {{ myHeader }}
    ## Header 2
    {{ myVar1 }}
    ### Header 3
    {{ myVar2 }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      myHeader: "Header 1",
      myVar1: "Hello, world!",
      myVar2: "Goodbye, world!",
    },
  };

  const expectedOutput = `# Header 1
    ## Header 2
    Hello, world!
    ### Header 3
    Goodbye, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with nested variables", () => {
  const input = `# Test
    {{ outer }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      outer: "Hello, {{ inner }}",
      inner: "world!",
    },
  };

  const expectedOutput = `# Test
    Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with nested variables - variable content is not trimmed", () => {
  const input = `# Test
    {{ outer }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      outer: "Hello, {{ inner }}",
      inner: "    world!    ",
    },
  };

  const expectedOutput = `# Test
    Hello,     world!${"    "}
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality true - boolean", () => {
  const input = `# Test
    {{ if isParsingFun == true :: Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `# Test
    Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality true - string", () => {
  const input = `# Test
    {{ if xyz == abc :: ## Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      xyz: "abc",
    },
  };

  const expectedOutput = `# Test
    ## Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality true - number", () => {
  const input = `# Test
    {{ if meaning == 42 :: ## Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      meaning: 42,
    },
  };

  const expectedOutput = `# Test
    ## Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality true - number-string", () => {
  const input = `# Test
    {{ if meaning == 42 :: ## Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      meaning: "42",
    },
  };

  const expectedOutput = `# Test
    ## Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality true - extra whitespace", () => {
  const input = `# Test
    {{    if  isParsingFun  ==      true  :: Hello, world!
        }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `# Test
    Hello, world!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality true - minimal whitespace", () => {
  const input = `# Test
    {{if isParsingFun == true ::Hello, world!}}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `# Test
    Hello, world!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - content is trimmed", () => {
  const input = `{{if isParsingFun == true ::    Hello, world!    }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `Hello, world!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable as second operand", () => {
  const input = `# Test
    {{ if true == isParsingFun :: Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `# Test
    Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable equality false", () => {
  const input = `# Test{{ if isParsingNotFun == true :: Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingNotFun: false,
    },
  };

  const expectedOutput = `# Test
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - variable inequality condition", () => {
  const input = `{{ if isParsingFun != false :: Hello, world! }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `Hello, world!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with nested logic", () => {
  const nested = "{{ if Emperor == Sheev :: Hello, galaxy! }}";
  const input = `{{ if Capital == Coruscant :: ${nested} }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      Capital: "Coruscant",
      Emperor: "Sheev",
    },
  };

  const expectedOutput = `Hello, galaxy!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with nested logic through variable", () => {
  const nested = "{{ if Emperor == Sheev :: Hello, galaxy! }}";
  const input = `{{ if Capital == Coruscant :: {{ NestedLogic }} }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      Capital: "Coruscant",
      Emperor: "Sheev",
      NestedLogic: nested,
    },
  };

  const expectedOutput = `Hello, galaxy!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test.each(["if", "If", "IF"])("md with logic - case insensitive keyword: %s", (keyword: string) => {
  const input = `# Test
    {{ ${keyword} isParsingFun == true :: Hello, world! }}
    `;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `# Test
    Hello, world!
    `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - can use colon in return value", () => {
  const input = `{{if isParsingFun == true :: Hello : world! }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `Hello : world!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

// not supported, requires overhaul of parsing to work properly
test.skip("md with logic - can use 2x colons in return value", () => {
  const input = `{{if isParsingFun == true :: Hello :: world! }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      isParsingFun: true,
    },
  };

  const expectedOutput = `Hello :: world!`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - falsy variable - null", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: null,
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - truthy variable - boolean", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: true,
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - falsy variable - boolean", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: false,
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - truthy variable - string", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: "some string",
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - falsy variable - empty string", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: "",
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - truthy variable - number", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: 1,
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with logic - falsy variable - zero", () => {
  const input = `# Test {{ if maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: 0,
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - falsy variable - null", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: null,
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - truthy variable - boolean", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: true,
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - falsy variable - boolean", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: false,
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - truthy variable - string", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: "some string",
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - falsy variable - empty string", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: "",
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - truthy variable - number", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: 1,
    },
  };

  const expectedOutput = `# Test `;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("md with reversed logic - falsy variable - zero", () => {
  const input = `# Test {{ if !maybeTruthy :: Show stuff }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      maybeTruthy: 0,
    },
  };

  const expectedOutput = `# Test Show stuff`;
  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});
