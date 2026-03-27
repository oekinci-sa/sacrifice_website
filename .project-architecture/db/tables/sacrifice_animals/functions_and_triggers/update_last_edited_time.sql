-- ===============================================
-- Açıklama: sacrifice_animals tablosundaki last_edited_time alanını
--           otomatik olarak günceller. Her INSERT veya UPDATE işleminde
--           UTC (now()) yazar. Frontend lib/date-utils.ts ile Türkiye saati gösterir.
-- Trigger   : set_last_edited_time (BEFORE INSERT OR UPDATE)
-- ===============================================

-- KALDIRILDI (2026-03-27): Bu fonksiyon DB'den silindi.
-- Yerini update_last_edited_time() aldı (reservation_transactions ile ortak).
-- Bu dosya yalnızca tarihsel referans için saklanmaktadır.
CREATE OR REPLACE FUNCTION update_sacrifice_last_edited_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_edited_time = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_last_edited_time
BEFORE INSERT OR UPDATE ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_sacrifice_last_edited_time();