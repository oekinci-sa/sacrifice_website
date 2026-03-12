-- ===============================================
-- Açıklama: sacrifice_animals tablosundaki tüm değişiklikleri (ekleme,
--           güncelleme, silme) change_logs tablosuna kaydeder. Kurban
--           numarası, hisse bedeli, kesim/parçalama/teslimat saatleri
--           gibi alan değişikliklerini izler.
-- Trigger   : trigger_sacrifice_changes (AFTER INSERT OR UPDATE OR DELETE)
-- ===============================================

CREATE OR REPLACE FUNCTION "public"."log_sacrifice_changes" () RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO change_logs (TABLE_NAME, row_id, change_type, description, change_owner)
    VALUES
    (
      'Kurbanlıklar',
      CAST (NEW.sacrifice_no AS TEXT),
      'Ekleme',
      'Yeni kurban kaydı eklendi: Kurban Numarası: ' || NEW.sacrifice_no || ', Hisse Bedeli: ' || NEW.share_price || ', Kesim Zamanı: ' || NEW.sacrifice_time,
      NEW.last_edited_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Kurban numarası değiştiyse
    IF NEW.sacrifice_no <> OLD.sacrifice_no THEN
      INSERT INTO change_logs (TABLE_NAME, row_id, COLUMN_NAME, old_value, new_value, change_type, description, change_owner)
      VALUES
      (
        'Kurbanlıklar',
        CAST (NEW.sacrifice_no AS TEXT),
        'Kurban Numarası',
        CAST (OLD.sacrifice_no AS TEXT),
        CAST (NEW.sacrifice_no AS TEXT),
        'Güncelleme',
        'Kurban numarası ' || OLD.sacrifice_no || ' değerinden ' || NEW.sacrifice_no || ' değerine değişti.',
        NEW.last_edited_by
      );
    END IF;

    -- Hisse bedeli değiştiyse
    IF NEW.share_price <> OLD.share_price THEN
      INSERT INTO change_logs (TABLE_NAME, row_id, COLUMN_NAME, old_value, new_value, change_type, description, change_owner)
      VALUES
      (
        'Kurbanlıklar',
        CAST (NEW.sacrifice_no AS TEXT),
        'Hisse Bedeli',
        CAST (OLD.share_price AS TEXT),
        CAST (NEW.share_price AS TEXT),
        'Güncelleme',
        'Hisse bedeli ' || OLD.share_price || ' değerinden ' || NEW.share_price || ' değerine değişti.',
        NEW.last_edited_by
      );
    END IF;
    -- Kesim zamanı değiştiyse
    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (TABLE_NAME, row_id, COLUMN_NAME, old_value, new_value, change_type, description, change_owner)
      VALUES
      (
        'Kurbanlıklar',
        CAST (NEW.sacrifice_no AS TEXT),
        'Kesim Zamanı',
        CAST (OLD.sacrifice_time AS TEXT),
        CAST (NEW.sacrifice_time AS TEXT),
        'Güncelleme',
        'Kesim zamanı ' || COALESCE (CAST (OLD.sacrifice_time AS TEXT), '') || ' değerinden ' || COALESCE (CAST (NEW.sacrifice_time AS TEXT), '') || ' değerine değişti.',
        NEW.last_edited_by
      );
    END IF;
    -- slaughter_time değiştiyse
    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (TABLE_NAME, row_id, COLUMN_NAME, old_value, new_value, change_type, description, change_owner)
      VALUES
      (
        'Kurbanlıklar',
        CAST (NEW.sacrifice_no AS TEXT),
        'Kesim Saati',
        CAST (OLD.slaughter_time AS TEXT),
        CAST (NEW.slaughter_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.slaughter_time IS NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesim işlemi ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || ' saatinde gerçekleşti.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NULL THEN
            'Kesimin gerçekleştiği vakit olarak kaydedilen ' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ' bilgisi silindi.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesim vakti daha önce ' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ' idi, ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || ' olarak güncellendi.'
          ELSE
            'Kesim saati bilgisi güncellendi.'
        END,
        NEW.last_edited_by
      );
    END IF;
    -- butcher_time değiştiyse
    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (TABLE_NAME, row_id, COLUMN_NAME, old_value, new_value, change_type, description, change_owner)
      VALUES
      (
        'Kurbanlıklar',
        CAST (NEW.sacrifice_no AS TEXT),
        'Parçalama Saati',
        CAST (OLD.butcher_time AS TEXT),
        CAST (NEW.butcher_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.butcher_time IS NULL AND NEW.butcher_time IS NOT NULL THEN
            'Parçalama işlemi ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || ' saatinde gerçekleştirildi.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NULL THEN
            'Parçalama işleminin gerçekleştiği vakit olarak kaydedilen ' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ' bilgisi silindi.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NOT NULL THEN
            'Parçalama vakti daha önce ' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ' idi, ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || ' olarak güncellendi.'
          ELSE
            'Parçalama saati bilgisi güncellendi.'
        END,
        NEW.last_edited_by
      );
    END IF;
    -- delivery_time değiştiyse
    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (TABLE_NAME, row_id, COLUMN_NAME, old_value, new_value, change_type, description, change_owner)
      VALUES
      (
        'Kurbanlıklar',
        CAST (NEW.sacrifice_no AS TEXT),
        'Teslimat Saati',
        CAST (OLD.delivery_time AS TEXT),
        CAST (NEW.delivery_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.delivery_time IS NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat işlemi ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || ' saatinde gerçekleştirildi.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NULL THEN
            'Teslimatın gerçekleştiği vakit olarak kaydedilen ' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ' bilgisi silindi.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat vakti daha önce ' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ' idi, ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || ' olarak güncellendi.'
          ELSE
            'Teslimat saati bilgisi güncellendi.'
        END,
        NEW.last_edited_by
      );
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO change_logs (TABLE_NAME, row_id, change_type, description, change_owner)
    VALUES
    (
      'Kurbanlıklar',
      CAST (OLD.sacrifice_no AS TEXT),
      'Silme',
      'Kurban kaydı silindi: Kurban Numarası: ' || OLD.sacrifice_no || ', Hisse Bedeli: ' || OLD.share_price || ', Kesim Zamanı: ' || OLD.sacrifice_time,
      OLD.last_edited_by
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$BODY$ LANGUAGE plpgsql VOLATILE COST 100;

CREATE TRIGGER trigger_sacrifice_changes
AFTER INSERT OR UPDATE OR DELETE ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION log_sacrifice_changes();
