import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auto-signin", // Redirect here if not authenticated
  },
});

// Apply middleware to all routes except for static files and auth API
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - auth routes
     * - static files (_next, images, etc.)
     * - favicon or root if desired
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|api/health|auto-signin).*)",
  ],
};
