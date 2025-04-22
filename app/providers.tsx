"use client";

import StoreRealtimeProvider from "@/components/providers/StoreRealtimeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { QueryProvider } from "./providers/QueryProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <StoreRealtimeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </StoreRealtimeProvider>
      </SessionProvider>
    </QueryProvider>
  );
} 