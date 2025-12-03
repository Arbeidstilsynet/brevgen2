import { AuthOptions, getServerSession } from "next-auth";
import AzureAdProvider from "next-auth/providers/azure-ad";

export const tenantId = process.env.AZURE_TENANT_ID ?? "da4bf886-a8a6-450d-a806-c347b8eb8d80";
const MAX_PICTURE_SIZE = 4 * 1024;

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
  callbacks: {
    jwt({ token, user, profile }) {
      if (user && profile) {
        // Copy a *safe* image value, but strip it if too large
        // workaround for "400 Request Header Or Cookie Too Large" response from nginx
        // despite increasing nginx.ingress.kubernetes.io/proxy-buffer-size
        const candidateImage = user.image ?? profile.image;
        if (candidateImage && candidateImage.length < MAX_PICTURE_SIZE) {
          token.picture = candidateImage;
        } else {
          token.picture = null;
        }
      }

      return token;
    },
  },
} as const satisfies AuthOptions;

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Failed to obtain session");
  return session;
}
