-- Faz 4: Hisse uyumsuzluğu farkındalığı — RPC
-- change_logs artık trigger (log_mismatch_changes) üzerinden yazılır.
-- RPC yalnızca app.actor set edip mismatched_share_acknowledgments'ı günceller;
-- trigger bu transaction içinde app.actor'ü görüp change_logs'a yazar.

CREATE OR REPLACE FUNCTION public.rpc_acknowledge_mismatch(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid
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

  IF NOT EXISTS (
    SELECT 1 FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = p_sacrifice_id AND sa.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'sacrifice_not_found';
  END IF;

  INSERT INTO public.mismatched_share_acknowledgments (
    sacrifice_id,
    tenant_id,
    acknowledged_by,
    acknowledged_at,
    last_edited_by
  )
  VALUES (
    p_sacrifice_id,
    p_tenant_id,
    p_actor,
    now(),
    p_actor
  )
  ON CONFLICT (sacrifice_id) DO UPDATE SET
    tenant_id       = excluded.tenant_id,
    acknowledged_by = excluded.acknowledged_by,
    acknowledged_at = excluded.acknowledged_at,
    last_edited_by  = excluded.last_edited_by;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_revoke_mismatch(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid
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

  IF NOT EXISTS (
    SELECT 1 FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = p_sacrifice_id AND sa.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'sacrifice_not_found';
  END IF;

  DELETE FROM public.mismatched_share_acknowledgments m
  WHERE m.sacrifice_id = p_sacrifice_id
    AND m.tenant_id    = p_tenant_id;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_acknowledge_mismatch(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_revoke_mismatch(text, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_acknowledge_mismatch(text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_revoke_mismatch(text, uuid, uuid) TO service_role;
