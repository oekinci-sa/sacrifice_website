-- Realtime sunucusunun RLS değerlendirmesi yapabilmesi için internal role'lere SELECT izni
-- TechnetExperts + Supabase docs: Realtime server needs table read access to evaluate policies
-- Kaynak: https://www.technetexperts.com/realtime-rls-solved/
GRANT SELECT ON public.reservation_transactions TO supabase_realtime_admin;
GRANT SELECT ON public.reservation_transactions TO supabase_replication_admin;

-- Policy: TO PUBLIC (tüm roller — supabase_realtime_admin dahil)
-- UYARI: TO anon, authenticated YETERSİZ — Realtime server internal rolleri policy'den geçemez.
-- sacrifice_animals ile aynı pattern: TO PUBLIC + USING(true)
DROP POLICY IF EXISTS "Allow Realtime for all" ON public.reservation_transactions;

CREATE POLICY "Allow Realtime for all"
ON public.reservation_transactions
FOR SELECT
USING (true);
