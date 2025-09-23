import NextAuth, { type AuthOptions } from "next-auth";
import AzureAdProvider from "next-auth/providers/azure-ad";

export const tenantId = process.env.AZURE_TENANT_ID ?? "da4bf886-a8a6-450d-a806-c347b8eb8d80";

export const authOptions = {
  providers: [
    AzureAdProvider({
      clientId: process.env.AZURE_APPLICATION_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
} as const satisfies AuthOptions;

export default NextAuth(authOptions);
