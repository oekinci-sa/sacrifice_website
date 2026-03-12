-- ===============================================
-- Açıklama: shareholders tablosundaki last_edited_time alanını
--           otomatik olarak günceller. Her INSERT veya UPDATE işleminde
--           UTC (now()) yazar. Frontend lib/date-utils.ts ile Türkiye saati gösterir.
-- Trigger   : set_last_edited_time (BEFORE INSERT OR UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION update_shareholder_last_edited_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_edited_time = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_last_edited_time
BEFORE INSERT OR UPDATE ON shareholders
FOR EACH ROW
EXECUTE FUNCTION update_shareholder_last_edited_time();
