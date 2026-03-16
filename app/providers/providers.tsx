"use client";

import { SacrificeDataProvider } from "@/app/providers/SacrificeDataProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SacrificeDataProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </SacrificeDataProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 