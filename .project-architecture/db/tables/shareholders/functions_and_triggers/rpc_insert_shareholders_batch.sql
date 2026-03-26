-- rpc_insert_shareholders_batch: toplu hissedar ekleme + log_shareholder_changes (app.actor)
-- p_rows: jsonb dizisi; her eleman create-shareholders API gövdesindeki alanlarla uyumlu.
--
-- Güvenlik güncellemeleri:
--   1. Idempotency: transaction_id dolu ise aynı transaction için hissedar zaten
--      varsa 'already_inserted' exception fırlatır — ağ retry'larında duplicate önler.
--   2. Finansal doğruluk: total_amount ve remaining_payment client'tan değil,
--      sacrifice_animals.share_price + delivery_fee'den DB içinde hesaplanır.
--      Client'tan gelen total_amount/remaining_payment değerleri yoksayılır.

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
DECLARE
  v_first_tid text;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'rows_required';
  END IF;

  -- Her satırdaki sacrifice_id bu tenant'a ait olmalı (eski insert davranışıyla uyum)
  IF (
    SELECT COUNT(*) FROM jsonb_array_elements(p_rows) AS elem
    INNER JOIN public.sacrifice_animals sa
      ON sa.sacrifice_id = (elem->>'sacrifice_id')::uuid
     AND sa.tenant_id = p_tenant_id
  ) <> jsonb_array_length(p_rows) THEN
    RAISE EXCEPTION 'invalid_sacrifice_or_tenant';
  END IF;

  -- Idempotency: transaction_id doluysa daha önce bu transaction için hissedar eklenmiş mi?
  -- İlk satırın transaction_id'sini al (tüm satırlar aynı transaction_id'ye ait olmalı)
  SELECT trim(COALESCE(elem->>'transaction_id', ''))
  INTO v_first_tid
  FROM jsonb_array_elements(p_rows) AS elem
  LIMIT 1;

  IF v_first_tid IS NOT NULL AND v_first_tid <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.shareholders sh
      WHERE sh.transaction_id = v_first_tid::char(16)
        AND sh.tenant_id = p_tenant_id
    ) THEN
      RAISE EXCEPTION 'already_inserted';
    END IF;
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
    -- total_amount: DB'den share_price + delivery_fee olarak hesaplanır; client değeri yoksayılır
    sa.share_price + COALESCE((elem->>'delivery_fee')::numeric, 0),
    COALESCE((elem->>'paid_amount')::numeric, 0),
    -- remaining_payment: DB'den hesaplanan total_amount - paid_amount
    (sa.share_price + COALESCE((elem->>'delivery_fee')::numeric, 0))
      - COALESCE((elem->>'paid_amount')::numeric, 0),
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
