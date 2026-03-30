/** İletişim / footer — tenant_settings.contact_social_links (JSONB) */

export type ContactSocialLink = {
  href: string;
  /** Bootstrap Icons sınıfı, örn. "bi bi-instagram" */
  icon_name: string;
  /** İletişim sayfası ikonları için Tailwind (örn. text-pink-600); footer’da opsiyonel */
  color?: string;
};

/**
 * DB'de `color` yoksa platforma göre hex renk kodu döner.
 * Tailwind arbitrary class yerine inline style ile kullanılır.
 */
export function resolveContactSocialLinkColor(
  link: Pick<ContactSocialLink, "href" | "icon_name"> & { color?: string }
): string {
  const h = link.href.toLowerCase();
  const icon = link.icon_name.toLowerCase();

  if (h.includes("facebook") || icon.includes("facebook")) return "#1877F2";
  if (h.includes("instagram") || icon.includes("instagram")) return "#C13584";
  if (
    h.includes("twitter") ||
    h.includes("x.com") ||
    icon.includes("twitter") ||
    icon.includes("twitter-x")
  ) {
    return "#000000";
  }
  if (h.includes("youtube") || icon.includes("youtube")) return "#FF0000";
  if (h.includes("linkedin") || icon.includes("linkedin")) return "#0A66C2";
  if (h.includes("tiktok") || icon.includes("tiktok")) return "#000000";
  if (icon.includes("globe") || icon.includes("link-45")) return "#1877F2";

  return "inherit";
}

export function parseContactSocialLinks(raw: unknown): ContactSocialLink[] {
  if (!Array.isArray(raw)) return [];
  const out: ContactSocialLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const href =
      typeof o.href === "string"
        ? o.href.trim()
        : typeof o.url === "string"
          ? o.url.trim()
          : "";
    const icon_name =
      typeof o.icon_name === "string"
        ? o.icon_name.trim()
        : typeof o.iconName === "string"
          ? o.iconName.trim()
          : "";
    const color =
      typeof o.color === "string" && o.color.trim() !== ""
        ? o.color.trim()
        : undefined;
    if (!href || !icon_name) continue;
    out.push(color ? { href, icon_name, color } : { href, icon_name });
  }
  return out;
}
