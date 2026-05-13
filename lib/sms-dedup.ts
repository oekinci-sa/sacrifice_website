/**
 * Tekilleştirme yalnızca normalize cep numarası ile yapılır; isim kullanılmaz.
 * Aynı kurbanlıkta aynı cebe → tek gönderim. Farklı kurbanlıkta aynı cebe → ayrı gönderim.
 * Kurban bağlamı yoksa hissedar kimliği; o da yoksa yalnızca telefon ile anahtar.
 */
export function smsRecipientDedupKey(
  normalizedPhone: string,
  sacrificeId: string | null | undefined,
  shareholderId: string | null | undefined
): string {
  if (sacrificeId) {
    return `s:${sacrificeId}:${normalizedPhone}`;
  }
  if (shareholderId) {
    return `h:${shareholderId}:${normalizedPhone}`;
  }
  return `p:${normalizedPhone}`;
}
