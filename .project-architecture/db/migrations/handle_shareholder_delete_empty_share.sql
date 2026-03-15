-- Hissedar silindiğinde ilgili kurbanlığın empty_share değerini 1 artır
-- Bu trigger sayesinde API tarafında empty_share güncellemesi yapmaya gerek yok

CREATE OR REPLACE FUNCTION handle_shareholder_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sacrifice_animals
  SET empty_share = LEAST(empty_share + 1, 7)
  WHERE sacrifice_id = OLD.sacrifice_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shareholder_delete ON shareholders;
CREATE TRIGGER trg_shareholder_delete
AFTER DELETE ON shareholders
FOR EACH ROW
EXECUTE FUNCTION handle_shareholder_delete();
