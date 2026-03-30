CREATE OR REPLACE FUNCTION public.rpc_move_shareholder_to_sacrifice(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid,
  p_target_sacrifice_id uuid
)
RETURNS SETOF public.shareholders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_sh public.shareholders;
  v_src public.sacrifice_animals;
  v_tgt public.sacrifice_animals;
  v_id_low uuid;
  v_id_high uuid;
  v_new_total numeric;
  v_new_remaining numeric;
  v_paid numeric;
  v_fee numeric;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;

  PERFORM set_config('app.actor', p_actor, true);

  SELECT * INTO v_sh
  FROM public.shareholders sh
  WHERE sh.shareholder_id = p_shareholder_id
    AND sh.tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shareholder_not_found';
  END IF;

  IF v_sh.sacrifice_id = p_target_sacrifice_id THEN
    RETURN NEXT v_sh;
    RETURN;
  END IF;

  v_id_low  := LEAST(v_sh.sacrifice_id, p_target_sacrifice_id);
  v_id_high := GREATEST(v_sh.sacrifice_id, p_target_sacrifice_id);

  PERFORM 1 FROM public.sacrifice_animals WHERE sacrifice_id = v_id_low  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'sacrifice_row_missing'; END IF;

  PERFORM 1 FROM public.sacrifice_animals WHERE sacrifice_id = v_id_high FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'sacrifice_row_missing'; END IF;

  SELECT * INTO v_src FROM public.sacrifice_animals WHERE sacrifice_id = v_sh.sacrifice_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'source_sacrifice_not_found'; END IF;

  SELECT * INTO v_tgt FROM public.sacrifice_animals WHERE sacrifice_id = p_target_sacrifice_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'target_sacrifice_not_found'; END IF;

  IF v_src.tenant_id <> p_tenant_id OR v_tgt.tenant_id <> p_tenant_id THEN
    RAISE EXCEPTION 'tenant_mismatch';
  END IF;

  IF v_src.sacrifice_year IS DISTINCT FROM v_tgt.sacrifice_year THEN
    RAISE EXCEPTION 'sacrifice_year_mismatch';
  END IF;

  IF v_tgt.empty_share < 1 THEN
    RAISE EXCEPTION 'target_sacrifice_full';
  END IF;

  IF v_src.empty_share >= 7 THEN
    RAISE EXCEPTION 'source_empty_share_invariant';
  END IF;

  v_paid := COALESCE(v_sh.paid_amount, 0);
  v_fee  := COALESCE(v_sh.delivery_fee, 0);

  IF v_tgt.pricing_mode = 'live_scale' THEN
    v_new_total := v_fee;
    v_new_remaining := GREATEST(v_fee - v_paid, 0);
  ELSE
    v_new_total := COALESCE(v_tgt.share_price, 0) + v_fee;
    v_new_remaining := GREATEST(v_new_total - v_paid, 0);
  END IF;

  UPDATE public.sacrifice_animals sa
  SET empty_share      = sa.empty_share + 1,
      last_edited_by   = p_actor,
      last_edited_time = now()
  WHERE sa.sacrifice_id = v_src.sacrifice_id;

  UPDATE public.sacrifice_animals sa
  SET empty_share      = sa.empty_share - 1,
      last_edited_by   = p_actor,
      last_edited_time = now()
  WHERE sa.sacrifice_id = v_tgt.sacrifice_id;

  UPDATE public.shareholders sh
  SET sacrifice_id        = v_tgt.sacrifice_id,
      sacrifice_year      = v_tgt.sacrifice_year,
      total_amount        = v_new_total,
      remaining_payment   = v_new_remaining,
      last_edited_by      = p_actor,
      last_edited_time    = now()
  WHERE sh.shareholder_id = p_shareholder_id
    AND sh.tenant_id      = p_tenant_id
  RETURNING * INTO v_sh;

  IF v_tgt.pricing_mode = 'live_scale' AND v_tgt.live_scale_total_price IS NOT NULL THEN
    PERFORM public.rebalance_live_scale_shareholders(v_tgt.sacrifice_id);
    SELECT * INTO v_sh FROM public.shareholders WHERE shareholder_id = p_shareholder_id AND tenant_id = p_tenant_id;
  END IF;

  IF v_src.pricing_mode = 'live_scale' AND v_src.live_scale_total_price IS NOT NULL THEN
    PERFORM public.rebalance_live_scale_shareholders(v_src.sacrifice_id);
  END IF;

  RETURN NEXT v_sh;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_move_shareholder_to_sacrifice(text, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_move_shareholder_to_sacrifice(text, uuid, uuid, uuid) TO service_role;
