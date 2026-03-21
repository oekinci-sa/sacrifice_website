-- rpc_delete_shareholder: hissedar silme + log_shareholder_changes (app.actor, DELETE)

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
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  DELETE FROM public.shareholders
  WHERE tenant_id = p_tenant_id
    AND shareholder_id = p_shareholder_id;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) TO service_role;
