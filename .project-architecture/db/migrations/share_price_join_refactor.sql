-- share_price: shareholders'dan kaldır, her zaman sacrifice_animals ile JOIN

-- 1. Yeni sacrifice trigger: share_price değişince hissedarların total_amount/remaining_payment güncellensin
CREATE OR REPLACE FUNCTION update_shareholder_amounts_on_sacrifice_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
    UPDATE shareholders
    SET
      total_amount = COALESCE(delivery_fee, 0) + NEW.share_price,
      remaining_payment = (COALESCE(delivery_fee, 0) + NEW.share_price) - paid_amount
    WHERE sacrifice_id = NEW.sacrifice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_share_price_to_shareholders ON sacrifice_animals;
CREATE TRIGGER update_shareholder_amounts_on_sacrifice_price_change
AFTER UPDATE ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_shareholder_amounts_on_sacrifice_price_change();

-- 2. update_shareholder_amounts: share_price sacrifice_animals'dan al
CREATE OR REPLACE FUNCTION update_shareholder_amounts()
RETURNS TRIGGER AS $$
DECLARE
  v_share_price NUMERIC(12,2);
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee) THEN
        SELECT share_price INTO v_share_price
        FROM sacrifice_animals
        WHERE sacrifice_id = NEW.sacrifice_id;
        NEW.total_amount := COALESCE(NEW.delivery_fee, 0) + COALESCE(v_share_price, 0);
    END IF;

    IF (TG_OP = 'UPDATE' AND (NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
                             NEW.paid_amount IS DISTINCT FROM OLD.paid_amount)) THEN
        NEW.remaining_payment := NEW.total_amount - NEW.paid_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shareholder_calculations ON shareholders;
CREATE TRIGGER shareholder_calculations
BEFORE UPDATE OF delivery_fee, paid_amount
ON shareholders
FOR EACH ROW
EXECUTE FUNCTION update_shareholder_amounts();

-- 3. invalid_payments_view: sacrifice_animals JOIN
CREATE OR REPLACE VIEW invalid_payments_view AS
SELECT 
    sh.shareholder_id,
    sh.shareholder_name,
    sh.phone_number,
    sh.sacrifice_id,
    sh.delivery_fee,
    sa.share_price,
    sh.total_amount,
    sh.paid_amount,
    sh.remaining_payment,
    (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) AS expected_total,
    (sh.paid_amount + sh.remaining_payment) AS actual_total,
    sh.last_edited_time,
    sh.last_edited_by,
    sh.notes
FROM shareholders sh
JOIN sacrifice_animals sa ON sh.sacrifice_id = sa.sacrifice_id
WHERE (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) <> (sh.paid_amount + sh.remaining_payment);

-- 4. mismatched_share_prices view sil (artık gerek yok)
DROP VIEW IF EXISTS mismatched_share_prices;

-- 5. shareholders.share_price kolonunu kaldır
ALTER TABLE shareholders DROP COLUMN IF EXISTS share_price;
