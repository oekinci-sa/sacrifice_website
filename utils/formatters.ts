// Format phone number for database (Türkiye: her zaman +90 formatı)
export const formatPhoneForDB = (phone: string): string => {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  // 0 ile başlıyorsa kaldır (05555555555 -> 5555555555)
  const normalized = digits.startsWith("0") ? digits.slice(1) : digits;
  // 90 ile başlıyorsa + ekle, değilse +90 ekle
  if (normalized.startsWith("90") && normalized.length >= 12) {
    return `+${normalized}`;
  }
  return `+90${normalized}`;
};

// Format phone number for display with spacing (0555 555 55 55)
export const formatPhoneForDisplayWithSpacing = (phone: string): string => {
  if (!phone) return "-";

  // Convert from +905555555555 to 05555555555 format first
  const phoneFormatted = phone.startsWith("+9")
    ? `0${phone.substring(3)}`
    : phone;

  // Apply spacing: 0555 555 55 55
  return phoneFormatted.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
};

/** Telefon input'ta yazarken otomatik boşluk (0555 555 55 55) - hisse al, hissedarlar edit */
export const formatPhoneForInput = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  let formatted = numbers.startsWith("0") ? numbers : "0" + numbers;
  if (formatted.length >= 2 && formatted[1] !== "5") {
    formatted = formatted.slice(0, 1);
  }
  if (formatted.length <= 4) return formatted;
  if (formatted.length <= 7) return `${formatted.slice(0, 4)} ${formatted.slice(4)}`;
  if (formatted.length <= 9) return `${formatted.slice(0, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`;
  return `${formatted.slice(0, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7, 9)} ${formatted.slice(9, 11)}`;
};

/** Para input'ta yazarken 3 hanede bir nokta (10.000) */
export const formatCurrencyForInput = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/** formatCurrencyForInput ile formatlanmış string'i sayıya çevir */
export const parseCurrencyFromInput = (value: string): number => {
  const cleaned = value.replace(/\D/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
};

/**
 * Ad Soyad: Her kelimenin baş harfi büyük (Türkçe uyumlu).
 * Hisse al formu ve admin listelerindeki isim gösterimi için ortak kullanın.
 */
export const toTitleCase = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.charAt(0).toLocaleUpperCase("tr-TR") +
      word.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
};

/** Liste / özet ekranlarında ad-soyad gösterimi (`toTitleCase` ile aynı). */
export const formatPersonNameForDisplay = toTitleCase;

/**
 * IBAN’ı TR02 0001 0011 … şeklinde 4’erli gruplarla gösterir.
 * Boşluk içeren / IBAN olmayan açıklama metinleri (ör. “Kapora için…”) aynen döner.
 */
export function formatIbanForDisplay(iban: string): string {
  if (!iban || typeof iban !== "string") return "";
  const trimmed = iban.trim();
  const normalized = trimmed.replace(/\s+/g, "").toUpperCase();
  // TR IBAN: 26 karakter (harf+rakam); diğer ülkeler için benzer uzunluklarda da gruplama
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(normalized) || normalized.length < 15) {
    return trimmed;
  }
  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += 4) {
    chunks.push(normalized.slice(i, i + 4));
  }
  return chunks.join(" ");
}

const BR_PLACEHOLDER = "\uE000_IBAN_BR_\uE001";

/**
 * Metindeki `<br/>` / `<br>` korunarak HTML kaçışı (XSS için; dangerouslySetInnerHTML öncesi).
 */
export function escapeHtmlPreserveLineBreaks(html: string): string {
  if (!html) return "";
  const withPh = html.replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);
  return withPh
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(new RegExp(BR_PLACEHOLDER, "g"), "<br/>");
} 