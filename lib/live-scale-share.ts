/** Canlı baskül (live_scale) hisse mantığı — DB ile uyumlu */

export type SacrificePricingFields = {
  pricing_mode?: string | null;
  share_price?: number | null;
  live_scale_total_kg?: number | null;
  live_scale_total_price?: number | null;
};

export function isLiveScaleSacrifice(s: SacrificePricingFields | null | undefined): boolean {
  return s?.pricing_mode === "live_scale";
}

/** Toplam tutar ve hissedar sayısı varsa kişi başı (sunucu rebalance ile aynı bölüm). */
export function perShareFromLiveTotal(
  liveTotalPrice: number | null | undefined,
  shareholderCount: number
): number | null {
  if (
    liveTotalPrice == null ||
    Number.isNaN(Number(liveTotalPrice)) ||
    shareholderCount < 1
  ) {
    return null;
  }
  return Number(liveTotalPrice) / shareholderCount;
}

export function canShowLiveScaleUnitPrice(s: SacrificePricingFields | null | undefined): boolean {
  if (!isLiveScaleSacrifice(s)) return true;
  return (
    s?.live_scale_total_price != null && Number(s.live_scale_total_price) > 0
  );
}
