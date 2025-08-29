"use server";

import * as msal from "@azure/msal-node";
import type { GenerateDocumentRequest } from "@repo/shared-types";

const PDF_API_URL = process.env.PDF_API_URL;
const PDF_API_KEY = process.env.PDF_API_KEY;
const PDF_AUTH_MODE = (process.env.PDF_AUTH_MODE ?? "").toLowerCase(); //  bearer | apikey | none

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID ?? "da4bf886-a8a6-450d-a806-c347b8eb8d80";
const AZURE_APPLICATION_ID = process.env.AZURE_APPLICATION_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SCOPE = process.env.AZURE_SCOPE ?? `api://${AZURE_APPLICATION_ID}/.default`;
const AZURE_AUTHORITY = `https://login.microsoftonline.com/${AZURE_TENANT_ID}`;

const PDF_API_ENDPOINTS = {
  GENERATE: new URL("genererbrev", PDF_API_URL).toString(),
};

function validateEnvVars() {
  if (!PDF_API_URL) throw new Error("Missing PDF_API_URL environment variable");

  if (PDF_AUTH_MODE === "bearer") {
    if (!AZURE_TENANT_ID) {
      throw new Error("Missing AZURE_TENANT_ID environment variable for bearer mode");
    }
    if (!AZURE_APPLICATION_ID) {
      throw new Error("Missing AZURE_CLIENT_ID environment variable for bearer mode");
    }
    if (!AZURE_CLIENT_SECRET) {
      throw new Error("Missing AZURE_CLIENT_SECRET environment variable for bearer mode");
    }
  } else if (PDF_AUTH_MODE === "apikey") {
    if (!PDF_API_URL.includes("localhost") && !PDF_API_KEY) {
      throw new Error("Missing PDF_API_KEY environment variable for apikey mode");
    }
  } else if (PDF_AUTH_MODE !== "none") {
    throw new Error(`Unsupported PDF_AUTH_MODE: ${PDF_AUTH_MODE}`);
  }
}

function getMsalClient(): msal.ConfidentialClientApplication {
  return new msal.ConfidentialClientApplication({
    auth: {
      authority: AZURE_AUTHORITY,
      clientId: AZURE_APPLICATION_ID!,
      clientSecret: AZURE_CLIENT_SECRET!,
    },
  });
}

export async function sendGenerateDocument(payload: GenerateDocumentRequest) {
  validateEnvVars();

  const url = PDF_API_ENDPOINTS.GENERATE;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (PDF_AUTH_MODE === "bearer") {
    const client = getMsalClient();
    const result = await client.acquireTokenByClientCredential({ scopes: [AZURE_SCOPE] });
    const token = result?.accessToken;
    if (!token) throw new Error("Failed to obtain access token");
    headers.Authorization = `Bearer ${token}`;
  }
  if (PDF_AUTH_MODE === "apikey") {
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
