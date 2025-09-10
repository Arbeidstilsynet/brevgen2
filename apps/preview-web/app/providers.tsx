"use client";

import { SettingsProvider } from "@/components/config/settingsProvider";
import { ToastProvider } from "@/components/toast/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient();

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={60 * 60}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </ToastProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </SessionProvider>
  );
}
