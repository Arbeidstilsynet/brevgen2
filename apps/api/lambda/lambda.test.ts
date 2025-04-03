/* eslint-disable @typescript-eslint/no-empty-function */

import type { GenerateDocumentRequest } from "@repo/shared-types";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { describe, expect, test } from "vitest";
import { handler } from ".";

describe("lambda 400 errors", () => {
  test("Missing variable", async () => {
    const md = "# Hello, {{ name }}";
    const mdVariables = {};
    const payload: GenerateDocumentRequest = {
      md,
      mdVariables,
      options: {
        dynamic: {
          template: "custom",
        },
      },
    };
    const event = { body: JSON.stringify(payload) };

    const response = (await handler(
      event as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as { message: string; error: string };
    expect(body.message).toBe("Parse error");
    expect(body.error).toContain("Undefined variable");
  });

  test("Missing brackets", async () => {
    const md = "# Hello, {{ name ";
    const mdVariables = { name: "world" };
    const payload: GenerateDocumentRequest = {
      md,
      mdVariables,
      options: {
        dynamic: {
          template: "custom",
        },
      },
    };
    const event = { body: JSON.stringify(payload) };

    const response = (await handler(
      event as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as {
      message: string;
      error: string;
    };
    expect(body.message).toBe("Parse error");
    expect(body.error).toContain("Unclosed dynamic section");
  });

  test("Invalid logic", async () => {
    const md = "{{ if a + b :: # Hello, world }}";
    const mdVariables = { name: "world" };
    const payload: GenerateDocumentRequest = {
      md,
      mdVariables,
      options: {
        dynamic: {
          template: "custom",
        },
      },
    };
    const event = { body: JSON.stringify(payload) };

    const response = (await handler(
      event as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body) as {
      message: string;
      error: string;
    };
    expect(body.message).toBe("Parse error");
    expect(body.error).toContain("Unsupported operator");
  });
});
