"use client";

import { SacrificeDataProvider } from "@/components/providers/SacrificeDataProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SacrificeDataProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
      </SacrificeDataProvider>
    </SessionProvider>
  );
} 