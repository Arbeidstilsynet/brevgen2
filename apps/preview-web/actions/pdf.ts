"use server";

import { HandlerGeneratePdfArgs } from "../../api/function/handler";

const PDF_API = process.env.PDF_API_URL;

function validateEnvVars() {
  if (!PDF_API) {
    throw new Error("Missing NEXT_PUBLIC_PDF_API environment variable");
  }
  if (!PDF_API.includes("localhost") && !process.env.PDF_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_PDF_API_KEY environment variable");
  }
}

const PDF_API_URLS = {
  GENERATE: new URL("genererbrev", PDF_API).toString(),
};

export async function genererPdf(payload: HandlerGeneratePdfArgs) {
  validateEnvVars();

  const API_KEY = process.env.PDF_API_KEY ?? "";
  const apiUrl = PDF_API_URLS.GENERATE;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (!apiUrl.includes("localhost")) {
    headers["x-api-key"] = API_KEY;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const base64Pdf = await response.text();
  return base64Pdf;
}
