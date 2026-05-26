-- BEFORE INSERT on sacrifice_animals: planned_delivery_time NULL ise tenant offset ile türet.
-- Offset: tenant_settings.planned_delivery_offset_minutes (varsayılan 90).

CREATE OR REPLACE FUNCTION public.set_planned_delivery_time_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $tr$
DECLARE
  v_offset int;
BEGIN
  IF NEW.planned_delivery_time IS NULL THEN
    SELECT COALESCE(planned_delivery_offset_minutes, 90)
    INTO v_offset
    FROM tenant_settings
    WHERE tenant_id = NEW.tenant_id;

    NEW.planned_delivery_time := (NEW.sacrifice_time + (v_offset || ' minutes')::interval)::time;
  END IF;
  RETURN NEW;
END;
$tr$;

-- Trigger (production'da mevcut):
-- CREATE TRIGGER trg_set_planned_delivery_time_on_insert
--   BEFORE INSERT ON sacrifice_animals
--   FOR EACH ROW
--   EXECUTE FUNCTION set_planned_delivery_time_on_insert();
