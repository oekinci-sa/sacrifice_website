-- Canlı basküle geçişte share_price NULL olunca hissedar total_amount NULL oluyordu (23502).
-- Kaynak: update_shareholder_amounts_on_sacrifice_price_change.sql

CREATE OR REPLACE FUNCTION update_shareholder_amounts_on_sacrifice_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_price IS NOT DISTINCT FROM OLD.share_price
     AND NEW.pricing_mode IS NOT DISTINCT FROM OLD.pricing_mode
     AND NEW.live_scale_total_price IS NOT DISTINCT FROM OLD.live_scale_total_price
  THEN
    RETURN NEW;
  END IF;

  IF NEW.pricing_mode = 'live_scale' AND NEW.live_scale_total_price IS NOT NULL THEN
    PERFORM public.rebalance_live_scale_shareholders(NEW.sacrifice_id);
    RETURN NEW;
  END IF;

  IF NEW.pricing_mode = 'live_scale' THEN
    UPDATE shareholders
    SET
      total_amount = COALESCE(delivery_fee, 0),
      remaining_payment = GREATEST(COALESCE(delivery_fee, 0) - paid_amount, 0)
    WHERE sacrifice_id = NEW.sacrifice_id;
    RETURN NEW;
  END IF;

  UPDATE shareholders
  SET
    total_amount = COALESCE(delivery_fee, 0) + COALESCE(NEW.share_price, 0),
    remaining_payment = GREATEST(
      (COALESCE(delivery_fee, 0) + COALESCE(NEW.share_price, 0)) - paid_amount,
      0
    )
  WHERE sacrifice_id = NEW.sacrifice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_share_price_to_shareholders ON sacrifice_animals;
DROP TRIGGER IF EXISTS update_shareholder_amounts_on_sacrifice_price_change ON sacrifice_animals;
CREATE TRIGGER update_shareholder_amounts_on_sacrifice_price_change
AFTER UPDATE ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_shareholder_amounts_on_sacrifice_price_change();
