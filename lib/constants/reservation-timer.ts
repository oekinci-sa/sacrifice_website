/**
 * Hisseal rezervasyon timer sabitleri.
 * Client ve API bu dosyayı kullanır — TIMEOUT_DURATION değiştiğinde
 * hem session timer hem DB expires_at aynı değere göre çalışır.
 *
 * Production: 900, 180, 180, 60
 * Test: kısaltılmış değerler (örn. 20, 3, 15, 10)
 */
export const TIMEOUT_DURATION = 30; // Oturum süresi (sn) — session timer + DB expires_at
export const INACTIVITY_TIMEOUT = 10; // Hareketsizlik süresi (sn) — mouse/klavye yoksa redirect + timed_out
export const INACTIVITY_WARNING_THRESHOLD = 5; // Inactivity uyarısı (kalan sn)
export const THREE_MINUTE_WARNING = 20;
export const ONE_MINUTE_WARNING = 10;
