-- Kurbanlık silme: tek transaction + app.actor → log_shareholder_changes / log_sacrifice_changes change_owner doğru

CREATE OR REPLACE FUNCTION public.rpc_delete_sacrifice(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid,
  p_sacrifice_year int2
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.sacrifice_animals sa
    WHERE sa.tenant_id = p_tenant_id
      AND sa.sacrifice_id = p_sacrifice_id
      AND sa.sacrifice_year = p_sacrifice_year
  ) THEN
    RETURN FALSE;
  END IF;

  PERFORM set_config('app.actor', p_actor, true);

  DELETE FROM public.shareholders sh
  WHERE sh.tenant_id = p_tenant_id
    AND sh.sacrifice_id = p_sacrifice_id;

  DELETE FROM public.reservation_transactions rt
  WHERE rt.tenant_id = p_tenant_id
    AND rt.sacrifice_id = p_sacrifice_id;

  DELETE FROM public.sacrifice_animals sa
  WHERE sa.tenant_id = p_tenant_id
    AND sa.sacrifice_id = p_sacrifice_id
    AND sa.sacrifice_year = p_sacrifice_year;

  RETURN TRUE;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_delete_sacrifice(text, uuid, uuid, int2) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_delete_sacrifice(text, uuid, uuid, int2) TO service_role;
