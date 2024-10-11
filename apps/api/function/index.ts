import type { APIGatewayProxyHandler } from "aws-lambda";
import { handlerGeneratePdf, HandlerGeneratePdfArgs } from "./handler";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type, x-api-key",
};

export const handler: APIGatewayProxyHandler = async (event) => {
  console.info(event);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    const body: HandlerGeneratePdfArgs = JSON.parse(event.body!);

    if (!("md" in body)) {
      throw new TypeError("Missing body.md");
    }

    const pdfBase64 = await handlerGeneratePdf(body);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: pdfBase64,
    };
  } catch (err) {
    console.error(err);
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
