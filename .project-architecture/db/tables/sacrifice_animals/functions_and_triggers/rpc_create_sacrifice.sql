-- rpc_create_sacrifice: yeni kurbanlık + log_sacrifice_changes (INSERT trigger, app.actor)

CREATE OR REPLACE FUNCTION public.rpc_create_sacrifice(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_year int2,
  p_sacrifice_no int2,
  p_sacrifice_time time,
  p_share_weight int2,
  p_share_price numeric,
  p_empty_share int2,
  p_animal_type text,
  p_notes text
)
RETURNS public.sacrifice_animals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_row public.sacrifice_animals;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  INSERT INTO public.sacrifice_animals (
    tenant_id,
    sacrifice_year,
    sacrifice_no,
    sacrifice_time,
    share_weight,
    share_price,
    empty_share,
    animal_type,
    notes,
    last_edited_by,
    last_edited_time
  )
  VALUES (
    p_tenant_id,
    p_sacrifice_year,
    p_sacrifice_no,
    p_sacrifice_time,
    p_share_weight,
    p_share_price,
    COALESCE(p_empty_share, 7),
    NULLIF(trim(p_animal_type), ''),
    p_notes,
    p_actor,
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_create_sacrifice(text, uuid, int2, int2, time, int2, numeric, int2, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_sacrifice(text, uuid, int2, int2, time, int2, numeric, int2, text, text) TO service_role;
