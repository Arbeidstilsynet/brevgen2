"use server";

import { requireSession } from "@/auth";
import { getApiAccessToken } from "@/utils/api-token";
import type { GenerateDocumentRequest } from "@repo/shared-types";

const PDF_API_URL = process.env.PDF_API_URL;
const PDF_AUTH_MODE = (process.env.PDF_AUTH_MODE ?? "").toLowerCase(); //  bearer | none

const PDF_API_ENDPOINTS = {
  GENERATE: new URL("genererbrev", PDF_API_URL).toString(),
};

function validateEnvVars() {
  if (!PDF_API_URL) throw new Error("Missing PDF_API_URL environment variable");

  if (PDF_AUTH_MODE !== "bearer" && PDF_AUTH_MODE !== "none") {
    throw new Error(`Unsupported PDF_AUTH_MODE: ${PDF_AUTH_MODE}`);
  }
}

export async function sendGenerateDocument(payload: GenerateDocumentRequest) {
  await requireSession();

  validateEnvVars();

  const url = PDF_API_ENDPOINTS.GENERATE;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (PDF_AUTH_MODE === "bearer") {
    const token = await getApiAccessToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(response);
    const errorBody = await response.text();
    if (errorBody) {
      throw new Error(`Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  const base64Pdf = await response.text();
  return base64Pdf;
}
