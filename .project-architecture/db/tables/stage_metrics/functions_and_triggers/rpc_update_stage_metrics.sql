-- rpc_update_stage_metrics: current_sacrifice_number güncelleme
-- change_logs artık trigger (log_stage_metrics_changes) üzerinden yazılır.
-- Bu RPC yalnızca app.actor'ü set_config ile set eder ve UPDATE yapar;
-- trigger bu transaction içinde app.actor'ü görüp change_logs'a yazar.

CREATE OR REPLACE FUNCTION public.rpc_update_stage_metrics(
  p_actor text,
  p_tenant_id uuid,
  p_stage text,
  p_current_sacrifice_number int2
)
RETURNS SETOF public.stage_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_new public.stage_metrics;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  IF p_stage NOT IN ('slaughter_stage', 'butcher_stage', 'delivery_stage') THEN
    RAISE EXCEPTION 'invalid_stage';
  END IF;

  PERFORM set_config('app.actor', p_actor, true);

  IF NOT EXISTS (
    SELECT 1 FROM public.stage_metrics sm
    WHERE sm.tenant_id = p_tenant_id AND sm.stage = p_stage
  ) THEN
    RAISE EXCEPTION 'stage_metrics_not_found';
  END IF;

  UPDATE public.stage_metrics sm
  SET
    current_sacrifice_number = p_current_sacrifice_number,
    last_edited_by           = p_actor
  WHERE sm.tenant_id = p_tenant_id
    AND sm.stage     = p_stage
  RETURNING * INTO v_new;

  RETURN NEXT v_new;
  RETURN;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_stage_metrics(text, uuid, text, int2) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_stage_metrics(text, uuid, text, int2) TO service_role;
