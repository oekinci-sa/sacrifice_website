const TR_LOCALE = "tr-TR";

/**
 * Admin arama çubuklarında büyük/küçük harf ve Türkçe İ/I/ı/i eşleşmesi için metin normalizasyonu.
 * `String#toLowerCase()` yerine `tr-TR` kullanılır; `NFKC` birleşik karakterleri sadeleştirir.
 */
export function normalizeTurkishSearchText(s: string): string {
  return s.normalize("NFKC").toLocaleLowerCase(TR_LOCALE);
}
