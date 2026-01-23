import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authDisabled = process.env.DANGEROUS_DISABLE_AUTH === "true";

const authMiddleware = withAuth({
  pages: {
    signIn: "/auto-signin",
  },
});

export default function proxy(req: NextRequest) {
  if (authDisabled) {
    return NextResponse.next();
  }
  // @ts-expect-error - withAuth types expect 2nd argument NextFetchEvent but Next 16 proxy only receives request
  return authMiddleware(req);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|api/health|auto-signin).*)"],
};
