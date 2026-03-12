-- ===============================================
-- Açıklama: sacrifice_animals.share_price değiştiğinde, aynı kurbanlığa
--           bağlı tüm hissedarların share_price alanını senkronize eder.
--           Böylece hisse bedeli tek yerden güncellenir.
-- Trigger   : sync_share_price_to_shareholders (AFTER UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION update_share_price_on_shareholders_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece share_price değiştiyse güncelle
  IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
    UPDATE shareholders
    SET share_price = NEW.share_price
    WHERE sacrifice_id = NEW.sacrifice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_share_price_to_shareholders
AFTER UPDATE ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_share_price_on_shareholders_table();
