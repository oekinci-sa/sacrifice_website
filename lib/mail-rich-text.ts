import DOMPurify from "isomorphic-dompurify";

const PURIFY_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "del",
    "strike",
    "ul",
    "ol",
    "li",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "a",
    "hr",
    "pre",
    "code",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

/**
 * TipTap / WYSIWYG çıktısını e-posta HTML’ine sarar ve temizler.
 */
export function mailBodyEditorHtmlToEmailHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>") {
    return "<p></p>";
  }
  const safe = DOMPurify.sanitize(trimmed, PURIFY_CONFIG);
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5">${safe}</div>`;
}

/** E-postanın düz metin alternatifi (HTML etiketleri gösterilmez). */
export function htmlToPlainTextForEmail(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
