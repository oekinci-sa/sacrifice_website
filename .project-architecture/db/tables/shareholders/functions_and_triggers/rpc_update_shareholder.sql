-- rpc_update_shareholder: hissedar güncelleme + log_shareholder_changes (app.actor)

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
