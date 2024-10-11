"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  // feil med types: Type 'bigint' is not assignable to type 'ReactNode'
  return <QueryClientProvider client={queryClient}>{children as any}</QueryClientProvider>;
}
