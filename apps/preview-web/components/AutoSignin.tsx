"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

export function AutoSignIn() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated" && !sessionStorage.getItem("manual-logout")) {
      // Silent redirect to Entra ID
      void signIn("microsoft-entra-id");
    }
  }, [status]);

  return null;
}
