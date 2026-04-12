import { isLiveScaleSacrifice, type SacrificePricingFields } from "@/lib/live-scale-share";

type HisseFields = SacrificePricingFields & {
  share_weight?: number | string | null;
};

function formatTL(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
}

/**
 * Excel / düz metin için hisse bilgisi (UI ile uyumlu: "23 kg. - 25.000 TL" veya canlı baskül "150 kg - 300.000 TL").
 */
export function formatHisseBilgisiForExcel(sacrifice: HisseFields | null | undefined): string {
  if (!sacrifice) return "";
  if (isLiveScaleSacrifice(sacrifice)) {
    const kg = sacrifice.live_scale_total_kg;
    const total = sacrifice.live_scale_total_price;
    const kgPart = kg != null ? `${kg} kg` : "";
    const totalPart =
      total != null ? `${formatTL(Number(total))} TL` : "";
    return [kgPart, totalPart].filter(Boolean).join(" - ");
  }
  const w = sacrifice.share_weight;
  const p = sacrifice.share_price;
  if (w == null && p == null) return "";
  const weightStr = w != null ? `${w} kg.` : "";
  const priceStr = p != null ? `${formatTL(Number(p))} TL` : "";
  return [weightStr, priceStr].filter(Boolean).join(" - ");
}
