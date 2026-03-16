-- ===============================================
-- Açıklama: Hissedar eklendiğinde veya silindiğinde ilgili kurbanlık için
--           farkındalık kaydını siler (trigger yöntemi).
--           INSERT: Yeni hissedar eklenince "Tamam biliyorum" tekrar aktif olur.
--           DELETE: Hissedar silinince durum değişebileceği için acknowledgment sıfırlanır.
-- Trigger   : trg_clear_mismatched_ack_on_new_shareholder (AFTER INSERT)
-- Trigger   : trg_clear_mismatched_ack_on_shareholder_delete (AFTER DELETE)
-- ===============================================

CREATE OR REPLACE FUNCTION clear_mismatched_ack_on_new_shareholder()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM mismatched_share_acknowledgments
  WHERE sacrifice_id = NEW.sacrifice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clear_mismatched_ack_on_shareholder_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM mismatched_share_acknowledgments
  WHERE sacrifice_id = OLD.sacrifice_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clear_mismatched_ack_on_new_shareholder ON shareholders;
CREATE TRIGGER trg_clear_mismatched_ack_on_new_shareholder
AFTER INSERT ON shareholders
FOR EACH ROW
EXECUTE FUNCTION clear_mismatched_ack_on_new_shareholder();

DROP TRIGGER IF EXISTS trg_clear_mismatched_ack_on_shareholder_delete ON shareholders;
CREATE TRIGGER trg_clear_mismatched_ack_on_shareholder_delete
AFTER DELETE ON shareholders
FOR EACH ROW
EXECUTE FUNCTION clear_mismatched_ack_on_shareholder_delete();
