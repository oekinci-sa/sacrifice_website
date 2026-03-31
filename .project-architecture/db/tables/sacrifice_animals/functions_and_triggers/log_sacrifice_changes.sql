-- =============================================================================
-- BİRLEŞTİRİLMİŞ ÇIKTI — elle düzenleme yok
-- Kaynak: log_sacrifice_changes/fragments/*.sql
-- Yenileme: npm run db:merge:log-sacrifice-changes
-- =============================================================================

-- sacrifice_animals → change_logs (okunabilir Türkçe özetler)
-- change_owner: önce app.actor (RPC), yoksa last_edited_by

CREATE OR REPLACE FUNCTION public.log_sacrifice_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_corr text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'sacrifice_animals',
      CAST(NEW.sacrifice_no AS TEXT),
      'Ekleme',
      'Listeye yeni kurbanlık eklendi. Sıra no: ' || NEW.sacrifice_no || ', planlanan kesim saati: ' || COALESCE(NEW.sacrifice_time::text, '—') || ', hisse bedeli: ' ||
        CASE
          WHEN NEW.pricing_mode = 'live_scale' THEN
            'Canlı baskül' || CASE WHEN NEW.live_scale_total_price IS NOT NULL THEN ' (toplam ' || NEW.live_scale_total_price::text || ' ₺)' ELSE '' END
          ELSE COALESCE(NEW.share_price::text, '—') || ' ₺'
        END || ', boş hisse: ' || COALESCE(NEW.empty_share::text, '—') || ', cins: ' || COALESCE(NEW.animal_type, '—') || '.',
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
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');

    IF NEW.sacrifice_no IS DISTINCT FROM OLD.sacrifice_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'sacrifice_no',
        CAST(OLD.sacrifice_no AS TEXT),
        CAST(NEW.sacrifice_no AS TEXT),
        'Güncelleme',
        'Kurbanlığın sıra numarası değiştirildi: ' || OLD.sacrifice_no || ' → ' || NEW.sacrifice_no || '. (Tüm ekranlarda görünen numara budur.)',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_weight IS DISTINCT FROM OLD.share_weight THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'share_weight',
        CAST(OLD.share_weight AS TEXT),
        CAST(NEW.share_weight AS TEXT),
        'Güncelleme',
        'Standart hisse ağırlığı (kg) güncellendi: ' || COALESCE(OLD.share_weight::text, '—') || ' kg → ' || COALESCE(NEW.share_weight::text, '—') || ' kg.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'share_price',
        CAST(OLD.share_price AS TEXT),
        CAST(NEW.share_price AS TEXT),
        'Güncelleme',
        'Tek hissenin satış bedeli değişti: ' || COALESCE(OLD.share_price::text, '—') || ' ₺ → ' || COALESCE(NEW.share_price::text, '—') || ' ₺.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.empty_share IS DISTINCT FROM OLD.empty_share THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'empty_share',
        CAST(OLD.empty_share AS TEXT),
        CAST(NEW.empty_share AS TEXT),
        'Güncelleme',
        'Satılmayı bekleyen boş hisse sayısı: ' || COALESCE(OLD.empty_share::text, '—') || ' → ' || COALESCE(NEW.empty_share::text, '—') || ' (her kurbanlıkta en fazla 7 hisse).'
          || CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN ' Bu güncelleme aynı işlemdeki hissedar silme/taşıma ile ilişkilidir (detay satırı).' ELSE '' END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN 'detail'::text ELSE NULL END
      );
    END IF;

    IF NEW.pricing_mode IS DISTINCT FROM OLD.pricing_mode THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'pricing_mode',
        COALESCE(OLD.pricing_mode::text, '—'),
        COALESCE(NEW.pricing_mode::text, '—'),
        'Güncelleme',
        'Fiyatlama modu güncellendi: ' || COALESCE(OLD.pricing_mode::text, '—') || ' → ' || COALESCE(NEW.pricing_mode::text, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.live_scale_total_kg IS DISTINCT FROM OLD.live_scale_total_kg THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'live_scale_total_kg',
        COALESCE(OLD.live_scale_total_kg::text, '—'),
        COALESCE(NEW.live_scale_total_kg::text, '—'),
        'Güncelleme',
        'Canlı baskül toplam ağırlık (kg): ' || COALESCE(OLD.live_scale_total_kg::text, '—') || ' → ' || COALESCE(NEW.live_scale_total_kg::text, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.live_scale_total_price IS DISTINCT FROM OLD.live_scale_total_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'live_scale_total_price',
        COALESCE(OLD.live_scale_total_price::text, '—'),
        COALESCE(NEW.live_scale_total_price::text, '—'),
        'Güncelleme',
        'Canlı baskül toplam tutar: ' || COALESCE(OLD.live_scale_total_price::text, '—') || ' ₺ → ' || COALESCE(NEW.live_scale_total_price::text, '—') || ' ₺.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;
    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'notes',
        OLD.notes,
        NEW.notes,
        'Güncelleme',
        'Bu kurbanlık için yönetici notları güncellendi.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.animal_type IS DISTINCT FROM OLD.animal_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'animal_type',
        COALESCE(OLD.animal_type, ''),
        COALESCE(NEW.animal_type, ''),
        'Güncelleme',
        'Hayvan cinsi değiştirildi: ' || COALESCE(OLD.animal_type, '—') || ' → ' || COALESCE(NEW.animal_type, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.foundation IS DISTINCT FROM OLD.foundation THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'foundation',
        COALESCE(OLD.foundation, ''),
        COALESCE(NEW.foundation, ''),
        'Güncelleme',
        'Vakıf bilgisi güncellendi: ' || COALESCE(OLD.foundation, '—') || ' → ' || COALESCE(NEW.foundation, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.ear_tag IS DISTINCT FROM OLD.ear_tag THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'ear_tag',
        COALESCE(OLD.ear_tag, ''),
        COALESCE(NEW.ear_tag, ''),
        'Güncelleme',
        'Küpe numarası güncellendi: ' || COALESCE(NULLIF(trim(OLD.ear_tag), ''), '—') || ' → ' || COALESCE(NULLIF(trim(NEW.ear_tag), ''), '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.barn_stall_order_no IS DISTINCT FROM OLD.barn_stall_order_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'barn_stall_order_no',
        COALESCE(OLD.barn_stall_order_no, ''),
        COALESCE(NEW.barn_stall_order_no, ''),
        'Güncelleme',
        'Ahır sıra numarası güncellendi: ' || COALESCE(NULLIF(trim(OLD.barn_stall_order_no), ''), '—') || ' → ' || COALESCE(NULLIF(trim(NEW.barn_stall_order_no), ''), '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'sacrifice_time',
        CAST(OLD.sacrifice_time AS TEXT),
        CAST(NEW.sacrifice_time AS TEXT),
        'Güncelleme',
        'Programdaki planlanan kesim saati değişti: ' || COALESCE(OLD.sacrifice_time::text, '—') || ' → ' || COALESCE(NEW.sacrifice_time::text, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'slaughter_time',
        CAST(OLD.slaughter_time AS TEXT),
        CAST(NEW.slaughter_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.slaughter_time IS NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesim aşaması tamamlandı olarak işaretlendi; gerçekleşen saat: ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || '.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NULL THEN
            'Daha önce kayıtlı kesim saati (' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ') kaldırıldı — süreç sıfırlandı sayılır.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesimin gerçekleştiği saat düzeltildi: ' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ' → ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || '.'
          ELSE
            'Kesim saati bilgisi güncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'butcher_time',
        CAST(OLD.butcher_time AS TEXT),
        CAST(NEW.butcher_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.butcher_time IS NULL AND NEW.butcher_time IS NOT NULL THEN
            'Parçalama (kıyma) aşaması tamamlandı; saat: ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || '.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NULL THEN
            'Kayıtlı parçalama saati (' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ') silindi.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NOT NULL THEN
            'Parçalama saati güncellendi: ' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ' → ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || '.'
          ELSE
            'Parçalama saati bilgisi güncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'delivery_time',
        CAST(OLD.delivery_time AS TEXT),
        CAST(NEW.delivery_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.delivery_time IS NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat tamamlandı olarak işaretlendi; saat: ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || '.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NULL THEN
            'Kayıtlı teslimat saati (' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ') kaldırıldı.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat saati güncellendi: ' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ' → ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || '.'
          ELSE
            'Teslimat saati bilgisi güncellendi.'
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
      'sacrifice_animals',
      CAST(OLD.sacrifice_no AS TEXT),
      'Silme',
      'Kurbanlık kaydı tamamen silindi (sıra no ' || OLD.sacrifice_no || '). Bağlı hissedar ve rezervasyon satırları da temizlendi.',
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
