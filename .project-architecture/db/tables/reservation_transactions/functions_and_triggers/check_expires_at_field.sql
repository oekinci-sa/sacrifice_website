-- ===============================================
-- Açıklama: Süresi dolmuş (expires_at < now) active rezervasyonları
--           'expired' durumuna günceller. Trigger yoktur; cron job
--           veya periyodik görev ile çağrılması gerekir.
-- Kritik not: expires_at TIMESTAMPTZ olarak UTC saklanır.
--              Bu yüzden karşılaştırma timezone(...) ile değil doğrudan now() ile yapılmalıdır.
-- Kullanım  : SELECT check_expires_at_field();
-- ===============================================

CREATE OR REPLACE FUNCTION "public"."check_expires_at_field"()
  RETURNS "pg_catalog"."void" AS $BODY$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT * FROM reservation_transactions
        WHERE status = 'active'
          AND expires_at < now()
    LOOP
        -- Rezervasyonu expired olarak güncelle
        UPDATE reservation_transactions
        SET status = 'expired'
        WHERE transaction_id = rec.transaction_id;
    END LOOP;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
