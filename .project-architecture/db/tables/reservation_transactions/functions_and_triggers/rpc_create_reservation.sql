-- rpc_create_reservation: atomik rezervasyon oluşturma
-- sacrifice_animals satırını FOR UPDATE ile kilitler, boş hisse kontrolü ve INSERT
-- tek transaction içinde yapılır — TOCTOU (check-then-act) race condition önlenir.
--
-- Hata kodları:
--   sacrifice_not_found  : sacrifice_id + tenant_id + year eşleşmesi bulunamadı
--   insufficient_shares  : empty_share < p_share_count
--
-- empty_share azaltması: INSERT sonrası trg_update_empty_share (BEFORE INSERT) tetiklenir.
-- O trigger da aynı satır üzerinde FOR UPDATE kullandığından kilit çakışması olmaz
-- (aynı transaction içinde zaten kilidi tutuyoruz).

CREATE OR REPLACE FUNCTION public.rpc_create_reservation(
  p_tenant_id uuid,
  p_transaction_id char(16),
  p_sacrifice_id uuid,
  p_share_count int,
  p_sacrifice_year int2,
  p_expires_at timestamptz,
  p_client_device_category text DEFAULT 'unknown'
)
RETURNS SETOF public.reservation_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_empty int;
BEGIN
  -- sacrifice_animals satırını kilitle: eşzamanlı rezervasyonlarda lost update önler
  SELECT empty_share INTO v_empty
  FROM public.sacrifice_animals
  WHERE sacrifice_id = p_sacrifice_id
    AND tenant_id = p_tenant_id
    AND sacrifice_year = p_sacrifice_year
  FOR UPDATE;

  IF v_empty IS NULL THEN
    RAISE EXCEPTION 'sacrifice_not_found';
  END IF;

  IF v_empty < p_share_count THEN
    RAISE EXCEPTION 'insufficient_shares';
  END IF;

  RETURN QUERY
  INSERT INTO public.reservation_transactions (
    tenant_id, transaction_id, sacrifice_id, share_count,
    sacrifice_year, status, expires_at, client_device_category
  ) VALUES (
    p_tenant_id, p_transaction_id, p_sacrifice_id, p_share_count,
    p_sacrifice_year, 'active', p_expires_at, p_client_device_category
  )
  RETURNING *;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_create_reservation(uuid, char(16), uuid, int, int2, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_reservation(uuid, char(16), uuid, int, int2, timestamptz, text) TO service_role;
