"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SacrificeDataProvider } from "./providers/SacrificeDataProvider";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SacrificeDataProvider>
          {children}
        </SacrificeDataProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
} 