-- =============================================================================
-- TEK SEFERDE ÇALIŞTIR (Supabase SQL Editor / psql)
-- Dosya: supabase-single-run-change-logs-extras-planned-delivery.sql
-- Yenileme: node scripts/build-supabase-single-run-extras.mjs
--
-- İçerik:
--  A) change_logs: NULL standardı + change_type CHECK + row_id indeksi
--  B) sacrifice_animals.planned_delivery_time: GENERATED → düzenlenebilir TIME + INSERT tetikleyici
--  C) rpc_update_sacrifice_core (planlı teslim + kesimde +90 dk senkron)
--  D) log_sacrifice_changes + trigger (planned_delivery_time denetim kaydı)
--
-- Önkoşul: Henüz çalıştırmadıysanız önce change-logs-audit-triggers-bundle.sql (audit tetikleyiciler).
-- Bu betikteki (D) bölümü log_sacrifice_changes'i günceller; tetikleyiciler eskiyse birlikte uygulayın.
-- =============================================================================

-- =============================================================================
-- change_logs — İYİLEŞTİRME MİGRATIONU
-- Dosya: change-logs-audit-sql-bundle-migration.sql
-- Supabase SQL editöründe veya psql ile çalıştırın.
-- Sırayla uygulanabilir; her adım bağımsız.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. NULL standardı: old_value ve new_value
--    '' (boş string) ve '—' (görsel tire) → NULL
--    description ve diğer metin kolonlarına DOKUNULMAZ.
-- ---------------------------------------------------------------------------

UPDATE public.change_logs
SET old_value = NULL
WHERE old_value = '' OR old_value = '—';

UPDATE public.change_logs
SET new_value = NULL
WHERE new_value = '' OR new_value = '—';

-- ---------------------------------------------------------------------------
-- 2. change_type CHECK kısıtı
--    Trigger'lar zaten Türkçe sabit değerler üretiyor; DB seviyesinde garanti.
-- ---------------------------------------------------------------------------

ALTER TABLE public.change_logs
  DROP CONSTRAINT IF EXISTS chk_change_type;

ALTER TABLE public.change_logs
  ADD CONSTRAINT chk_change_type
  CHECK (change_type IN ('Ekleme', 'Güncelleme', 'Silme'));

-- ---------------------------------------------------------------------------
-- 3. row_id indeksi (UI kayıt bazlı filtre performansı için)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_change_logs_row_id
  ON public.change_logs (tenant_id, table_name, row_id);

-- =============================================================================
-- Kontrol sorgusu (çalıştırmak zorunda değilsiniz):
-- SELECT change_type, COUNT(*) FROM change_logs GROUP BY change_type;
-- SELECT COUNT(*) FROM change_logs WHERE old_value = '' OR old_value = '—';
-- SELECT COUNT(*) FROM change_logs WHERE new_value = '' OR new_value = '—';
-- =============================================================================


-- =============================================================================
-- B) planned_delivery_time: artık GENERATED değil; düzenlenebilir TIME
-- =============================================================================

ALTER TABLE public.sacrifice_animals
  DROP COLUMN IF EXISTS planned_delivery_time;

ALTER TABLE public.sacrifice_animals
  ADD COLUMN planned_delivery_time TIME;

UPDATE public.sacrifice_animals
SET planned_delivery_time = (sacrifice_time + interval '90 minutes')::time
WHERE planned_delivery_time IS NULL;

ALTER TABLE public.sacrifice_animals
  ALTER COLUMN planned_delivery_time SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_planned_delivery_time_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $tr$
BEGIN
  IF NEW.planned_delivery_time IS NULL THEN
    NEW.planned_delivery_time := (NEW.sacrifice_time + interval '90 minutes')::time;
  END IF;
  RETURN NEW;
END;
$tr$;

DROP TRIGGER IF EXISTS trg_sacrifice_animals_planned_delivery_bi ON public.sacrifice_animals;

