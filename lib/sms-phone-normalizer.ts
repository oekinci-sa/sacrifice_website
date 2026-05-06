/**
 * Telefon numarası normalleştirme — Bizim SMS formatı.
 *
 * Bizim SMS 10, 11 veya 12 karakter kabul eder; sistem 12 karaktere tamamlar.
 * Hedef format: 905xxxxxxxxx (12 hane, başında 0 yok, + yok)
 *
 * Kabul edilen girdi örnekleri:
 *   +90 555 123 45 67  →  905551234567
 *   +905551234567      →  905551234567
 *   90 555 123 4567    →  905551234567
 *   905551234567       →  905551234567
 *   0555 123 4567      →  905551234567
 *   05551234567        →  905551234567
 *   5551234567         →  905551234567
 */

/** Sadece rakamları döner. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Ham telefon numarasını 12 haneli Bizim SMS formatına çevirir.
 * Geçersizse `null` döner.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const digits = digitsOnly(raw.trim());

  let normalized: string;

  if (digits.startsWith("90") && digits.length === 12) {
    normalized = digits;
  } else if (digits.startsWith("0") && digits.length === 11) {
    normalized = "9" + digits;
  } else if (digits.length === 10 && digits.startsWith("5")) {
    normalized = "90" + digits;
  } else {
    return null;
  }

  // Türkiye GSM: 905[0-9]{9}
  if (!/^905\d{9}$/.test(normalized)) return null;

  return normalized;
}

/** Geçerli bir Bizim SMS telefon numarası mı? */
export function isValidPhone(raw: string | null | undefined): boolean {
  return normalizePhone(raw) !== null;
}
