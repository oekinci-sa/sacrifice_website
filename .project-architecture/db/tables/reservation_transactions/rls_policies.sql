-- RLS Policy: Realtime için SELECT (PUBLIC — tüm roller)
-- Rezervasyonlar badge, tablo ve hisseal sayfası Realtime postgres_changes kullanır.
-- RLS açıkken Realtime event'lerinin gelmesi için:
--   1. Bu policy: TO PUBLIC (supabase_realtime_admin dahil tüm roller)
--   2. GRANT SELECT TO supabase_realtime_admin, supabase_replication_admin
-- UYARI: TO anon, authenticated YETERSİZ — Realtime server internal rolleri policy'den geçemez.
CREATE POLICY "Allow Realtime for all"
ON public.reservation_transactions
FOR SELECT
USING (true);
