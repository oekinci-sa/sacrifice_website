-- RLS Policy: Realtime için SELECT (PUBLIC — tüm roller)
-- Rezervasyonlar badge, tablo ve hisseal sayfası Realtime postgres_changes kullanır.
-- RLS açıkken Realtime event'lerinin gelmesi için:
--   1. Bu policy: TO PUBLIC (supabase_realtime_admin dahil tüm roller)
--   2. GRANT SELECT TO supabase_realtime_admin, supabase_replication_admin
-- UYARI: TO anon, authenticated YETERSİZ — Realtime server internal rolleri policy'den geçemez.
--
-- GÜVENLİK NOTU:
--   Bu policy, anon anahtarıyla PostgREST üzerinden doğrudan tablo okumaya izin verir.
--   Kabul edilen risk gerekçesi:
--     - Tüm yazma işlemleri service_role (supabaseAdmin) üzerinden yapılır.
--     - Client sadece Realtime subscription için anon key kullanır.
--     - reservation_transactions.transaction_id değerleri 16 karakterlik rastgele ID'dir;
--       brute-force ile tahmin edilmesi pratikte mümkün değildir.
--   Uzun vadeli iyileştirme seçenekleri:
--     - Supabase Realtime'ı yalnızca belirli sütunlarla (sacrifice_id, status, empty_share)
--       yayınlayan filtered publication kullanmak.
--     - shareholders tablosundan Realtime kaldırıp admin sayfasını polling'e geçirmek
--       ve anon SELECT policy'yi kaldırmak.
CREATE POLICY "Allow Realtime for all"
ON public.reservation_transactions
FOR SELECT
USING (true);
