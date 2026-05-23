/** Sıra sayfalarında gösterilen / seçilebilen minimum kurban numarası. */
export const QUEUE_NUMBER_MIN = 1;

/** DB veya boş değer geldiğinde sıra ekranında gösterilecek numara (henüz işlem başlamadıysa 1). */
export function normalizeQueueDisplayNumber(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < QUEUE_NUMBER_MIN) {
    return QUEUE_NUMBER_MIN;
  }
  return Math.trunc(value);
}
