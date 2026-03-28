import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "b", "i", "u", "s", "del", "strike",
    "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4",
    "a", "hr", "pre", "code",
  ],
  allowedAttributes: { a: ["href", "target", "rel"] },
};

/**
 * TipTap / WYSIWYG çıktısını e-posta HTML'ine sarar ve temizler.
 */
export function mailBodyEditorHtmlToEmailHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>") {
    return "<p></p>";
  }
  const safe = sanitizeHtml(trimmed, SANITIZE_OPTIONS);
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
