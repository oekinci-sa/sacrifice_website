/** Ankara Kurban admin panelinde birincil butonlar nötr (shadcn varsayılanı); diğer tenant’larda tenant rengi kullanılır. */
export const ANKARA_LOGO_SLUG = "ankara-kurban";

/**
 * Admin’de tenant renkli CTA sınıfı. Ankara için `undefined` (gri/nötr primary).
 */
export function adminPrimaryCtaClassName(logoSlug: string | undefined): string | undefined {
  return logoSlug === ANKARA_LOGO_SLUG ? undefined : "admin-tenant-accent";
}
