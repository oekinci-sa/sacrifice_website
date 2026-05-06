/**
 * Bizim SMS karakter seti ve boy hesaplama.
 *
 * Türkçe 2-slot karakterler: ğ Ğ ş Ş ı İ ç
 * Türkçe 1-slot karakterler: ü Ü ö Ö Ç
 * Boy sınırları:
 *   TR — 1 boy: 1-155 | 2: 156-292 | 3: 293-439 | 4: 440-587 | 5: 588-735 | 6: 736-882
 *   EN — 1 boy: 1-160 | 2: 161-306 | 3: 307-459 | 4: 460-612 | 5: 613-765 | 6: 766-917
 */

const TR_2SLOT = new Set(["ğ", "Ğ", "ş", "Ş", "ı", "İ", "ç"]);
const TR_1SLOT = new Set(["ü", "Ü", "ö", "Ö", "Ç"]);

/** Tüm Türkçe karakterler (dil tespiti için). */
const ALL_TR_CHARS = new Set([...Array.from(TR_2SLOT), ...Array.from(TR_1SLOT)]);

const TR_LIMITS = [155, 292, 439, 587, 735, 882] as const;
const EN_LIMITS = [160, 306, 459, 612, 765, 917] as const;

export type SmsLanguage = "TR" | "EN";

export interface SmsInfo {
  /** Sistem tarafından hesaplanan efektif karakter sayısı. */
  charCount: number;
  /** Kaç SMS boyu (1-6). */
  parts: number;
  /** Dil tespiti. */
  language: SmsLanguage;
  /** Mevcut boy içinde kalan slot. */
  remainingInPart: number;
}

/** Metni analiz edip SMS bilgilerini hesaplar. */
export function calculateSmsInfo(text: string): SmsInfo {
  if (!text) {
    return { charCount: 0, parts: 1, language: "EN", remainingInPart: 160 };
  }

  let hasTurkish = false;
  let count = 0;

  for (const ch of text) {
    if (ALL_TR_CHARS.has(ch)) hasTurkish = true;
    if (TR_2SLOT.has(ch)) {
      count += 2;
    } else {
      count += 1;
    }
  }

  const language: SmsLanguage = hasTurkish ? "TR" : "EN";
  const limits = language === "TR" ? TR_LIMITS : EN_LIMITS;
  const maxLimit = limits[limits.length - 1];

  // 6 boydan büyük metni API kesiyor; biz yine de hesaplarız
  let parts = 6;
  for (let i = 0; i < limits.length; i++) {
    if (count <= limits[i]) {
      parts = i + 1;
      break;
    }
  }

  const currentPartLimit = limits[Math.min(parts - 1, limits.length - 1)];
  const prevLimit = parts > 1 ? limits[parts - 2] : 0;
  const usedInPart = count - prevLimit;
  const partCapacity = currentPartLimit - prevLimit;
  const remainingInPart = Math.max(0, partCapacity - usedInPart);

  return {
    charCount: Math.min(count, maxLimit),
    parts,
    language,
    remainingInPart,
  };
}
