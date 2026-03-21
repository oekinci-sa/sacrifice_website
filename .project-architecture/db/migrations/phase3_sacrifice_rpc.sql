-- Faz 3: sacrifice_animals RPC (app.actor + güvenli güncelleme)

CREATE OR REPLACE FUNCTION public.rpc_update_sacrifice_core(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid,
  p_sacrifice_year int2,
  p_patch jsonb
)
RETURNS SETOF public.sacrifice_animals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  RETURN QUERY
  UPDATE public.sacrifice_animals sa
  SET
    sacrifice_no = CASE WHEN p_patch ? 'sacrifice_no' THEN (p_patch->>'sacrifice_no')::int2 ELSE sa.sacrifice_no END,
    sacrifice_time = CASE WHEN p_patch ? 'sacrifice_time' THEN (p_patch->>'sacrifice_time')::time ELSE sa.sacrifice_time END,
    share_weight = CASE WHEN p_patch ? 'share_weight' THEN (p_patch->>'share_weight')::int2 ELSE sa.share_weight END,
    share_price = CASE WHEN p_patch ? 'share_price' THEN (p_patch->>'share_price')::numeric ELSE sa.share_price END,
    empty_share = CASE WHEN p_patch ? 'empty_share' THEN (p_patch->>'empty_share')::int2 ELSE sa.empty_share END,
    animal_type = CASE WHEN p_patch ? 'animal_type' THEN NULLIF(trim(p_patch->>'animal_type'), '')::text ELSE sa.animal_type END,
    notes = CASE WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text ELSE sa.notes END,
    last_edited_by = CASE WHEN p_patch ? 'last_edited_by' THEN (p_patch->>'last_edited_by')::text ELSE sa.last_edited_by END,
    last_edited_time = CASE WHEN p_patch ? 'last_edited_time' THEN (p_patch->>'last_edited_time')::timestamptz ELSE sa.last_edited_time END
  WHERE sa.tenant_id = p_tenant_id
    AND sa.sacrifice_id = p_sacrifice_id
    AND sa.sacrifice_year = p_sacrifice_year
  RETURNING sa.*;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_update_sacrifice_timing(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid,
  p_sacrifice_year int2,
  p_field text,
  p_value timestamptz
)
RETURNS SETOF public.sacrifice_animals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  IF p_field NOT IN ('slaughter_time', 'butcher_time', 'delivery_time') THEN
    RAISE EXCEPTION 'invalid_timing_field';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  RETURN QUERY
  UPDATE public.sacrifice_animals sa
  SET
    slaughter_time = CASE WHEN p_field = 'slaughter_time' THEN p_value ELSE sa.slaughter_time END,
    butcher_time = CASE WHEN p_field = 'butcher_time' THEN p_value ELSE sa.butcher_time END,
    delivery_time = CASE WHEN p_field = 'delivery_time' THEN p_value ELSE sa.delivery_time END,
    last_edited_by = p_actor,
    last_edited_time = now()
  WHERE sa.tenant_id = p_tenant_id
    AND sa.sacrifice_id = p_sacrifice_id
    AND sa.sacrifice_year = p_sacrifice_year
  RETURNING sa.*;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_update_sacrifice_share(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid,
  p_sacrifice_year int2,
  p_empty_share int2
)
RETURNS SETOF public.sacrifice_animals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  RETURN QUERY
  UPDATE public.sacrifice_animals sa
  SET
    empty_share = p_empty_share,
    last_edited_by = p_actor,
    last_edited_time = now()
  WHERE sa.tenant_id = p_tenant_id
    AND sa.sacrifice_id = p_sacrifice_id
    AND sa.sacrifice_year = p_sacrifice_year
  RETURNING sa.*;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_timing(text, uuid, uuid, int2, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_share(text, uuid, uuid, int2, int2) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_timing(text, uuid, uuid, int2, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_share(text, uuid, uuid, int2, int2) TO service_role;
