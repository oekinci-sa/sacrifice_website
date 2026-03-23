-- shareholders â†’ change_logs; change_owner = app.actor (RPC) veya last_edited_by
-- AÃ§Ä±klamalar: admin panelinde okunabilir TÃ¼rkÃ§e Ã¶zetler

CREATE OR REPLACE FUNCTION public.log_shareholder_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_sacrifice_year INT2;
  v_sacrifice_no INT2;
  v_old_sac_no INT2;
  v_new_sac_no INT2;
  v_owner text;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    SELECT sa.sacrifice_year, sa.sacrifice_no
    INTO v_sacrifice_year, v_sacrifice_no
    FROM sacrifice_animals sa
    WHERE sa.sacrifice_id = NEW.sacrifice_id;
  ELSE
    SELECT sa.sacrifice_year, sa.sacrifice_no
    INTO v_sacrifice_year, v_sacrifice_no
    FROM sacrifice_animals sa
    WHERE sa.sacrifice_id = OLD.sacrifice_id;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hissedarlar',
      CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
      'Ekleme',
      'Yeni hissedar kaydÄ± aÃ§Ä±ldÄ±: Â«' || NEW.shareholder_name || 'Â». BaÄŸlÄ± kurbanlÄ±k sÄ±ra no: ' || COALESCE(v_sacrifice_no::text, 'â€”') || '.',
      v_owner,
      NEW.tenant_id,
      v_sacrifice_year
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );

    IF NEW.shareholder_name IS DISTINCT FROM OLD.shareholder_name THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Hissedar AdÄ±',
        OLD.shareholder_name, NEW.shareholder_name, 'GÃ¼ncelleme',
        'Hissedar gÃ¶rÃ¼nen adÄ± deÄŸiÅŸti: Â«' || COALESCE(OLD.shareholder_name, 'â€”') || 'Â» â†’ Â«' || COALESCE(NEW.shareholder_name, 'â€”') || 'Â». Kurban sÄ±ra: ' || COALESCE(v_sacrifice_no::text, 'â€”') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Telefon NumarasÄ±',
        OLD.phone_number, NEW.phone_number, 'GÃ¼ncelleme',
        'Birinci telefon gÃ¼ncellendi. Ã–nce: ' || COALESCE(OLD.phone_number, 'yok') || ', ÅŸimdi: ' || COALESCE(NEW.phone_number, 'yok') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.second_phone_number IS DISTINCT FROM OLD.second_phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Ä°kinci Telefon',
        OLD.second_phone_number, NEW.second_phone_number, 'GÃ¼ncelleme',
        'Ä°kinci / yedek telefon gÃ¼ncellendi. Ã–nce: ' || COALESCE(OLD.second_phone_number, 'yok') || ', ÅŸimdi: ' || COALESCE(NEW.second_phone_number, 'yok') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Toplam Tutar',
        CAST(OLD.total_amount AS TEXT), CAST(NEW.total_amount AS TEXT), 'GÃ¼ncelleme',
        'Hissiye dÃ¼ÅŸen toplam tutar (hisse + teslimat) deÄŸiÅŸti: ' || COALESCE(OLD.total_amount::text, 'â€”') || ' â‚º â†’ ' || COALESCE(NEW.total_amount::text, 'â€”') || ' â‚º.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Ã–denen Tutar',
        CAST(OLD.paid_amount AS TEXT), CAST(NEW.paid_amount AS TEXT), 'GÃ¼ncelleme',
        'Ã–denen tutar gÃ¼ncellendi: ' || COALESCE(OLD.paid_amount::text, '0') || ' â‚º â†’ ' || COALESCE(NEW.paid_amount::text, '0') || ' â‚º.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.remaining_payment IS DISTINCT FROM OLD.remaining_payment THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Kalan Ã–deme',
        CAST(OLD.remaining_payment AS TEXT), CAST(NEW.remaining_payment AS TEXT), 'GÃ¼ncelleme',
        'Kalan Ã¶deme tutarÄ±: ' || COALESCE(OLD.remaining_payment::text, 'â€”') || ' â‚º â†’ ' || COALESCE(NEW.remaining_payment::text, 'â€”') || ' â‚º.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Ãœcreti',
        CAST(OLD.delivery_fee AS TEXT), CAST(NEW.delivery_fee AS TEXT), 'GÃ¼ncelleme',
        'Teslimat Ã¼creti: ' || COALESCE(OLD.delivery_fee::text, 'â€”') || ' â‚º â†’ ' || COALESCE(NEW.delivery_fee::text, 'â€”') || ' â‚º.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_location IS DISTINCT FROM OLD.delivery_location THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat NoktasÄ±',
        OLD.delivery_location, NEW.delivery_location, 'GÃ¼ncelleme',
        'Teslimat adresi veya noktasÄ± deÄŸiÅŸti: Â«' || COALESCE(OLD.delivery_location, 'belirtilmemiÅŸ') || 'Â» â†’ Â«' || COALESCE(NEW.delivery_location, 'belirtilmemiÅŸ') || 'Â».',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Tipi',
        OLD.delivery_type, NEW.delivery_type, 'GÃ¼ncelleme',
        'Teslimat ÅŸekli gÃ¼ncellendi (kesimhane / adrese / vb.): Â«' || COALESCE(OLD.delivery_type, 'â€”') || 'Â» â†’ Â«' || COALESCE(NEW.delivery_type, 'â€”') || 'Â».',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_consent IS DISTINCT FROM OLD.sacrifice_consent THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Vekalet',
        CAST(OLD.sacrifice_consent AS TEXT), CAST(NEW.sacrifice_consent AS TEXT), 'GÃ¼ncelleme',
        'Kurban vekaleti / onay kaydÄ± gÃ¼ncellendi: ' || CASE WHEN OLD.sacrifice_consent THEN 'onaylÄ±ydÄ±' ELSE 'onaysÄ±zdÄ±' END || ' â†’ ' || CASE WHEN NEW.sacrifice_consent THEN 'onaylÄ±' ELSE 'onaysÄ±z' END || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Notlar',
        OLD.notes, NEW.notes, 'GÃ¼ncelleme',
        'Bu hissedar iÃ§in not metni deÄŸiÅŸtirildi (detay eski/yeni sÃ¼tunlarda).',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'E-posta',
        OLD.email, NEW.email, 'GÃ¼ncelleme',
        'Hissedar e-posta adresi gÃ¼ncellendi: ' || COALESCE(OLD.email, 'yok') || ' â†’ ' || COALESCE(NEW.email, 'yok') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.security_code IS DISTINCT FROM OLD.security_code THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'GÃ¼venlik Kodu',
        OLD.security_code, NEW.security_code, 'GÃ¼ncelleme',
        'Hisse sorgulamada kullanÄ±lan 6 haneli gÃ¼venlik kodu yenilendi (eski ve yeni deÄŸer kayÄ±tta).',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.contacted_at IS DISTINCT FROM OLD.contacted_at THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'GÃ¶rÃ¼ÅŸÃ¼ldÃ¼',
        CAST(OLD.contacted_at AS TEXT), CAST(NEW.contacted_at AS TEXT), 'GÃ¼ncelleme',
        'Â«GÃ¶rÃ¼ÅŸÃ¼ldÃ¼Â» iÅŸareti veya gÃ¶rÃ¼ÅŸme tarihi gÃ¼ncellendi; arama takibinde kullanÄ±lÄ±r.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_id IS DISTINCT FROM OLD.sacrifice_id
       OR NEW.sacrifice_year IS DISTINCT FROM OLD.sacrifice_year THEN
      SELECT sa.sacrifice_no INTO v_old_sac_no FROM sacrifice_animals sa WHERE sa.sacrifice_id = OLD.sacrifice_id;
      SELECT sa.sacrifice_no INTO v_new_sac_no FROM sacrifice_animals sa WHERE sa.sacrifice_id = NEW.sacrifice_id;
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'BaÄŸlÄ± KurbanlÄ±k',
        COALESCE(v_old_sac_no::text, 'â€”'), COALESCE(v_new_sac_no::text, 'â€”'), 'GÃ¼ncelleme',
        'Hissedar baÅŸka kurbanlÄ±ÄŸa taÅŸÄ±ndÄ±: kurban sÄ±ra no ' || COALESCE(v_old_sac_no::text, 'â€”') || ' â†’ ' || COALESCE(v_new_sac_no::text, 'â€”') || ' (boÅŸ hisse ve tutarlar gÃ¼ncellendi).',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hissedarlar',
      CONCAT(OLD.shareholder_name, ' (', OLD.sacrifice_id, ')'),
      'Silme',
      'Hissedar kaydÄ± silindi veya kurbanlÄ±kla birlikte kaldÄ±rÄ±ldÄ±: Â«' || OLD.shareholder_name || 'Â». Kurban sÄ±ra no: ' || COALESCE(v_sacrifice_no::text, 'â€”') || '.',
      v_owner,
      OLD.tenant_id,
      v_sacrifice_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_shareholder_changes ON public.shareholders;

CREATE TRIGGER trigger_shareholder_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shareholders
  FOR EACH ROW
  EXECUTE FUNCTION log_shareholder_changes();

