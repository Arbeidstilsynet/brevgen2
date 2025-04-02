import type { GenerateDocumentRequest } from "@repo/shared-types";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { logger } from "../app";
import { handlerGenerateDocument, ValidationError } from "../lib/handler";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type, x-api-key",
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (process.env.NODE_ENV !== "test") {
    logger.info(event);
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    if (!event.body) {
      throw new TypeError("Missing body");
    }

    const body = JSON.parse(event.body) as GenerateDocumentRequest;

    const result = await handlerGenerateDocument(body);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: result,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      logger.error(err);
    }
    if (err instanceof ValidationError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Validation error",
          error: err.message,
          details: err.details,
        }),
      };
    }
    if (err instanceof TypeError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Invalid input",
          error: err.message,
        }),
      };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    };
  }
};
