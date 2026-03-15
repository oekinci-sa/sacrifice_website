/**
 * Hisseal rezervasyon timer sabitleri.
 * Client ve API bu dosyayı kullanır — TIMEOUT_DURATION değiştiğinde
 * hem session timer hem DB expires_at aynı değere göre çalışır.
 *
 * Production: 900, 180, 180, 60
 * Test: kısaltılmış değerler (örn. 20, 3, 15, 10)
 */
export const TIMEOUT_DURATION = 900; // Oturum süresi (sn) — session timer + DB expires_at
export const THREE_MINUTE_WARNING = 180;
export const ONE_MINUTE_WARNING = 60;

export const INACTIVITY_TIMEOUT = 60; // Hareketsizlik süresi (sn) — mouse/klavye yoksa redirect + timed_out
export const INACTIVITY_WARNING_THRESHOLD = 30; // Inactivity uyarısı (kalan sn)