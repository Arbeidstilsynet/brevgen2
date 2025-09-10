import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const tenantId = process.env.AZURE_TENANT_ID ?? "da4bf886-a8a6-450d-a806-c347b8eb8d80";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true, // https://authjs.dev/getting-started/deployment#docker
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_APPLICATION_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
});

export async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Failed to obtain session");
  return session;
}
