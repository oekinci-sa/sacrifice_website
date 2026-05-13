/**
 * Otomatik "SMS Gönderimi — tarih/saat" başlıklarında, üst satırda tarih zaten varken
 * tekrar göstermemek için görünür başlığı kısaltır.
 */
export function shortenSmsSendDisplayTitle(full: string | null | undefined): string {
  const t = (full ?? "").trim();
  if (!t) return "Gönderim";
  const m = /^(.+?)(\s+[—\-]\s+)(\d{1,2}[./]\d{1,2}[./]\d{2,4}\b)/.exec(t);
  if (m) return m[1].trim();
  return t;
}
