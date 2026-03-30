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

/** Kurbanlıklar tablosu hisse bedeli hücresi ile aynı tipografi (içerik) */
const cellTextBase = "text-xs sm:text-sm leading-snug tabular-nums";

/** Tablo sütunları: ortalı; detay kartı: `align="left"` */
export function AdminSacrificeHisseBedeliCell({
  sacrifice,
  className,
  align = "center",
}: {
  sacrifice?: AdminSacrificeHisseBedeliFields | null;
  className?: string;
  align?: "center" | "left";
}) {
  const alignFixed = align === "left" ? "text-left" : "text-center";
  const alignLive =
    align === "left"
      ? "items-start text-left"
      : "items-center text-center";

  if (!sacrifice) {
    return (
      <span className={cn(cellTextBase, alignFixed, "block w-full", className)}>
        -
      </span>
    );
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
          "flex flex-col gap-0.5 max-w-[min(100%,22rem)] w-full",
          align === "center" && "mx-auto",
          cellTextBase,
          alignLive,
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
    return (
      <span className={cn(cellTextBase, alignFixed, "block w-full", className)}>
        -
      </span>
    );
  }
  const weightStr = w != null ? `${w} kg.` : "";
  const priceStr =
    p != null
      ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(p)} TL`
      : "";
  return (
    <span className={cn(cellTextBase, alignFixed, "block w-full", className)}>
      {[weightStr, priceStr].filter(Boolean).join(" - ")}
    </span>
  );
}

/**
 * Tablo sütunları: kurbanlıklar sayfasındaki hisse bedeli hücresi ile aynı dikey hizalama ve ortalama.
 * (Düzenleme kalemi yok; px-7 pr-9 yok.)
 */
export function AdminSacrificeHisseBedeliTableCell({
  sacrifice,
}: {
  sacrifice?: AdminSacrificeHisseBedeliFields | null;
}) {
  return (
    <div className="w-full min-h-[2.5rem] flex items-center justify-center px-1">
      <div className="w-full max-w-full whitespace-normal">
        <AdminSacrificeHisseBedeliCell sacrifice={sacrifice} align="center" />
      </div>
    </div>
  );
}
