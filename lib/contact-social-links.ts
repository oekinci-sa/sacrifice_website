/** İletişim / footer — tenant_settings.contact_social_links (JSONB) */

export type ContactSocialLink = {
  href: string;
  /** Bootstrap Icons sınıfı, örn. "bi bi-instagram" */
  icon_name: string;
  /** İletişim sayfası ikonları için Tailwind (örn. text-pink-600); footer’da opsiyonel */
  color?: string;
};

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
