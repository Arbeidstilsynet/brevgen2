"use server";

import type { HandlerGeneratePdfArgs } from "../../api/lib/handler";

const PDF_API_URL = process.env.PDF_API_URL;
const PDF_API_KEY = process.env.PDF_API_KEY;

function validateEnvVars() {
  if (!PDF_API_URL) {
    throw new Error("Missing NEXT_PUBLIC_PDF_API environment variable");
  }
  if (!PDF_API_URL.includes("localhost") && !PDF_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_PDF_API_KEY environment variable");
  }
}

const PDF_API_ENDPOINTS = {
  GENERATE: new URL("genererbrev", PDF_API_URL).toString(),
};

export async function genererPdf(payload: HandlerGeneratePdfArgs) {
  validateEnvVars();

  const url = PDF_API_ENDPOINTS.GENERATE;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (!url?.includes("localhost")) {
    headers["x-api-key"] = PDF_API_KEY ?? "";
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(response);
    throw new Error(`Error: ${response.statusText}`);
  }

  const base64Pdf = await response.text();
  return base64Pdf;
}
