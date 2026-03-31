/**
 * Ankara Kurban (ankara-kurban) tenant — Hisse Al akışında canlı baskül kurbanlıkları için
 * DB’deki kg/tutar boş olduğunda gösterilen sabit metin (yalnızca UI; gerçek fiyat DB’den gelmez).
 */
export const ANKARA_HISSEAL_LIVE_SCALE_PLACEHOLDER_LINE = "53 kg. - 50.000 TL";

export function isAnkaraHissealLivePlaceholderTenant(
  logoSlug: string | null | undefined
): boolean {
  return logoSlug === "ankara-kurban";
}
