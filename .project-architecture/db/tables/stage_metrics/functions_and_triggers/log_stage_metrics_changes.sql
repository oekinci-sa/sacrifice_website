-- stage_metrics → change_logs
-- Sadece current_sacrifice_number değişimi takip edilir.
-- Trigger: AFTER UPDATE OF current_sacrifice_number
-- Actor: önce app.actor GUC (rpc_update_stage_metrics set_config ile yazar), yoksa last_edited_by.

CREATE OR REPLACE FUNCTION public.log_stage_metrics_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
BEGIN
  IF OLD.current_sacrifice_number IS NOT DISTINCT FROM NEW.current_sacrifice_number THEN
    RETURN NEW;
  END IF;

  v_owner := COALESCE(
    NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
    NEW.last_edited_by,
    'Anonim Kullanıcı'
  );

  INSERT INTO public.change_logs (
    table_name,
    row_id,
    column_name,
    old_value,
    new_value,
    change_type,
    description,
    change_owner,
    tenant_id
  )
  VALUES (
    'stage_metrics',
    NEW.stage,
    'current_sacrifice_number',
    COALESCE(OLD.current_sacrifice_number::text, '—'),
    NEW.current_sacrifice_number::text,
    'UPDATE',
    'Sıra güncellendi',
    v_owner,
    NEW.tenant_id
  );

  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_stage_metrics_changes ON public.stage_metrics;

CREATE TRIGGER trigger_stage_metrics_changes
  AFTER UPDATE OF current_sacrifice_number ON public.stage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_stage_metrics_changes();
