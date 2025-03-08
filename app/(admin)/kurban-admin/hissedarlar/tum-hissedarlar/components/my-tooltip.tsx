"use client"

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MyTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  showArrow?: boolean;
}

export default function MyTooltip({ children, content, showArrow = true }: MyTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          className="bg-black/90 text-white px-3 py-2 text-sm" 
          showArrow={showArrow}
          sideOffset={5}
        >
          {content}
          <style jsx global>{`
            .tooltip-arrow {
              fill: #000000; /* slate-800 rengi */
            }
          `}</style>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