CREATE TRIGGER trg_sacrifice_animals_planned_delivery_bi
  BEFORE INSERT ON public.sacrifice_animals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_planned_delivery_time_on_insert();

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
DECLARE
  r public.sacrifice_animals%ROWTYPE;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  FOR r IN
    UPDATE public.sacrifice_animals sa
    SET
      sacrifice_no = CASE WHEN p_patch ? 'sacrifice_no' THEN (p_patch->>'sacrifice_no')::int2 ELSE sa.sacrifice_no END,
      sacrifice_time = CASE WHEN p_patch ? 'sacrifice_time' THEN (p_patch->>'sacrifice_time')::time ELSE sa.sacrifice_time END,
      share_weight = CASE
        WHEN (CASE WHEN p_patch ? 'pricing_mode' THEN trim(p_patch->>'pricing_mode') ELSE sa.pricing_mode END) = 'live_scale' THEN NULL
        WHEN p_patch ? 'share_weight' THEN
          CASE
            WHEN p_patch->'share_weight' IS NULL OR jsonb_typeof(p_patch->'share_weight') = 'null' THEN NULL
            ELSE (p_patch->>'share_weight')::int2
          END
        ELSE sa.share_weight
      END,
      share_price = CASE
        WHEN NOT (p_patch ? 'share_price') THEN sa.share_price
        WHEN p_patch->'share_price' IS NULL OR jsonb_typeof(p_patch->'share_price') = 'null' THEN NULL
        ELSE (p_patch->>'share_price')::numeric
      END,
      pricing_mode = CASE
        WHEN p_patch ? 'pricing_mode' THEN trim(p_patch->>'pricing_mode')::text
        ELSE sa.pricing_mode
      END,
      live_scale_total_kg = CASE
        WHEN NOT (p_patch ? 'live_scale_total_kg') THEN sa.live_scale_total_kg
        WHEN p_patch->'live_scale_total_kg' IS NULL OR jsonb_typeof(p_patch->'live_scale_total_kg') = 'null' THEN NULL
        ELSE (p_patch->>'live_scale_total_kg')::numeric
      END,
      live_scale_total_price = CASE
        WHEN NOT (p_patch ? 'live_scale_total_price') THEN sa.live_scale_total_price
        WHEN p_patch->'live_scale_total_price' IS NULL OR jsonb_typeof(p_patch->'live_scale_total_price') = 'null' THEN NULL
        ELSE (p_patch->>'live_scale_total_price')::numeric
      END,
      empty_share = CASE
        WHEN p_patch ? 'empty_share_delta' THEN (sa.empty_share + (p_patch->>'empty_share_delta')::int2)::int2
        WHEN p_patch ? 'empty_share'       THEN (p_patch->>'empty_share')::int2
        ELSE sa.empty_share
      END,
      animal_type = CASE WHEN p_patch ? 'animal_type' THEN NULLIF(trim(p_patch->>'animal_type'), '')::text ELSE sa.animal_type END,
      notes = CASE WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text ELSE sa.notes END,
      foundation = CASE
        WHEN NOT (p_patch ? 'foundation') THEN sa.foundation
        WHEN p_patch->'foundation' IS NULL OR jsonb_typeof(p_patch->'foundation') = 'null' THEN NULL
        ELSE NULLIF(trim(p_patch->>'foundation'), '')
      END,
      ear_tag = CASE
        WHEN NOT (p_patch ? 'ear_tag') THEN sa.ear_tag
        WHEN p_patch->'ear_tag' IS NULL OR jsonb_typeof(p_patch->'ear_tag') = 'null' THEN NULL
        ELSE NULLIF(trim(p_patch->>'ear_tag'), '')
      END,
      barn_stall_order_no = CASE
        WHEN NOT (p_patch ? 'barn_stall_order_no') THEN sa.barn_stall_order_no
        WHEN p_patch->'barn_stall_order_no' IS NULL OR jsonb_typeof(p_patch->'barn_stall_order_no') = 'null' THEN NULL
        ELSE NULLIF(trim(p_patch->>'barn_stall_order_no'), '')
      END,
      planned_delivery_time = CASE
        WHEN p_patch ? 'planned_delivery_time' THEN (p_patch->>'planned_delivery_time')::time
        WHEN p_patch ? 'sacrifice_time' THEN ((p_patch->>'sacrifice_time')::time + interval '90 minutes')::time
        ELSE sa.planned_delivery_time
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
    RETURNING sa.*
  LOOP
    IF r.pricing_mode = 'live_scale' AND r.live_scale_total_price IS NOT NULL THEN
      PERFORM public.rebalance_live_scale_shareholders(r.sacrifice_id);
      SELECT * INTO r FROM public.sacrifice_animals WHERE sacrifice_id = r.sacrifice_id;
    END IF;
    RETURN NEXT r;
  END LOOP;
  RETURN;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_sacrifice_core(text, uuid, uuid, int2, jsonb) TO service_role;


