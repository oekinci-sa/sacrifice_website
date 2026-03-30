"use client";

import { isLiveScaleSacrifice } from "@/lib/live-scale-share";
import { cn } from "@/lib/utils";

/** Hisse bedeli hücresi için yeterli alanlar (liste satırı / nested sacrifice) */
export type AdminSacrificeHisseBedeliFields = {
  pricing_mode?: string | null;
  share_weight?: number | string | null;
  share_price?: number | null;
  live_scale_total_kg?: number | null;
  live_scale_total_price?: number | null;
};

/** Admin tablolarında (kurbanlıklar, hissedarlar, ödemeler) hisse bedeli sütunu — kurbanlıklar sayfasıyla aynı mantık */
export function AdminSacrificeHisseBedeliCell({
  sacrifice,
  className,
}: {
  sacrifice?: AdminSacrificeHisseBedeliFields | null;
  className?: string;
}) {
  if (!sacrifice) {
    return <span className={cn("tabular-nums", className)}>-</span>;
  }
  if (isLiveScaleSacrifice(sacrifice)) {
    const kg = sacrifice.live_scale_total_kg;
    const total = sacrifice.live_scale_total_price;
    const kgPart = kg != null ? `${kg} kg` : null;
    const totalPart =
      total != null
        ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Number(total))} TL`
        : null;
    const sub = [kgPart, totalPart].filter(Boolean).join(" · ");
    return (
      <div
        className={cn(
          "flex flex-col gap-0.5 text-xs leading-snug max-w-[min(100%,22rem)] items-start",
          className
        )}
      >
        <span className="font-medium">Canlı baskül</span>
        {sub ? (
          <span className="text-muted-foreground tabular-nums whitespace-normal">
            {sub}
          </span>
        ) : null}
      </div>
    );
  }

  const w = sacrifice.share_weight;
  const p = sacrifice.share_price;
  if (w == null && p == null) {
    return <span className={cn("tabular-nums", className)}>-</span>;
  }
  const weightStr = w != null ? `${w} kg.` : "";
  const priceStr =
    p != null
      ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(p)} TL`
      : "";
  return (
    <span className={cn("tabular-nums", className)}>
      {[weightStr, priceStr].filter(Boolean).join(" - ")}
    </span>
  );
}
