import { expect, test } from "vitest";
import { parseDynamicMd, ParseDynamicMdOptions } from ".";
import { DynamicMarkdownParseError } from "./ast/error";
import { RESERVED_NAMES } from "./parse";

test.each([...RESERVED_NAMES, ...RESERVED_NAMES.map((r) => r.toUpperCase())])(
  "reserved variable name %s throws",
  (name) => {
    const options: ParseDynamicMdOptions = {
      variables: {
        [name]: "value",
      },
    };

    expect(() => parseDynamicMd("", options)).toThrow(
      new DynamicMarkdownParseError(`Variable name ${name} is reserved`),
    );
  },
);

test("undefined variable throws (simple)", () => {
  const input = `{{ myVar }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Undefined variable at line 1: myVar"),
  );
});

test("undefined variable throws (nested)", () => {
  const input = `{{ myVar }}`;
  expect(() =>
    parseDynamicMd(input, {
      variables: {
        myVar: "{{ myVarInner }}",
      },
    }),
  ).toThrow(new DynamicMarkdownParseError("Undefined variable at line 1: myVarInner"));
});

test("empty logic content throws", () => {
  const input = `{{ if name == Nils ::}}`;
  expect(() =>
    parseDynamicMd(input, {
      variables: {
        name: "Nils",
      },
    }),
  ).toThrow(
    new DynamicMarkdownParseError("Invalid dynamic section format at line 1: if name == Nils ::"),
  );
});

test("empty logic content throws (with whitespace)", () => {
  const input = `{{ if name == Nils ::    }}`;
  expect(() =>
    parseDynamicMd(input, {
      variables: {
        name: "Nils",
      },
    }),
  ).toThrow(
    new DynamicMarkdownParseError("Invalid dynamic section format at line 1: if name == Nils ::"),
  );
});

// determining if it's a string or missing variable is hard to do while supporting nesting
// for now it will just fail silently and not insert the logic block value
// oxlint-disable-next-line jest/no-disabled-tests
test.skip("undefined variable throws (logic condition, left operand)", () => {
  const input = `{{ if myVar == true :: Hello, world! }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Undefined variable: myVar"),
  );
});
// oxlint-disable-next-line jest/no-disabled-tests
test.skip("undefined variable throws (logic condition, right operand)", () => {
  const input = `{{ if true == myVar :: Hello, world! }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Undefined variable: myVar"),
  );
});

test("undefined variable throws (logic condition, both operands)", () => {
  const input = `{{ if myVar == myVar2 :: Hello, world! }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Undefined variables at line 1: myVar, myVar2"),
  );
});

test("undefined variable throws (logic condition, truthyness)", () => {
  const input = `{{ if myVar :: Hello, world! }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Undefined variable at line 1: myVar"),
  );
});

test("missing end brackets throws (simple)", () => {
  const input = `{{`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("missing end brackets throws (moderate)", () => {
  const input = `{{ Lorem }}#Header{{ Ipsum`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("missing end brackets throws (nested)", () => {
  const input = `{{ Lorem }}#123{{ Ipsum {{ Dorem }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("missing end brackets throws (nested multiline)", () => {
  const input = `{{ Lorem }}
    #123
    {{ Ipsum {{ Dorem
    }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 4"),
  );
});

test("missing brackets throws (complex)", () => {
  const input = `
# Complex Document

{{ if level1 == true ::
## Level 1
This is the first level.
{{ if level2 == true ::
### Level 2
This is the second level.
{{ if level3 == true ::
#### Level 3
This is the third level.
The message is: {{ message
}}
}}
}}

## Summary
This document demonstrates a complex structure with missing brackets.
`;

  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 20"),
  );
});

test("missing start brackets throws (simple)", () => {
  const input = `}}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("missing start brackets throws (moderate)", () => {
  const input = `{{ Lorem }}#Header Ipsum }}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("missing start brackets throws (nested)", () => {
  const input = `{{ Lorem }}#123{{ Ipsum  Dorem }}}}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("missing start brackets throws (nested multiline)", () => {
  const input = `{{ Lorem }}
    #123
    {{ Ipsum Dorem
    }}}}`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 4"),
  );
});

test("unfinished logic throws (simple)", () => {
  const input = `{{ if`;
  expect(() => parseDynamicMd(input)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("unfinished logic throws (no operator)", () => {
  const input = `{{ if VARIABLE }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow("Invalid dynamic section");
});

test("unfinished logic throws (only one operand)", () => {
  const input = `{{ if VARIABLE == }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow("Invalid dynamic section");
});

test("unfinished logic throws (missing ::)", () => {
  const input = `{{ if VARIABLE == true }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow("Invalid dynamic section");
});

test("unfinished logic throws (single :)", () => {
  const input = `{{ if VARIABLE == true : # Hello, world! }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow("Invalid dynamic section format");
});

test("unfinished logic throws (missing end brackets)", () => {
  const input = `{{ if VARIABLE == true :: `;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("unfinished logic throws (missing start brackets)", () => {
  const input = `if VARIABLE == true :: }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("unfinished logic throws (nested)", () => {
  const input = `{{ if VARIABLE == true :: # Header {{ if VARIABLE == true :: 123 }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow(
    new DynamicMarkdownParseError("Unclosed dynamic section at line 1"),
  );
});

test("logic children throws with correct line number", () => {
  const input = `Lorem \n{{ if VARIABLE == value :: # #Foo\n#Bar\n{{ missingVar}} }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow(
    new DynamicMarkdownParseError("Undefined variable at line 4: missingVar"),
  );
});

test.each(["=", "!!", "+", "++", "===", "!==", "-", "--", "?????"])(
  "invalid logic operator throws (%s)",
  (invalidOperator) => {
    const input = `{{ if VARIABLE ${invalidOperator} :: Hello, world! }}`;
    const options: ParseDynamicMdOptions = {
      variables: {
        VARIABLE: "value",
      },
    };
    expect(() => parseDynamicMd(input, options)).toThrow(
      new DynamicMarkdownParseError(`Unsupported operator at line 1: ${invalidOperator}`),
    );
  },
);

test.each(["::", ":::", "::::"])("invalid logic operator throws (%s)", (invalidOperator) => {
  const input = `{{ if VARIABLE ${invalidOperator} :: Hello, world! }}`;
  const options: ParseDynamicMdOptions = {
    variables: {
      VARIABLE: "value",
    },
  };
  expect(() => parseDynamicMd(input, options)).toThrow("Invalid dynamic section format");
});
