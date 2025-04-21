"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { QueryProvider } from "./providers/QueryProvider";
import { SacrificeDataProvider } from "./providers/SacrificeDataProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <SacrificeDataProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </SacrificeDataProvider>
      </SessionProvider>
    </QueryProvider>
  );
} 