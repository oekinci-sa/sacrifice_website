-- ===============================================
-- Açıklama: shareholders tablosunda delivery_fee veya share_price
--           değiştiğinde total_amount'u, paid_amount değiştiğinde
--           remaining_payment'ı otomatik hesaplar.
-- Trigger   : shareholder_calculations (BEFORE UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION update_shareholder_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer delivery_fee veya share_price değişmişse, total_amount'u hesapla
    IF (TG_OP = 'UPDATE' AND (NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee OR
                             NEW.share_price IS DISTINCT FROM OLD.share_price)) THEN
        NEW.total_amount := COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.share_price, 0);
    END IF;

    -- Eğer total_amount veya paid_amount değişmişse, remaining_payment'ı hesapla
    IF (TG_OP = 'UPDATE' AND (NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
                             NEW.paid_amount IS DISTINCT FROM OLD.paid_amount)) THEN
        NEW.remaining_payment := NEW.total_amount - NEW.paid_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shareholder_calculations
BEFORE UPDATE OF delivery_fee, share_price, paid_amount
ON shareholders
FOR EACH ROW
EXECUTE FUNCTION update_shareholder_amounts();
