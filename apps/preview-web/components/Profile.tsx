"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { ActionButton } from "./buttons";
import { Spinner } from "./spinner";

export function Profile() {
  const { data: session, status } = useSession();

  // Optional: while loading, render nothing (or a spinner if desired)
  if (status === "loading") return <Spinner />;

  // Not signed in: show Sign in button
  if (!session?.user) {
    return (
      <ActionButton
        onClick={() => {
          sessionStorage.removeItem("manual-logout");
          void signIn("microsoft-entra-id");
        }}
        size="sm"
      >
        Login
      </ActionButton>
    );
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <div className="relative group">
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        aria-haspopup="menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <span className="text-sm">{initials}</span>
        )}
      </button>

      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10">
        <div className="p-4 border-b border-gray-100">
          <p className="font-medium text-gray-900 truncate">{user.name}</p>
          <p className="text-sm text-gray-600 truncate">{user.email}</p>
        </div>
        <div className="p-2">
          <button
            onClick={() => {
              sessionStorage.setItem("manual-logout", "1");
              void signOut();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
