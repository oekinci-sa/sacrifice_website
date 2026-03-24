import { useEffect } from 'react';

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_API = '/api/reservation/heartbeat';

/**
 * Aktif rezervasyon adımlarında (details / confirmation) sunucuya 15 sn'de bir
 * heartbeat gönderir. pg_cron job, 30 sn'den uzun süredir heartbeat gelmemiş
 * aktif rezervasyonları otomatik olarak 'offline' yapar.
 *
 * Invariantlar:
 * - Yalnızca details ve confirmation adımlarında çalışır
 * - isSuccess = true iken durur (ödeme tamamlandı)
 * - transaction_id yokken durur
 * - Ağ hatası sessizce görmezden gelinir; TTL güvenlik ağı olarak devrede
 */
export function useReservationHeartbeat({
  currentStep,
  transaction_id,
  isSuccess,
}: {
  currentStep: string;
  transaction_id: string;
  isSuccess: boolean;
}) {
  useEffect(() => {
    if (isSuccess) return;
    if (currentStep !== 'details' && currentStep !== 'confirmation') return;
    if (!transaction_id) return;

    const ping = () =>
      fetch(HEARTBEAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id }),
        keepalive: true,
      }).catch(() => {
        // Sessiz başarısızlık: tek kaçırılan heartbeat sorun değil;
        // 30 sn eşiğe ulaşmadan yeni ping gelir, TTL devreye girer.
      });

    ping();
    const id = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [currentStep, transaction_id, isSuccess]);
}
