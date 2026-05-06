"use client";

import { calculateSmsInfo } from "@/lib/sms-character-counter";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
}

export function SmsCharacterCounterDisplay({ text, className }: Props) {
  const info = calculateSmsInfo(text);

  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      <span>
        <span className={info.charCount > 0 ? "text-foreground font-medium" : ""}>
          {info.charCount}
        </span>{" "}
        karakter
      </span>
      <span>·</span>
      <span>
        <span className="text-foreground font-medium">{info.parts}</span> SMS boyu
        {info.parts > 1 && (
          <span className="text-amber-600 ml-1">({info.parts} kredi/alıcı)</span>
        )}
      </span>
      <span>·</span>
      <span>Kalan: {info.remainingInPart}</span>
    </div>
  );
}
