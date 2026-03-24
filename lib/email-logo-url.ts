/**
 * E-posta istemcileri (özellikle Gmail) çoğu zaman data: URI img'lerini göstermez.
 * Public klasöründeki logoya tam HTTPS URL ile bağlanır.
 */
const LOGO_PATH_BY_SLUG: Record<string, string> = {
  "ankara-kurban": "/logos/ankara-kurban/ankara-kurban.svg",
  "elya-hayvancilik": "/logos/elya-hayvancilik/elya-hayvancilik.svg",
};

/** Satır içi yorum ve boşlukları temizler: "https://foo.com # yorum" → "https://foo.com" */
function stripInlineComment(value: string): string {
  return value.split(/\s+#/)[0].trim();
}

function resolveSiteOrigin(): string {
  const explicit = stripInlineComment(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = stripInlineComment(process.env.VERCEL_URL ?? "");
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  const nextAuth = stripInlineComment(process.env.NEXTAUTH_URL ?? "");
  if (nextAuth && nextAuth.startsWith("http")) {
    return nextAuth.replace(/\/$/, "");
  }
  return "";
}

/** E-posta <img src="..."> için mutlak URL; origin yoksa veya localhost ise boş döner (çağıran base64 fallback kullanır). */
export function getLogoAbsoluteUrlForEmail(logoSlug: string): string {
  const origin = resolveSiteOrigin();
  if (!origin) return "";
  // Localhost adresleri dış e-posta istemcilerinden erişilemez; base64 fallback'e bırak
  if (/localhost|127\.0\.0\.1/.test(origin)) return "";
  const path = LOGO_PATH_BY_SLUG[logoSlug] ?? LOGO_PATH_BY_SLUG["ankara-kurban"];
  return `${origin}${path}`;
}
