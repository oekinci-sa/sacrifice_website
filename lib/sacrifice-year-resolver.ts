import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const NO_SACRIFICE_YEAR_ERROR = "No sacrifice year configured for tenant";

/**
 * `active_sacrifice_year` güncellenmemişse (o yıl için hiç kurbanlık yok) ama tabloda
 * daha yeni sezon satırları varsa, Hisse Al / sayım tutarsızlığını önlemek için
 * gerçek verinin olduğu en güncel yıla düşer.
 */
export async function resolveEffectiveYearWhenSettingsStale(
  tenantId: string,
  configuredYear: number
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_id", { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", configuredYear)
    .limit(0);

  if (error) {
    return configuredYear;
  }
  if ((count ?? 0) > 0) {
    return configuredYear;
  }

  const { data } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_year")
    .eq("tenant_id", tenantId);
  const years = Array.from(new Set((data ?? []).map((r) => r.sacrifice_year))).sort(
    (a, b) => b - a
  );
  const latest = years[0];
  if (latest == null) {
    return configuredYear;
  }
  return latest;
}

/**
 * Public sayfalar için tenant'a özgü yıl çözümlemesi.
 * 1. yearParam varsa onu kullan
 * 2. tenant_settings.active_sacrifice_year (o yıl için kurbanlık yoksa veriye göre düzeltme)
 * 3. sacrifice_animals MAX(sacrifice_year)
 * Yıl bulunamazsa hata fırlatır (fallback yok).
 */
export async function resolveSacrificeYearForTenant(
  tenantId: string,
  yearParam: string | null
): Promise<number> {
  if (yearParam && !Number.isNaN(parseInt(yearParam, 10))) {
    return parseInt(yearParam, 10);
  }

  const { data: settings } = await supabaseAdmin
    .from("tenant_settings")
    .select("active_sacrifice_year")
    .eq("tenant_id", tenantId)
    .single();

  if (settings?.active_sacrifice_year != null) {
    return resolveEffectiveYearWhenSettingsStale(tenantId, settings.active_sacrifice_year);
  }

  const { data } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_year")
    .eq("tenant_id", tenantId);
  const years = Array.from(new Set((data ?? []).map((r) => r.sacrifice_year))).sort(
    (a, b) => b - a
  );
  const latestYear = years[0];
  if (latestYear == null) {
    throw new Error(NO_SACRIFICE_YEAR_ERROR);
  }
  return latestYear;
}
