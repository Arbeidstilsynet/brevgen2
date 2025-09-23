import { getServerSession } from "next-auth";
import { authOptions } from "./pages/api/auth/[...nextauth]";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Failed to obtain session");
  return session;
}
