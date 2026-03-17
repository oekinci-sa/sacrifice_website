/**
 * Tenant'a özgü hisse ağırlık/fiyat seçenekleri.
 * /api/price-info boş dönerse (yeni tenant, henüz kurbanlık yok) bu varsayılanlar kullanılır.
 */

export type PriceInfoItem = { kg: string; price: string };

/** Ankara Kurban (IMH) - constants/index.js ile uyumlu */
const ANKARA_PRICE_INFO: PriceInfoItem[] = [
  { kg: "23 kg", price: "20.000" },
  { kg: "26 kg", price: "22.000" },
  { kg: "30 kg", price: "24.000" },
  { kg: "34 kg", price: "26.000" },
  { kg: "38 kg", price: "28.000" },
  { kg: "42 kg", price: "30.000" },
  { kg: "46 kg", price: "32.000" },
  { kg: "50 kg", price: "34.000" },
];

/** Elya Hayvancılık (Gölbaşı) - features.md hisse fiyat skalası */
const ELYA_PRICE_INFO: PriceInfoItem[] = [
  { kg: "23 kg", price: "25.000" },
  { kg: "25 kg", price: "26.500" },
  { kg: "28 kg", price: "29.500" },
  { kg: "32 kg", price: "34.000" },
  { kg: "35 kg", price: "37.000" },
  { kg: "37 kg", price: "39.500" },
  { kg: "39 kg", price: "41.500" },
  { kg: "43 kg", price: "45.000" },
  { kg: "46 kg", price: "48.500" },
  { kg: "50 kg", price: "51.000" },
];

export function getDefaultPriceInfoByTenant(logoSlug: string): PriceInfoItem[] {
  if (logoSlug === "elya-hayvancilik") return ELYA_PRICE_INFO;
  return ANKARA_PRICE_INFO;
}
