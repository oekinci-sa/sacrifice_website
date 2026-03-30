-- Canlı baskül: live_scale_total_price kuruş olarak hissedarlar arasında bölünür; kalan ilk sıralara dağıtılır.
-- Çağrı: rpc_insert_shareholders_batch, rpc_delete_shareholder, rpc_update_sacrifice_core, rpc_move_shareholder_to_sacrifice

CREATE OR REPLACE FUNCTION public.rebalance_live_scale_shareholders(p_sacrifice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $rb$
DECLARE
  v_sa public.sacrifice_animals%ROWTYPE;
  v_n int;
  v_total_cents bigint;
  v_base int;
  v_rem int;
  v_idx int := 0;
  v_share_cents bigint;
  r record;
BEGIN
  SELECT * INTO v_sa FROM public.sacrifice_animals WHERE sacrifice_id = p_sacrifice_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  IF v_sa.pricing_mode IS DISTINCT FROM 'live_scale' THEN
    RETURN;
  END IF;
  IF v_sa.live_scale_total_price IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_n FROM public.shareholders WHERE sacrifice_id = p_sacrifice_id;
  IF v_n < 1 THEN
    RETURN;
  END IF;

  v_total_cents := ROUND(v_sa.live_scale_total_price * 100)::bigint;
  v_base := (v_total_cents / v_n)::int;
  v_rem := (v_total_cents % v_n)::int;

  FOR r IN
    SELECT shareholder_id, delivery_fee, paid_amount
    FROM public.shareholders
    WHERE sacrifice_id = p_sacrifice_id
    ORDER BY shareholder_id
  LOOP
    v_idx := v_idx + 1;
    v_share_cents := v_base::bigint + (CASE WHEN v_idx <= v_rem THEN 1 ELSE 0 END)::bigint;
    UPDATE public.shareholders sh SET
      total_amount = (v_share_cents::numeric / 100) + COALESCE(r.delivery_fee, 0),
      remaining_payment = GREATEST(
        ((v_share_cents::numeric / 100) + COALESCE(r.delivery_fee, 0)) - COALESCE(r.paid_amount, 0),
        0
      ),
      last_edited_time = now()
    WHERE sh.shareholder_id = r.shareholder_id;
  END LOOP;
END;
$rb$;

REVOKE ALL ON FUNCTION public.rebalance_live_scale_shareholders(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebalance_live_scale_shareholders(uuid) TO service_role;
