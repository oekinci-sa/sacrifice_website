-- reservation_transactions "Allow Realtime for all" policy: TO public -> TO anon, authenticated
-- Supabase Realtime'ta "public" rolü bazen event'leri engelleyebiliyor. anon/authenticated açık hedeflenmeli.
-- Ref: https://github.com/supabase/supabase/issues/35195

DROP POLICY IF EXISTS "Allow Realtime for all" ON reservation_transactions;
CREATE POLICY "Allow Realtime for all"
ON reservation_transactions
FOR SELECT
TO anon, authenticated
USING (true);
