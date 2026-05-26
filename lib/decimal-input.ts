/** Kullanıcı girişinde virgülü noktaya çevirir (43,5 → 43.5). */
export function normalizeDecimalInput(value: string): string {
  return value.replace(/,/g, ".");
}

/** API / form: string veya number; virgül veya nokta ondalık ayırıcı kabul edilir. */
export function parseDecimalInput(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const normalized = normalizeDecimalInput(String(value).trim());
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
