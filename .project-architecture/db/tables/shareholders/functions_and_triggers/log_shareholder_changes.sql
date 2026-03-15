-- ===============================================
-- Açıklama: shareholders tablosundaki tüm değişiklikleri (ekleme,
--           güncelleme, silme) change_logs tablosuna kaydeder. Hissedar
--           adı, telefon, tutar, teslimat noktası gibi alanları izler.
--           sacrifice_year sacrifice_animals tablosundan alınır.
-- Trigger   : trigger_shareholder_changes (AFTER INSERT OR UPDATE OR DELETE)
-- ===============================================

CREATE OR REPLACE FUNCTION "public"."log_shareholder_changes"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
DECLARE
  v_sacrifice_year INT2;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        SELECT sa.sacrifice_year INTO v_sacrifice_year
        FROM sacrifice_animals sa
        WHERE sa.sacrifice_id = NEW.sacrifice_id;
    ELSE
        SELECT sa.sacrifice_year INTO v_sacrifice_year
        FROM sacrifice_animals sa
        WHERE sa.sacrifice_id = OLD.sacrifice_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
        VALUES (
            'Hissedarlar',
            CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
            'Ekleme',
            'Yeni hissedar eklendi: Hissedar Adı = ' || NEW.shareholder_name || ' (Kurban Numarası = ' || NEW.sacrifice_id || ')',
            NEW.last_edited_by,
            NEW.tenant_id,
            v_sacrifice_year
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW.shareholder_name <> OLD.shareholder_name THEN
            INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
            VALUES (
                'Hissedarlar',
                CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
                'Hissedar Adı',
                OLD.shareholder_name,
                NEW.shareholder_name,
                'Güncelleme',
                'Hissedar adı ' || OLD.shareholder_name || ' değerinden ' || NEW.shareholder_name || ' değerine değişti.',
                NEW.last_edited_by,
                NEW.tenant_id,
                v_sacrifice_year
            );
        END IF;

        IF NEW.phone_number <> OLD.phone_number THEN
            INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
            VALUES (
                'Hissedarlar',
                CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
                'Telefon Numarası',
                OLD.phone_number,
                NEW.phone_number,
                'Güncelleme',
                'Telefon numarası ' || OLD.phone_number || ' numarasından ' || NEW.phone_number || ' numarasına değişti.',
                NEW.last_edited_by,
                NEW.tenant_id,
                v_sacrifice_year
            );
        END IF;

        IF NEW.total_amount <> OLD.total_amount THEN
            INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
            VALUES (
                'Hissedarlar',
                CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
                'Toplam Tutar',
                CAST(OLD.total_amount AS TEXT),
                CAST(NEW.total_amount AS TEXT),
                'Güncelleme',
                'Toplam tutar ' || OLD.total_amount || ' değerinden ' || NEW.total_amount || ' değerine değişti.',
                NEW.last_edited_by,
                NEW.tenant_id,
                v_sacrifice_year
            );
        END IF;

        IF NEW.paid_amount <> OLD.paid_amount THEN
            INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
            VALUES (
                'Hissedarlar',
                CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
                'Ödenen Tutar',
                CAST(OLD.paid_amount AS TEXT),
                CAST(NEW.paid_amount AS TEXT),
                'Güncelleme',
                'Ödenen tutar ' || OLD.paid_amount || ' değerinden ' || NEW.paid_amount || ' değerine değişti.',
                NEW.last_edited_by,
                NEW.tenant_id,
                v_sacrifice_year
            );
        END IF;

        IF NEW.delivery_location <> OLD.delivery_location THEN
            INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
            VALUES (
                'Hissedarlar',
                CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
                'Teslimat Noktası',
                OLD.delivery_location,
                NEW.delivery_location,
                'Güncelleme',
                'Teslimat ' || OLD.delivery_location || ' yerine ' || NEW.delivery_location || ' noktasında yapılacak.',
                NEW.last_edited_by,
                NEW.tenant_id,
                v_sacrifice_year
            );
        END IF;

        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
        VALUES (
            'Hissedarlar',
            CONCAT(OLD.shareholder_name, ' (', OLD.sacrifice_id, ')'),
            'Silme',
            'Hissedar kaydı silindi: Hissedar Adı = ' || OLD.shareholder_name || ' (Kurban Numarası = ' || OLD.sacrifice_id || ')',
            OLD.last_edited_by,
            OLD.tenant_id,
            v_sacrifice_year
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE COST 100;

CREATE TRIGGER trigger_shareholder_changes
AFTER INSERT OR UPDATE OR DELETE ON shareholders
FOR EACH ROW
EXECUTE FUNCTION log_shareholder_changes();
