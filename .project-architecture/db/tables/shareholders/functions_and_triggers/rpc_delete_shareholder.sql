CREATE OR REPLACE FUNCTION public.rpc_delete_shareholder(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_corr uuid;
  v_sid uuid;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  v_corr := gen_random_uuid();
  PERFORM set_config('app.correlation_id', v_corr::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);
  PERFORM set_config('app.actor', p_actor, true);

  SELECT sh.sacrifice_id INTO v_sid
  FROM public.shareholders sh
  WHERE sh.tenant_id = p_tenant_id
    AND sh.shareholder_id = p_shareholder_id;

  DELETE FROM public.shareholders
  WHERE tenant_id = p_tenant_id
    AND shareholder_id = p_shareholder_id;

  IF v_sid IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.sacrifice_animals sa
       WHERE sa.sacrifice_id = v_sid
         AND sa.pricing_mode = 'live_scale'
         AND sa.live_scale_total_price IS NOT NULL
     ) THEN
    PERFORM public.rebalance_live_scale_shareholders(v_sid);
  END IF;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) TO service_role;
