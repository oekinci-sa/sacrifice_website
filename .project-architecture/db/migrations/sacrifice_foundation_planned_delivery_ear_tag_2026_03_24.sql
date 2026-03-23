-- Planlı teslim saati (planlı kesim + 1,5 saat), otomatik küpe etiketi, vakıf alanı

ALTER TABLE public.sacrifice_animals
  ADD COLUMN IF NOT EXISTS foundation text;

ALTER TABLE public.sacrifice_animals
  DROP CONSTRAINT IF EXISTS sacrifice_animals_foundation_check;

ALTER TABLE public.sacrifice_animals
  ADD CONSTRAINT sacrifice_animals_foundation_check
  CHECK (foundation IS NULL OR foundation IN ('AKV', 'İMH', 'AGD'));

-- Planlı kesim saatine (sacrifice_time) 90 dk eklenir (TIME taşması PG tarafından yönetilir)
ALTER TABLE public.sacrifice_animals
  ADD COLUMN IF NOT EXISTS planned_delivery_time time
  GENERATED ALWAYS AS (((sacrifice_time + interval '90 minutes')::time)) STORED;

ALTER TABLE public.sacrifice_animals
  ADD COLUMN IF NOT EXISTS ear_tag_display text
  GENERATED ALWAYS AS (
    (sacrifice_year::text || '-' || lpad(sacrifice_no::text, 4, '0'))
  ) STORED;

CREATE OR REPLACE FUNCTION public.rpc_update_sacrifice_core(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid,
  p_sacrifice_year int2,
  p_patch jsonb
)
RETURNS SETOF public.sacrifice_animals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  RETURN QUERY
  UPDATE public.sacrifice_animals sa
  SET
    sacrifice_no = CASE WHEN p_patch ? 'sacrifice_no' THEN (p_patch->>'sacrifice_no')::int2 ELSE sa.sacrifice_no END,
    sacrifice_time = CASE WHEN p_patch ? 'sacrifice_time' THEN (p_patch->>'sacrifice_time')::time ELSE sa.sacrifice_time END,
    share_weight = CASE WHEN p_patch ? 'share_weight' THEN (p_patch->>'share_weight')::int2 ELSE sa.share_weight END,
    share_price = CASE WHEN p_patch ? 'share_price' THEN (p_patch->>'share_price')::numeric ELSE sa.share_price END,
    empty_share = CASE WHEN p_patch ? 'empty_share' THEN (p_patch->>'empty_share')::int2 ELSE sa.empty_share END,
    animal_type = CASE WHEN p_patch ? 'animal_type' THEN NULLIF(trim(p_patch->>'animal_type'), '')::text ELSE sa.animal_type END,
    notes = CASE WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text ELSE sa.notes END,
    foundation = CASE
      WHEN NOT (p_patch ? 'foundation') THEN sa.foundation
      WHEN p_patch->'foundation' IS NULL OR jsonb_typeof(p_patch->'foundation') = 'null' THEN NULL
      ELSE NULLIF(trim(p_patch->>'foundation'), '')
    END,
    slaughter_time = CASE
      WHEN NOT (p_patch ? 'slaughter_time') THEN sa.slaughter_time
      WHEN p_patch->'slaughter_time' IS NULL OR jsonb_typeof(p_patch->'slaughter_time') = 'null' THEN NULL
      ELSE (p_patch->>'slaughter_time')::timestamptz
    END,
    butcher_time = CASE
      WHEN NOT (p_patch ? 'butcher_time') THEN sa.butcher_time
      WHEN p_patch->'butcher_time' IS NULL OR jsonb_typeof(p_patch->'butcher_time') = 'null' THEN NULL
      ELSE (p_patch->>'butcher_time')::timestamptz
    END,
    delivery_time = CASE
      WHEN NOT (p_patch ? 'delivery_time') THEN sa.delivery_time
      WHEN p_patch->'delivery_time' IS NULL OR jsonb_typeof(p_patch->'delivery_time') = 'null' THEN NULL
      ELSE (p_patch->>'delivery_time')::timestamptz
    END,
    last_edited_by = CASE WHEN p_patch ? 'last_edited_by' THEN (p_patch->>'last_edited_by')::text ELSE sa.last_edited_by END,
    last_edited_time = CASE WHEN p_patch ? 'last_edited_time' THEN (p_patch->>'last_edited_time')::timestamptz ELSE sa.last_edited_time END
  WHERE sa.tenant_id = p_tenant_id
    AND sa.sacrifice_id = p_sacrifice_id
    AND sa.sacrifice_year = p_sacrifice_year
  RETURNING sa.*;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) TO service_role;

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
      'Kurbanlıklar',
      CAST(NEW.sacrifice_no AS TEXT),
      'Ekleme',
      'Listeye yeni kurbanlık eklendi. Sıra no: ' || NEW.sacrifice_no || ', planlanan kesim saati: ' || COALESCE(NEW.sacrifice_time::text, '—') || ', hisse bedeli: ' || NEW.share_price || ' ₺, boş hisse: ' || COALESCE(NEW.empty_share::text, '—') || ', cins: ' || COALESCE(NEW.animal_type, '—') || '.',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Kurban Numarası',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hisse Ağırlığı (kg)',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hisse Bedeli',
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
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Boş Hisse',
        CAST(OLD.empty_share AS TEXT),
        CAST(NEW.empty_share AS TEXT),
        'Güncelleme',
        'Satılmayı bekleyen boş hisse sayısı: ' || COALESCE(OLD.empty_share::text, '—') || ' → ' || COALESCE(NEW.empty_share::text, '—') || ' (her kurbanlıkta en fazla 7 hisse).',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Notlar',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hayvan Cinsi',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Vakıf',
        COALESCE(OLD.foundation, ''),
        COALESCE(NEW.foundation, ''),
        'Güncelleme',
        'Vakıf bilgisi güncellendi: ' || COALESCE(OLD.foundation, '—') || ' → ' || COALESCE(NEW.foundation, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Kesim Zamanı',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Kesim Saati',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Parçalama Saati',
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
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Teslimat Saati',
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
      'Kurbanlıklar',
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
