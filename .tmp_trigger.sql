-- sacrifice_animals â†’ change_logs (okunabilir TÃ¼rkÃ§e Ã¶zetler)
-- change_owner: Ã¶nce app.actor (RPC), yoksa last_edited_by

CREATE OR REPLACE FUNCTION public.log_sacrifice_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'KurbanlÄ±klar',
      CAST(NEW.sacrifice_no AS TEXT),
      'Ekleme',
      'Listeye yeni kurbanlÄ±k eklendi. SÄ±ra no: ' || NEW.sacrifice_no || ', planlanan kesim saati: ' || COALESCE(NEW.sacrifice_time::text, 'â€”') || ', hisse bedeli: ' || NEW.share_price || ' â‚º, boÅŸ hisse: ' || COALESCE(NEW.empty_share::text, 'â€”') || ', cins: ' || COALESCE(NEW.animal_type, 'â€”') || '.',
      v_owner,
      NEW.tenant_id,
      NEW.sacrifice_year
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );

    IF NEW.sacrifice_no IS DISTINCT FROM OLD.sacrifice_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Kurban NumarasÄ±',
        CAST(OLD.sacrifice_no AS TEXT),
        CAST(NEW.sacrifice_no AS TEXT),
        'GÃ¼ncelleme',
        'KurbanlÄ±ÄŸÄ±n sÄ±ra numarasÄ± deÄŸiÅŸtirildi: ' || OLD.sacrifice_no || ' â†’ ' || NEW.sacrifice_no || '. (TÃ¼m ekranlarda gÃ¶rÃ¼nen numara budur.)',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_weight IS DISTINCT FROM OLD.share_weight THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hisse AÄŸÄ±rlÄ±ÄŸÄ± (kg)',
        CAST(OLD.share_weight AS TEXT),
        CAST(NEW.share_weight AS TEXT),
        'GÃ¼ncelleme',
        'Standart hisse aÄŸÄ±rlÄ±ÄŸÄ± (kg) gÃ¼ncellendi: ' || COALESCE(OLD.share_weight::text, 'â€”') || ' kg â†’ ' || COALESCE(NEW.share_weight::text, 'â€”') || ' kg.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hisse Bedeli',
        CAST(OLD.share_price AS TEXT),
        CAST(NEW.share_price AS TEXT),
        'GÃ¼ncelleme',
        'Tek hissenin satÄ±ÅŸ bedeli deÄŸiÅŸti: ' || COALESCE(OLD.share_price::text, 'â€”') || ' â‚º â†’ ' || COALESCE(NEW.share_price::text, 'â€”') || ' â‚º.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.empty_share IS DISTINCT FROM OLD.empty_share THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'BoÅŸ Hisse',
        CAST(OLD.empty_share AS TEXT),
        CAST(NEW.empty_share AS TEXT),
        'GÃ¼ncelleme',
        'SatÄ±lmayÄ± bekleyen boÅŸ hisse sayÄ±sÄ±: ' || COALESCE(OLD.empty_share::text, 'â€”') || ' â†’ ' || COALESCE(NEW.empty_share::text, 'â€”') || ' (her kurbanlÄ±kta en fazla 7 hisse).',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Notlar',
        OLD.notes,
        NEW.notes,
        'GÃ¼ncelleme',
        'Bu kurbanlÄ±k iÃ§in yÃ¶netici notlarÄ± gÃ¼ncellendi.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.animal_type IS DISTINCT FROM OLD.animal_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hayvan Cinsi',
        COALESCE(OLD.animal_type, ''),
        COALESCE(NEW.animal_type, ''),
        'GÃ¼ncelleme',
        'Hayvan cinsi deÄŸiÅŸtirildi: ' || COALESCE(OLD.animal_type, 'â€”') || ' â†’ ' || COALESCE(NEW.animal_type, 'â€”') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Kesim ZamanÄ±',
        CAST(OLD.sacrifice_time AS TEXT),
        CAST(NEW.sacrifice_time AS TEXT),
        'GÃ¼ncelleme',
        'Programdaki planlanan kesim saati deÄŸiÅŸti: ' || COALESCE(OLD.sacrifice_time::text, 'â€”') || ' â†’ ' || COALESCE(NEW.sacrifice_time::text, 'â€”') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Kesim Saati',
        CAST(OLD.slaughter_time AS TEXT),
        CAST(NEW.slaughter_time AS TEXT),
        'GÃ¼ncelleme',
        CASE
          WHEN OLD.slaughter_time IS NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesim aÅŸamasÄ± tamamlandÄ± olarak iÅŸaretlendi; gerÃ§ekleÅŸen saat: ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || '.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NULL THEN
            'Daha Ã¶nce kayÄ±tlÄ± kesim saati (' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ') kaldÄ±rÄ±ldÄ± â€” sÃ¼reÃ§ sÄ±fÄ±rlandÄ± sayÄ±lÄ±r.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesimin gerÃ§ekleÅŸtiÄŸi saat dÃ¼zeltildi: ' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ' â†’ ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || '.'
          ELSE
            'Kesim saati bilgisi gÃ¼ncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'ParÃ§alama Saati',
        CAST(OLD.butcher_time AS TEXT),
        CAST(NEW.butcher_time AS TEXT),
        'GÃ¼ncelleme',
        CASE
          WHEN OLD.butcher_time IS NULL AND NEW.butcher_time IS NOT NULL THEN
            'ParÃ§alama (kÄ±yma) aÅŸamasÄ± tamamlandÄ±; saat: ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || '.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NULL THEN
            'KayÄ±tlÄ± parÃ§alama saati (' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ') silindi.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NOT NULL THEN
            'ParÃ§alama saati gÃ¼ncellendi: ' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ' â†’ ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || '.'
          ELSE
            'ParÃ§alama saati bilgisi gÃ¼ncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'KurbanlÄ±klar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Teslimat Saati',
        CAST(OLD.delivery_time AS TEXT),
        CAST(NEW.delivery_time AS TEXT),
        'GÃ¼ncelleme',
        CASE
          WHEN OLD.delivery_time IS NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat tamamlandÄ± olarak iÅŸaretlendi; saat: ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || '.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NULL THEN
            'KayÄ±tlÄ± teslimat saati (' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ') kaldÄ±rÄ±ldÄ±.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat saati gÃ¼ncellendi: ' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ' â†’ ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || '.'
          ELSE
            'Teslimat saati bilgisi gÃ¼ncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
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
      'KurbanlÄ±klar',
      CAST(OLD.sacrifice_no AS TEXT),
      'Silme',
      'KurbanlÄ±k kaydÄ± tamamen silindi (sÄ±ra no ' || OLD.sacrifice_no || '). BaÄŸlÄ± hissedar ve rezervasyon satÄ±rlarÄ± da temizlendi.',
      v_owner,
      OLD.tenant_id,
      OLD.sacrifice_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_sacrifice_changes ON public.sacrifice_animals;

CREATE TRIGGER trigger_sacrifice_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.sacrifice_animals
  FOR EACH ROW
  EXECUTE FUNCTION log_sacrifice_changes();

