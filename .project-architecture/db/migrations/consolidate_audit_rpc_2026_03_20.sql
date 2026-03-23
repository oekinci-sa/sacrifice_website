-- Audit: rpc_update_sacrifice_core genişletildi (timing + empty_share tek yerde).
-- Yeni: rpc_create_sacrifice, rpc_insert_shareholders_batch; rpc_update_shareholder email/contacted_at.
-- Kaldırılan: rpc_update_sacrifice_timing, rpc_update_sacrifice_share (gerekçe: .project-architecture/audit-rpc-and-triggers.md).

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

CREATE OR REPLACE FUNCTION public.rpc_insert_shareholders_batch(
  p_actor text,
  p_tenant_id uuid,
  p_rows jsonb
)
RETURNS SETOF public.shareholders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'rows_required';
  END IF;

  IF (
    SELECT COUNT(*) FROM jsonb_array_elements(p_rows) AS elem
    INNER JOIN public.sacrifice_animals sa
      ON sa.sacrifice_id = (elem->>'sacrifice_id')::uuid
     AND sa.tenant_id = p_tenant_id
  ) <> jsonb_array_length(p_rows) THEN
    RAISE EXCEPTION 'invalid_sacrifice_or_tenant';
  END IF;

  PERFORM set_config('app.actor', p_actor, true);

  RETURN QUERY
  INSERT INTO public.shareholders (
    tenant_id,
    shareholder_name,
    phone_number,
    second_phone_number,
    email,
    transaction_id,
    security_code,
    sacrifice_id,
    delivery_fee,
    total_amount,
    paid_amount,
    remaining_payment,
    delivery_location,
    delivery_type,
    purchased_by,
    sacrifice_consent,
    sacrifice_year,
    last_edited_by,
    last_edited_time
  )
  SELECT
    p_tenant_id,
    trim((elem->>'shareholder_name')::text),
    NULLIF((elem->>'phone_number')::varchar, ''),
    NULLIF((elem->>'second_phone_number')::varchar, ''),
    NULLIF((elem->>'email')::varchar, ''),
    CASE
      WHEN trim(COALESCE(elem->>'transaction_id', '')) = '' THEN NULL
      ELSE trim(elem->>'transaction_id')::char(16)
    END,
    (elem->>'security_code')::varchar,
    (elem->>'sacrifice_id')::uuid,
    COALESCE((elem->>'delivery_fee')::numeric, 0),
    (elem->>'total_amount')::numeric,
    COALESCE((elem->>'paid_amount')::numeric, 0),
    (elem->>'remaining_payment')::numeric,
    COALESCE((elem->>'delivery_location')::text, 'Kesimhane'),
    COALESCE((elem->>'delivery_type')::text, 'Kesimhane'),
    COALESCE((elem->>'purchased_by')::text, ''),
    COALESCE((elem->>'sacrifice_consent')::boolean, false),
    sa.sacrifice_year,
    p_actor,
    now()
  FROM jsonb_array_elements(p_rows) AS elem
  INNER JOIN public.sacrifice_animals sa
    ON sa.sacrifice_id = (elem->>'sacrifice_id')::uuid
   AND sa.tenant_id = p_tenant_id
  RETURNING *;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_insert_shareholders_batch(text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_insert_shareholders_batch(text, uuid, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.rpc_update_shareholder(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid,
  p_patch jsonb
)
RETURNS SETOF public.shareholders
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
  UPDATE public.shareholders sh
  SET
    shareholder_name = CASE
      WHEN p_patch ? 'shareholder_name' THEN (p_patch->>'shareholder_name')::text
      ELSE sh.shareholder_name
    END,
    phone_number = CASE
      WHEN p_patch ? 'phone_number' THEN NULLIF((p_patch->>'phone_number'), '')::varchar
      ELSE sh.phone_number
    END,
    second_phone_number = CASE
      WHEN NOT (p_patch ? 'second_phone_number') THEN sh.second_phone_number
      WHEN p_patch->'second_phone_number' IS NULL OR jsonb_typeof(p_patch->'second_phone_number') = 'null' THEN NULL
      ELSE NULLIF((p_patch->>'second_phone_number'), '')::varchar
    END,
    email = CASE
      WHEN NOT (p_patch ? 'email') THEN sh.email
      WHEN p_patch->'email' IS NULL OR jsonb_typeof(p_patch->'email') = 'null' THEN NULL
      ELSE NULLIF(trim(p_patch->>'email'), '')::varchar
    END,
    contacted_at = CASE
      WHEN NOT (p_patch ? 'contacted_at') THEN sh.contacted_at
      WHEN p_patch->'contacted_at' IS NULL OR jsonb_typeof(p_patch->'contacted_at') = 'null' THEN NULL
      ELSE (p_patch->>'contacted_at')::timestamptz
    END,
    delivery_fee = CASE
      WHEN p_patch ? 'delivery_fee' THEN (p_patch->>'delivery_fee')::numeric
      ELSE sh.delivery_fee
    END,
    delivery_location = CASE
      WHEN p_patch ? 'delivery_location' THEN NULLIF((p_patch->>'delivery_location'), '')::text
      ELSE sh.delivery_location
    END,
    delivery_type = CASE
      WHEN p_patch ? 'delivery_type' THEN NULLIF((p_patch->>'delivery_type'), '')::text
      ELSE sh.delivery_type
    END,
    total_amount = CASE
      WHEN p_patch ? 'total_amount' THEN (p_patch->>'total_amount')::numeric
      ELSE sh.total_amount
    END,
    sacrifice_consent = CASE
      WHEN p_patch ? 'sacrifice_consent' THEN (p_patch->>'sacrifice_consent')::boolean
      ELSE sh.sacrifice_consent
    END,
    notes = CASE
      WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text
      ELSE sh.notes
    END,
    remaining_payment = CASE
      WHEN p_patch ? 'remaining_payment' THEN (p_patch->>'remaining_payment')::numeric
      ELSE sh.remaining_payment
    END,
    paid_amount = CASE
      WHEN p_patch ? 'paid_amount' THEN (p_patch->>'paid_amount')::numeric
      ELSE sh.paid_amount
    END,
    security_code = CASE
      WHEN p_patch ? 'security_code' THEN NULLIF((p_patch->>'security_code'), '')::varchar
      ELSE sh.security_code
    END,
    last_edited_by = CASE
      WHEN p_patch ? 'last_edited_by' THEN (p_patch->>'last_edited_by')::text
      ELSE sh.last_edited_by
    END,
    last_edited_time = CASE
      WHEN p_patch ? 'last_edited_time' THEN (p_patch->>'last_edited_time')::timestamptz
      ELSE sh.last_edited_time
    END
  WHERE sh.tenant_id = p_tenant_id
    AND sh.shareholder_id = p_shareholder_id
  RETURNING sh.*;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_shareholder(text, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_shareholder(text, uuid, uuid, jsonb) TO service_role;

DROP FUNCTION IF EXISTS public.rpc_update_sacrifice_timing(text, uuid, uuid, int2, text, timestamptz);
DROP FUNCTION IF EXISTS public.rpc_update_sacrifice_share(text, uuid, uuid, int2, int2);
