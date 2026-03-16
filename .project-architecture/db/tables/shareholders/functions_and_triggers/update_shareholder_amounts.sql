-- ===============================================
-- Açıklama: shareholders tablosunda delivery_fee değiştiğinde total_amount'u
--           (share_price sacrifice_animals'dan alınır), paid_amount değiştiğinde
--           remaining_payment'ı otomatik hesaplar.
-- Trigger   : shareholder_calculations (BEFORE UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION update_shareholder_amounts()
RETURNS TRIGGER AS $$
DECLARE
  v_share_price NUMERIC(12,2);
BEGIN
    -- delivery_fee değişmişse, total_amount'u hesapla (share_price sacrifice_animals'dan)
    IF (TG_OP = 'UPDATE' AND NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee) THEN
        SELECT share_price INTO v_share_price
        FROM sacrifice_animals
        WHERE sacrifice_id = NEW.sacrifice_id;
        NEW.total_amount := COALESCE(NEW.delivery_fee, 0) + COALESCE(v_share_price, 0);
    END IF;

    -- total_amount veya paid_amount değişmişse, remaining_payment'ı hesapla
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
