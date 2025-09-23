"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function AutoLogin() {
  useEffect(() => {
    // Preserve callbackUrl if user was redirected by middleware
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const callbackUrl = params.get("callbackUrl") || window.location.origin;
    void signIn("microsoft-entra-id", { callbackUrl });
  }, []);

  return null;
}
