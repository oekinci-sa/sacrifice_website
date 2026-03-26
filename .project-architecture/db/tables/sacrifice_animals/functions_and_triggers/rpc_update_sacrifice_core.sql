-- rpc_update_sacrifice_core: kurbanlık güncelleme + log_sacrifice_changes (app.actor)
-- Zaman alanları (slaughter_time / butcher_time / delivery_time) burada; ayrı rpc_update_sacrifice_timing kaldırıldı.
-- Boş hisse (empty_share) burada; rpc_update_sacrifice_share kaldırıldı.
--
-- empty_share güncelleme modları:
--   - p_patch ? 'empty_share_delta' : delta (+ / -) uygular — reset-shares gibi göreli artışlar için
--   - p_patch ? 'empty_share'       : mutlak değer yazar — admin manuel düzeltmeleri için
--   Öncelik sırası: empty_share_delta > empty_share > mevcut değer

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
  RETURNING sa.*;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) TO service_role;