-- =============================================================================
-- BİRLEŞTİRİLMİŞ ÇIKTI — elle düzenleme yok
-- Kaynak: log_sacrifice_changes/fragments/*.sql
-- Yenileme: npm run db:merge:log-sacrifice-changes
-- =============================================================================

-- sacrifice_animals → change_logs (kısa description; değerler kolonlarda)
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
      NEW.sacrifice_id::text,
      'Ekleme',
      'Kurbanlık eklendi',
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
        NEW.sacrifice_id::text,
        'sacrifice_no',
        CAST(OLD.sacrifice_no AS TEXT),
        CAST(NEW.sacrifice_no AS TEXT),
        'Güncelleme',
        'Kurban numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_weight IS DISTINCT FROM OLD.share_weight THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'share_weight',
        CAST(OLD.share_weight AS TEXT),
        CAST(NEW.share_weight AS TEXT),
        'Güncelleme',
        'Hisse ağırlığı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'share_price',
        CAST(OLD.share_price AS TEXT),
        CAST(NEW.share_price AS TEXT),
        'Güncelleme',
        'Hisse bedeli güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.empty_share IS DISTINCT FROM OLD.empty_share THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'empty_share',
        CAST(OLD.empty_share AS TEXT),
        CAST(NEW.empty_share AS TEXT),
        'Güncelleme',
        'Boş hisse güncellendi',
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
        NEW.sacrifice_id::text,
        'pricing_mode',
        COALESCE(OLD.pricing_mode::text, '—'),
        COALESCE(NEW.pricing_mode::text, '—'),
        'Güncelleme',
        'Fiyatlama modu güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.live_scale_total_kg IS DISTINCT FROM OLD.live_scale_total_kg THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'live_scale_total_kg',
        COALESCE(OLD.live_scale_total_kg::text, '—'),
        COALESCE(NEW.live_scale_total_kg::text, '—'),
        'Güncelleme',
        'Baskül ağırlığı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.live_scale_total_price IS DISTINCT FROM OLD.live_scale_total_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'live_scale_total_price',
        COALESCE(OLD.live_scale_total_price::text, '—'),
        COALESCE(NEW.live_scale_total_price::text, '—'),
        'Güncelleme',
        'Baskül tutarı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;
    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'notes',
        OLD.notes,
        NEW.notes,
        'Güncelleme',
        'Notlar güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.animal_type IS DISTINCT FROM OLD.animal_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'animal_type',
        COALESCE(OLD.animal_type, ''),
        COALESCE(NEW.animal_type, ''),
        'Güncelleme',
        'Hayvan cinsi güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.foundation IS DISTINCT FROM OLD.foundation THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'foundation',
        COALESCE(OLD.foundation, ''),
        COALESCE(NEW.foundation, ''),
        'Güncelleme',
        'Vakıf bilgisi güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.ear_tag IS DISTINCT FROM OLD.ear_tag THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'ear_tag',
        COALESCE(OLD.ear_tag, ''),
        COALESCE(NEW.ear_tag, ''),
        'Güncelleme',
        'Küpe numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.barn_stall_order_no IS DISTINCT FROM OLD.barn_stall_order_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'barn_stall_order_no',
        COALESCE(OLD.barn_stall_order_no, ''),
        COALESCE(NEW.barn_stall_order_no, ''),
        'Güncelleme',
        'Ahır sıra numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'sacrifice_time',
        CAST(OLD.sacrifice_time AS TEXT),
        CAST(NEW.sacrifice_time AS TEXT),
        'Güncelleme',
        'Kesim planı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.planned_delivery_time IS DISTINCT FROM OLD.planned_delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'planned_delivery_time',
        CAST(OLD.planned_delivery_time AS TEXT),
        CAST(NEW.planned_delivery_time AS TEXT),
        'Güncelleme',
        'Planlı teslim saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'slaughter_time',
        CAST(OLD.slaughter_time AS TEXT),
        CAST(NEW.slaughter_time AS TEXT),
        'Güncelleme',
        'Kesim saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'butcher_time',
        CAST(OLD.butcher_time AS TEXT),
        CAST(NEW.butcher_time AS TEXT),
        'Güncelleme',
        'Parçalama saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'delivery_time',
        CAST(OLD.delivery_time AS TEXT),
        CAST(NEW.delivery_time AS TEXT),
        'Güncelleme',
        'Teslimat saati güncellendi',
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
      OLD.sacrifice_id::text,
      'Silme',
      'Kurbanlık silindi',
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
