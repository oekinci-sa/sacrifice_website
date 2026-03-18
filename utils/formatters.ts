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

/** Ad Soyad: Her kelimenin baş harfi büyük (Türkçe uyumlu) */
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