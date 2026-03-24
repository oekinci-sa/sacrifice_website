-- Açıklama: last_heartbeat_at değeri 30 saniyeden daha eski olan aktif rezervasyonları
--           'offline' durumuna günceller (TTL süresi dolmuş expired değil; heartbeat kesildi).
--           Trigger yoktur; pg_cron job ile çağrılır.
--
-- pg_cron kaydı:
--   SELECT cron.schedule(
--     'expire-stale-reservations',
--     '30 seconds',
--     $$SELECT public.expire_stale_reservations();$$
--   );
--
-- last_heartbeat_at IS NULL olan (henüz hiç heartbeat gelmemiş) rezervasyonlara dokunmaz;
-- onlar için check_expires_at_field() devreye girer.
--
-- trg_handle_reservation_deactivation tetikleyicisi status değişiminde
-- empty_share otomatik olarak geri yükler.

CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE reservation_transactions
  SET status = 'offline'
  WHERE status = 'active'
    AND last_heartbeat_at IS NOT NULL
    AND last_heartbeat_at < now() - interval '30 seconds';
END;
$$;
