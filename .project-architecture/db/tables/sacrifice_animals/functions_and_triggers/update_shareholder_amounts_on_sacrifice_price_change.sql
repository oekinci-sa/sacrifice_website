-- ===============================================
-- Açıklama: sacrifice_animals.share_price değiştiğinde, aynı kurbanlığa
--           bağlı tüm hissedarların total_amount ve remaining_payment
--           değerlerini günceller. (share_price artık shareholders'da yok,
--           sacrifice_animals ile JOIN'den alınır)
-- Trigger   : update_shareholder_amounts_on_sacrifice_price_change (AFTER UPDATE)
-- ===============================================

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
