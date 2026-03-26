-- ===============================================
-- Açıklama: Süresi dolmuş (expires_at < now) active rezervasyonları
--           'expired' durumuna günceller. Trigger yoktur; cron job
--           veya periyodik görev ile çağrılması gerekir.
-- Kritik not: expires_at TIMESTAMPTZ olarak UTC saklanır.
--              Bu yüzden karşılaştırma timezone(...) ile değil doğrudan now() ile yapılmalıdır.
-- Kullanım  : SELECT check_expires_at_field();
--
-- Değişiklik: Row-by-row FOR LOOP kaldırıldı; tek set-based UPDATE kullanılıyor.
--   Eski pattern, döngü süresince her satır için ayrı statement çalıştırıyordu;
--   paralel cron çağrısında aynı satır iki kez işlenebiliyordu.
--   Set-based UPDATE atomik ve daha verimlidir.
-- ===============================================

CREATE OR REPLACE FUNCTION "public"."check_expires_at_field"()
  RETURNS "pg_catalog"."void" AS $BODY$
BEGIN
    UPDATE reservation_transactions
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < now();
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
