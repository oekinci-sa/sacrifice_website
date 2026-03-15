/**
 * Aktif kurban sezonu yılı.
 * Bayramın ilk gününün düştüğü miladi yıl (örn. 2025, 2026).
 * SACRIFICE_YEAR env ile override edilebilir.
 */
export function getDefaultSacrificeYear(): number {
  const env = process.env.SACRIFICE_YEAR;
  if (env) return parseInt(env, 10);
  return new Date().getFullYear();
}
