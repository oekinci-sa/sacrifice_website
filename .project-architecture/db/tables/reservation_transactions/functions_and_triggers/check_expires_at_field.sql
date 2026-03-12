-- ===============================================
-- Açıklama: Süresi dolmuş (expires_at < now) active rezervasyonları
--           'expired' durumuna günceller. Trigger yoktur; cron job
--           veya periyodik görev ile çağrılması gerekir.
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
          AND expires_at < timezone('Europe/Istanbul', now())
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
