-- ===============================================
-- Açıklama: sacrifice_animals.tenant_id değiştiğinde ilişkili
--           shareholders ve reservation_transactions satırlarının
--           tenant_id değerlerini otomatik günceller.
-- Trigger   : trigger_cascade_tenant_on_sacrifice_update (AFTER UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION "public"."cascade_tenant_id_on_sacrifice_update" ()
RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    UPDATE shareholders
    SET tenant_id = NEW.tenant_id
    WHERE sacrifice_id = NEW.sacrifice_id;

    UPDATE reservation_transactions
    SET tenant_id = NEW.tenant_id
    WHERE sacrifice_id = NEW.sacrifice_id;
  END IF;
  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql VOLATILE COST 100;

CREATE TRIGGER trigger_cascade_tenant_on_sacrifice_update
AFTER UPDATE ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION cascade_tenant_id_on_sacrifice_update();
