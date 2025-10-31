import { tenantId } from "@/auth";
import { ConfidentialClientApplication, type Configuration } from "@azure/msal-node";
import "server-only";

const clientId = process.env.AZURE_APPLICATION_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;

const config: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret,
  },
};

const app = new ConfidentialClientApplication(config);

export async function getApiAccessToken(): Promise<string> {
  const result = await app.acquireTokenByClientCredential({
    scopes: [`api://${clientId}/.default`],
  });
  if (!result?.accessToken) {
    throw new Error("Failed to acquire access token");
  }
  return result.accessToken;
}
