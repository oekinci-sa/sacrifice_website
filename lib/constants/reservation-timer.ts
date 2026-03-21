/**
 * Hisseal rezervasyon timer sabitleri.
 * Client ve API bu dosyayı kullanır — TIMEOUT_DURATION değiştiğinde
 * hem session timer hem DB expires_at aynı değere göre çalışır.
 *
 * Session uyarıları: THREE_MINUTE_WARNING / ONE_MINUTE_WARNING (sn kala).
 * Hareket yok: INACTIVITY_TIMEOUT (toplam sn), INACTIVITY_WARNING_THRESHOLD (kalan sn ile uyarı).
 */
export const TIMEOUT_DURATION = 900; // Oturum süresi (sn) — session timer + DB expires_at
export const THREE_MINUTE_WARNING = 180;
export const ONE_MINUTE_WARNING = 60;

export const INACTIVITY_TIMEOUT = 120; // Hareketsizlik süresi (sn) — mouse/klavye yoksa redirect + timed_out
export const INACTIVITY_WARNING_THRESHOLD = 60; // Uyarı: kalan süre bu saniyeye düşünce (1 dk kala)