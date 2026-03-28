/**
 * İşlem özeti / transactional e-postalarda `<img src="...">` için **HTTPS** mutlak URL.
 *
 * **Neden `data:` (base64) tek başına yetmez:** Gmail ve pek çok istemci, e-posta HTML’inde
 * `data:image/...;base64,...` kaynaklarını güvenlik nedeniyle göstermez; logo yerine kırık
 * ikon + `alt` metni görünür. Bu yüzden üretimde önce **aynı domainde barındırılan PNG**
 * kullanılır; `logoBase64.ts` yalnızca fallback (ör. yerel önizleme) içindir.
 *
 * Statik dosyalar: `public/logos/<slug>/email-logo.png` — güncellemek için:
 * `node scripts/write-email-logo-pngs.cjs`
 */

const LOGO_EMAIL_PATH_BY_SLUG: Record<string, string> = {
  "ankara-kurban": "/logos/ankara-kurban/email-logo.png",
  "elya-hayvancilik": "/logos/elya-hayvancilik/email-logo.png",
};

/** `tenant_settings.website_url` → `https://www.örnek.com.tr` (pathsız). */
function publicSiteOriginFromWebsiteUrl(websiteUrl: string | null | undefined): string | null {
  const raw = websiteUrl?.trim();
  if (!raw) return null;
  let host = raw.replace(/^https?:\/\//i, "").split("/")[0] ?? "";
  host = host.replace(/^www\./i, "");
  if (!host || /localhost|127\.0\.0\.1/i.test(host)) return null;
  return `https://www.${host}`;
}

export function getLogoAbsoluteUrlForEmail(
  logoSlug: string,
  websiteUrl?: string | null
): string {
  const path = LOGO_EMAIL_PATH_BY_SLUG[logoSlug] ?? LOGO_EMAIL_PATH_BY_SLUG["ankara-kurban"];
  const origin = publicSiteOriginFromWebsiteUrl(websiteUrl);
  if (!origin) return "";
  return `${origin}${path}`;
}
