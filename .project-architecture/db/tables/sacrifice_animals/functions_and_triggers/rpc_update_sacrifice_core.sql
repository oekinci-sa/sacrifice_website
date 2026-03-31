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
DECLARE
  r public.sacrifice_animals%ROWTYPE;
  v_corr uuid;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);
  v_corr := gen_random_uuid();
  PERFORM set_config('app.correlation_id', v_corr::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);

  FOR r IN
    UPDATE public.sacrifice_animals sa
    SET
      sacrifice_no = CASE WHEN p_patch ? 'sacrifice_no' THEN (p_patch->>'sacrifice_no')::int2 ELSE sa.sacrifice_no END,
      sacrifice_time = CASE WHEN p_patch ? 'sacrifice_time' THEN (p_patch->>'sacrifice_time')::time ELSE sa.sacrifice_time END,
      share_weight = CASE
        WHEN (CASE WHEN p_patch ? 'pricing_mode' THEN trim(p_patch->>'pricing_mode') ELSE sa.pricing_mode END) = 'live_scale' THEN NULL
        WHEN p_patch ? 'share_weight' THEN
          CASE
            WHEN p_patch->'share_weight' IS NULL OR jsonb_typeof(p_patch->'share_weight') = 'null' THEN NULL
            ELSE (p_patch->>'share_weight')::int2
          END
        ELSE sa.share_weight
      END,
      share_price = CASE
        WHEN NOT (p_patch ? 'share_price') THEN sa.share_price
        WHEN p_patch->'share_price' IS NULL OR jsonb_typeof(p_patch->'share_price') = 'null' THEN NULL
        ELSE (p_patch->>'share_price')::numeric
      END,
      pricing_mode = CASE
        WHEN p_patch ? 'pricing_mode' THEN trim(p_patch->>'pricing_mode')::text
        ELSE sa.pricing_mode
      END,
      live_scale_total_kg = CASE
        WHEN NOT (p_patch ? 'live_scale_total_kg') THEN sa.live_scale_total_kg
        WHEN p_patch->'live_scale_total_kg' IS NULL OR jsonb_typeof(p_patch->'live_scale_total_kg') = 'null' THEN NULL
        ELSE (p_patch->>'live_scale_total_kg')::numeric
      END,
      live_scale_total_price = CASE
        WHEN NOT (p_patch ? 'live_scale_total_price') THEN sa.live_scale_total_price
        WHEN p_patch->'live_scale_total_price' IS NULL OR jsonb_typeof(p_patch->'live_scale_total_price') = 'null' THEN NULL
        ELSE (p_patch->>'live_scale_total_price')::numeric
      END,
      empty_share = CASE
        WHEN p_patch ? 'empty_share_delta' THEN (sa.empty_share + (p_patch->>'empty_share_delta')::int2)::int2
        WHEN p_patch ? 'empty_share'       THEN (p_patch->>'empty_share')::int2
        ELSE sa.empty_share
      END,
      animal_type = CASE WHEN p_patch ? 'animal_type' THEN NULLIF(trim(p_patch->>'animal_type'), '')::text ELSE sa.animal_type END,
      notes = CASE WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text ELSE sa.notes END,
      foundation = CASE
        WHEN NOT (p_patch ? 'foundation') THEN sa.foundation
        WHEN p_patch->'foundation' IS NULL OR jsonb_typeof(p_patch->'foundation') = 'null' THEN NULL
        ELSE NULLIF(trim(p_patch->>'foundation'), '')
      END,
      ear_tag = CASE
        WHEN NOT (p_patch ? 'ear_tag') THEN sa.ear_tag
        WHEN p_patch->'ear_tag' IS NULL OR jsonb_typeof(p_patch->'ear_tag') = 'null' THEN NULL
        ELSE NULLIF(trim(p_patch->>'ear_tag'), '')
      END,
      barn_stall_order_no = CASE
        WHEN NOT (p_patch ? 'barn_stall_order_no') THEN sa.barn_stall_order_no
        WHEN p_patch->'barn_stall_order_no' IS NULL OR jsonb_typeof(p_patch->'barn_stall_order_no') = 'null' THEN NULL
        ELSE NULLIF(trim(p_patch->>'barn_stall_order_no'), '')
      END,
      planned_delivery_time = CASE
        WHEN p_patch ? 'planned_delivery_time' THEN (p_patch->>'planned_delivery_time')::time
        WHEN p_patch ? 'sacrifice_time' THEN ((p_patch->>'sacrifice_time')::time + interval '90 minutes')::time
        ELSE sa.planned_delivery_time
      END,
      slaughter_time = CASE
        WHEN NOT (p_patch ? 'slaughter_time') THEN sa.slaughter_time
        WHEN p_patch->'slaughter_time' IS NULL OR jsonb_typeof(p_patch->'slaughter_time') = 'null' THEN NULL
        ELSE (p_patch->>'slaughter_time')::timestamptz
      END,
      butcher_time = CASE
        WHEN NOT (p_patch ? 'butcher_time') THEN sa.butcher_time
        WHEN p_patch->'butcher_time' IS NULL OR jsonb_typeof(p_patch->'butcher_time') = 'null' THEN NULL
        ELSE (p_patch->>'butcher_time')::timestamptz
      END,
      delivery_time = CASE
        WHEN NOT (p_patch ? 'delivery_time') THEN sa.delivery_time
        WHEN p_patch->'delivery_time' IS NULL OR jsonb_typeof(p_patch->'delivery_time') = 'null' THEN NULL
        ELSE (p_patch->>'delivery_time')::timestamptz
      END,
      last_edited_by = CASE WHEN p_patch ? 'last_edited_by' THEN (p_patch->>'last_edited_by')::text ELSE sa.last_edited_by END,
      last_edited_time = CASE WHEN p_patch ? 'last_edited_time' THEN (p_patch->>'last_edited_time')::timestamptz ELSE sa.last_edited_time END
    WHERE sa.tenant_id = p_tenant_id
      AND sa.sacrifice_id = p_sacrifice_id
      AND sa.sacrifice_year = p_sacrifice_year
    RETURNING sa.*
  LOOP
    IF r.pricing_mode = 'live_scale' AND r.live_scale_total_price IS NOT NULL THEN
      PERFORM set_config('app.log_layer', 'detail', true);
      PERFORM public.rebalance_live_scale_shareholders(r.sacrifice_id);
      SELECT * INTO r FROM public.sacrifice_animals WHERE sacrifice_id = r.sacrifice_id;
    END IF;
    RETURN NEXT r;
  END LOOP;
  RETURN;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) TO service_role;
