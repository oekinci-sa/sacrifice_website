-- Migration: Rezervasyon heartbeat desteği
-- reservation_transactions tablosuna last_heartbeat_at kolonu ekler.
-- Client 15 sn'de bir bu alanı günceller; pg_cron job 30 sn'den uzun
-- süredir heartbeat gelmemiş aktif rezervasyonları expire_stale_reservations()
-- fonksiyonu ile 'expired' durumuna alır.

ALTER TABLE reservation_transactions
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;
