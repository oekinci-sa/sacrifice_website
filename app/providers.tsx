"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SacrificeDataProvider } from "./providers/SacrificeDataProvider";
import { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
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