/**
 * Aynı kurbanlıkta aynı numara → tek mesaj; farklı kurbanlıkta aynı numara → ayrı mesaj.
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
