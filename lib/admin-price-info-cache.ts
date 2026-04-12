/**
 * Admin tablolarda her satırdaki hücre aynı `/api/price-info` çağrısını tekrarlamasın diye
 * yıl bazlı tek istek + paylaşılan önbellek (in-flight dedupe).
 */

import { getDefaultPriceInfoByTenant } from "@/lib/price-info-by-tenant";

export type AdminPriceOptionRow = { kg: number; price: number };

const resolved = new Map<string, AdminPriceOptionRow[]>();
const inflight = new Map<string, Promise<AdminPriceOptionRow[]>>();

function cacheKey(year: number | null): string {
  return year != null ? `y:${year}` : "y:default";
}

function defaultRowsFromTenant(logoSlug: string): AdminPriceOptionRow[] {
  return getDefaultPriceInfoByTenant(logoSlug).map((p) => ({
    kg: parseFloat(p.kg.replace(/[^\d.]/g, "")),
    price: parseInt(p.price.replace(/\./g, ""), 10),
  }));
}

/**
 * Aynı `year` için eşzamanlı çağrılar tek fetch ile birleşir; sonuç bellekte tutulur.
 */
export function loadAdminPriceInfoOptions(
  year: number | null,
  logoSlug: string
): Promise<AdminPriceOptionRow[]> {
  const k = cacheKey(year);
  const hit = resolved.get(k);
  if (hit) return Promise.resolve(hit);

  const existing = inflight.get(k);
  if (existing) return existing;

  const p = (async (): Promise<AdminPriceOptionRow[]> => {
    try {
      const url = year != null ? `/api/price-info?year=${year}` : "/api/price-info";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: { kg: number; price: number }) => ({
            kg: d.kg,
            price: d.price,
          }));
          resolved.set(k, mapped);
          return mapped;
        }
      }
    } catch {
      // API yok / hata → tenant varsayılanı
    }
    const fb = defaultRowsFromTenant(logoSlug);
    resolved.set(k, fb);
    return fb;
  })();

  inflight.set(k, p);
  return p.finally(() => {
    inflight.delete(k);
  });
}
