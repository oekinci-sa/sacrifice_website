"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  isSmsAutoEventKey,
  SMS_AUTO_EVENT_WHEN_INFO,
  smsAutoEventLabel,
} from "@/lib/sms-event-keys";
import { HelpCircle } from "lucide-react";

interface SmsAutoEventHelpTooltipProps {
  eventKey: string;
}

/** Otomatik SMS kartında ayarlar yanında: üzerine gelince ne zaman / kime gider. */
export function SmsAutoEventHelpTooltip({ eventKey }: SmsAutoEventHelpTooltipProps) {
  if (!isSmsAutoEventKey(eventKey)) return null;

  const info = SMS_AUTO_EVENT_WHEN_INFO[eventKey];
  const title = smsAutoEventLabel(eventKey) ?? "Otomatik SMS";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label={`${title} — ne zaman gönderilir`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        align="start"
        className="max-w-md p-4 text-left space-y-3"
      >
        <p className="font-semibold text-base">{title}</p>
        <div className="space-y-2 text-sm leading-relaxed">
          <p>
            <span className="font-medium text-foreground">Ne zaman: </span>
            {info.when}
          </p>
          <p>
            <span className="font-medium text-foreground">Kimlere: </span>
            {info.who}
          </p>
          <p className="pt-2 border-t text-muted-foreground">
            <span className="font-medium text-foreground">Örnek: </span>
            {info.example ? (
              info.example(
                eventKey === "slaughter_approaching"
                  ? 20
                  : eventKey === "slaughter_imminent"
                    ? 3
                    : 0
              )
            ) : (
              "Bu mesaj, yukarıdaki işlem yapıldığında ilgili hissedarlara otomatik olarak gider."
            )}
            </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
