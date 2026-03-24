"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function AutoSignin() {
  useEffect(() => {
    // Preserve callbackUrl if user was redirected by middleware
    const params = new URLSearchParams(globalThis.location.search);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const callbackUrl = params.get("callbackUrl") || globalThis.location.origin;
    void signIn("azure-ad", { callbackUrl });
  }, []);

  return null;
}
