import { describe, expect, test } from "vitest";
import { findMdVariables } from "./detect";

describe("findVariables", () => {
  test("should find variables in a simple string", () => {
    const input = "{{ userName }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["userName"]));
  });

  test("should find multiple variables", () => {
    const input = "{{ userName }} and {{ userAge }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["userName", "userAge"]));
  });

  test("should find variables in a logic condition", () => {
    const input = "{{ if isParsingFun == true :: Hello, {{ userName }}! }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["isParsingFun", "userName"]));
  });

  test("should find truthy variable in a logic condition", () => {
    const input = "{{ if isParsingFun :: Hello, {{ userName }}! }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["isParsingFun", "userName"]));
  });

  test("should find negated truthy variable in a logic condition", () => {
    const input = "{{ if !isParsingFun :: Hello, {{ userName }}! }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["isParsingFun", "userName"]));
  });

  test("should find variables in nested logic conditions", () => {
    const input =
      "{{ if isParsingFun == true :: {{ if isUserLoggedIn == true :: Hello, {{ userName }}! }} }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["isParsingFun", "isUserLoggedIn", "userName"]));
  });

  test("should handle empty input", () => {
    const input = "";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set());
  });

  test("should ignore non-variable tokens", () => {
    const input = "Hello, world!";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set());
  });

  test("should handle duplicates", () => {
    const input = "Hello {{ userName }} and {{ userName }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["userName"]));
  });

  // not likely to ever be supported
  // oxlint-disable-next-line jest/no-disabled-tests
  test.skip("should handle unclosed logic braces", () => {
    const input = "{{ if isParsingFun == true :: Hello, {{ userName }}";
    const variables = findMdVariables(input);
    expect(variables).toEqual(new Set(["isParsingFun", "userName"]));
  });
});
