/**
 * Tekilleştirme yalnızca normalize cep numarası ile yapılır; isim kullanılmaz.
 *
 * `mode: "per_sacrifice"` (varsayılan):
 *   Aynı kurbanlıkta aynı cebe → tek SMS. Farklı kurbanlıkta aynı cebe → ayrı SMS.
 *
 * `mode: "global"`:
 *   Tüm kurbanlıklar genelinde aynı cebe → tek SMS (kurbanlık bağlamı yok sayılır).
 *
 * Kurban bağlamı yoksa hissedar kimliği; o da yoksa yalnızca telefon ile anahtar.
 */
export function smsRecipientDedupKey(
  normalizedPhone: string,
  sacrificeId: string | null | undefined,
  shareholderId: string | null | undefined,
  mode: "per_sacrifice" | "global" = "per_sacrifice"
): string {
  if (mode === "global") {
    return `p:${normalizedPhone}`;
  }
  if (sacrificeId) {
    return `s:${sacrificeId}:${normalizedPhone}`;
  }
  if (shareholderId) {
    return `h:${shareholderId}:${normalizedPhone}`;
  }
  return `p:${normalizedPhone}`;
}
