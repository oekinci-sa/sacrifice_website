/**
 * Admin “PDF indir” ile `shareholders.notes` güncellenirken kullanılan birleşik metin (PDF’te gösterilmez).
 * Özel kapora cümlesi zaten notlarda varsa tekrar eklenmez.
 */

export function buildMergedAdminImportantNotesBlock(
  shareholderNotes: string | null | undefined,
  depositOverrideTl: number | null | undefined
): string | null {
  const parts: string[] = [];
  const trimmed = shareholderNotes?.trim();
  if (trimmed) parts.push(trimmed);

  if (
    depositOverrideTl != null &&
    Number.isFinite(Number(depositOverrideTl)) &&
    Number(depositOverrideTl) >= 0
  ) {
    const fmt = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(depositOverrideTl));
    const sentence = `Bu hissedardan ${fmt} TL kapora alınacak.`;
    const combined = parts.join("\n\n");
    if (!combined.includes(sentence)) {
      parts.push(sentence);
    }
  }

  if (parts.length === 0) return null;
  return parts.join("\n\n");
}
