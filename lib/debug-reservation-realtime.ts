const DEBUG_KEY = "debug:reservation-realtime";

/**
 * Rezervasyon realtime (badge + tablo) debug loglama.
 * Etkinleştirmek: Console'da localStorage.setItem('debug:reservation-realtime', '1') sonra sayfa yenile
 * Kapatmak: localStorage.removeItem('debug:reservation-realtime')
 */
export function logReservationRealtime(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(DEBUG_KEY) !== "1") return;

  // İlk logda kullanım bilgisi göster (sadece bir kez)
  if (!(window as unknown as { __reservationDebugShown?: boolean }).__reservationDebugShown) {
    (window as unknown as { __reservationDebugShown?: boolean }).__reservationDebugShown = true;
    console.log(
      "[DEBUG:reservation-realtime] Loglama aktif. Kapatmak: localStorage.removeItem('debug:reservation-realtime')"
    );
  }

  console.log("[DEBUG:reservation-realtime]", new Date().toISOString(), ...args);
}
