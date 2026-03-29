/**
 * Giden HTML e-postalarda site ile uyum için Instrument Sans + güvenli sistem yedekleri.
 * Birçok istemci web fontu yüklemez; yedek yığın her zaman devreye girer.
 */
export const EMAIL_FONT_FAMILY_INSTRUMENT_STACK =
  "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

/** `<head>` içine — purchase confirmation vb. şablonlarda kullanın */
export const EMAIL_INSTRUMENT_SANS_HEAD_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />`;

/**
 * Admin panelden giden basit HTML gövdeleri: tam belge + Instrument Sans.
 * `bodyInnerHtml` sunucuda sanitize edilmiş olmalıdır.
 */
export function buildInstrumentSansEmailDocument(bodyInnerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${EMAIL_INSTRUMENT_SANS_HEAD_LINKS}
<style type="text/css">
  body, table, td, p, a, li, span, strong, em, h1, h2, h3, h4 { font-family: ${EMAIL_FONT_FAMILY_INSTRUMENT_STACK}; }
</style>
</head>
<body style="margin:0;padding:20px 16px;background-color:#f9fafb;font-family:${EMAIL_FONT_FAMILY_INSTRUMENT_STACK};line-height:1.5;color:#111827;">
${bodyInnerHtml}
</body>
</html>`;
}
