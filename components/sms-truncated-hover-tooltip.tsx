"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tooltipSurface =
  "max-w-sm whitespace-pre-wrap break-words px-3 py-2 text-sm shadow-md font-normal";

function triggerSpanClass(extra?: string): string {
  return [
    "block min-w-0 w-full cursor-default rounded-sm outline-offset-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function SmsTruncatedHoverTip({
  fullText,
  children,
}: {
  fullText: string;
  children: React.ReactNode;
}) {
  const trimmed = fullText.trim();
  if (!trimmed || trimmed === "—") {
    return <>{children}</>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={triggerSpanClass()}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className={tooltipSurface}>
        {trimmed}
      </TooltipContent>
    </Tooltip>
  );
}

/** Tek satır kısaltılmış metin için shadcn tooltip */
export function SmsTruncatedInlineTip({
  fullText,
  display,
}: {
  fullText: string;
  display: string;
}) {
  const trimmed = fullText.trim();
  if (!trimmed || trimmed === "-" || display === "-") {
    return <>{display}</>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={triggerSpanClass("truncate")}>
          {display}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className={tooltipSurface}>
        {trimmed}
      </TooltipContent>
    </Tooltip>
  );
}
