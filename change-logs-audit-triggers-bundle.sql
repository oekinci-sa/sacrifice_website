-- =============================================================================
-- change_logs — AUDIT TETİKLEYİCİLERİ (tek seferde uygula)
-- Dosya: change-logs-audit-triggers-bundle.sql
-- Yenileme: node scripts/build-change-logs-audit-triggers-bundle.mjs
-- Kaynak: .project-architecture/db/tables/*/functions_and_triggers/log_*_changes.sql
--
-- Ne yapar: 6 fonksiyon CREATE OR REPLACE + ilgili DROP/CREATE TRIGGER
-- Sıra: sacrifice_animals → shareholders → users → user_tenants → stage_metrics → mismatched
--
-- Opsiyonel (şema/veri): change-logs-audit-sql-bundle-migration.sql (NULL, CHECK, index)
-- Opsiyonel (eski satırların description): .project-architecture/db/tables/change_logs/migrations/backfill_short_descriptions_2026_04.sql
-- =============================================================================

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


-- shareholders → change_logs; change_owner = app.actor (RPC) veya last_edited_by
-- description: kısa sabit cümleler; değerler kolonlarda (short_descriptions_reference.md)

CREATE OR REPLACE FUNCTION public.log_shareholder_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_sacrifice_year INT2;
  v_sacrifice_no INT2;
  v_owner text;
  v_corr text;
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
      'shareholders',
      NEW.shareholder_id::text,
      'Ekleme',
      'Hissedar eklendi',
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
        'shareholders', NEW.shareholder_id::text, 'shareholder_name',
        OLD.shareholder_name, NEW.shareholder_name, 'Güncelleme',
        'Hissedar adı güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'phone_number',
        OLD.phone_number, NEW.phone_number, 'Güncelleme',
        'Telefon güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.second_phone_number IS DISTINCT FROM OLD.second_phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'second_phone_number',
        OLD.second_phone_number, NEW.second_phone_number, 'Güncelleme',
        'İkinci telefon güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'total_amount',
        CAST(OLD.total_amount AS TEXT), CAST(NEW.total_amount AS TEXT), 'Güncelleme',
        'Toplam tutar güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'paid_amount',
        CAST(OLD.paid_amount AS TEXT), CAST(NEW.paid_amount AS TEXT), 'Güncelleme',
        'Ödenen tutar güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.remaining_payment IS DISTINCT FROM OLD.remaining_payment THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'remaining_payment',
        CAST(OLD.remaining_payment AS TEXT), CAST(NEW.remaining_payment AS TEXT), 'Güncelleme',
        'Kalan ödeme güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_fee',
        CAST(OLD.delivery_fee AS TEXT), CAST(NEW.delivery_fee AS TEXT), 'Güncelleme',
        'Teslimat ücreti güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_location IS DISTINCT FROM OLD.delivery_location THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_location',
        OLD.delivery_location, NEW.delivery_location, 'Güncelleme',
        'Teslimat noktası güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_type',
        OLD.delivery_type, NEW.delivery_type, 'Güncelleme',
        'Teslimat tipi güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_consent IS DISTINCT FROM OLD.sacrifice_consent THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'sacrifice_consent',
        CAST(OLD.sacrifice_consent AS TEXT), CAST(NEW.sacrifice_consent AS TEXT), 'Güncelleme',
        'Vekalet durumu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'notes',
        OLD.notes, NEW.notes, 'Güncelleme',
        'Not güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'email',
        OLD.email, NEW.email, 'Güncelleme',
        'E-posta güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.security_code IS DISTINCT FROM OLD.security_code THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'security_code',
        OLD.security_code, NEW.security_code, 'Güncelleme',
        'Güvenlik kodu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.contacted_at IS DISTINCT FROM OLD.contacted_at THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'contacted_at',
        CAST(OLD.contacted_at AS TEXT), CAST(NEW.contacted_at AS TEXT), 'Güncelleme',
        'Görüşme durumu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'shareholders',
      OLD.shareholder_id::text,
      'Silme',
      'Hissedar silindi',
      v_owner,
      OLD.tenant_id,
      v_sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN 'primary'::text ELSE NULL END
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


-- users → change_logs
-- Actor: önce app.actor GUC (RPC'den set_config ile gelir), yoksa last_edited_by kolonundan alınır.

CREATE OR REPLACE FUNCTION public.log_user_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by,
      'Anonim Kullanıcı'
    );
    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id)
    VALUES (
      'users',
      NEW.id::text,
      'Ekleme',
      'Kullanıcı eklendi',
      v_owner,
      NEW.last_audit_tenant_id
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by,
      'Anonim Kullanıcı'
    );

    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'users', NEW.id::text, 'name',
        OLD.name, NEW.name, 'Güncelleme',
        'Ad güncellendi',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.image IS DISTINCT FROM NEW.image THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'users', NEW.id::text, 'image',
        OLD.image, NEW.image, 'Güncelleme',
        'Profil görseli güncellendi',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'users', NEW.id::text, 'role',
        OLD.role::text, NEW.role::text, 'Güncelleme',
        'Rol güncellendi',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'users', NEW.id::text, 'email',
        OLD.email, NEW.email, 'Güncelleme',
        'E-posta güncellendi',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'users', NEW.id::text, 'status',
        OLD.status::text, NEW.status::text, 'Güncelleme',
        'Durum güncellendi',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by,
      'Anonim Kullanıcı'
    );
    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id)
    VALUES (
      'users',
      OLD.id::text,
      'Silme',
      'Kullanıcı silindi',
      v_owner,
      OLD.last_audit_tenant_id
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_user_changes ON public.users;

CREATE TRIGGER trigger_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_changes();


-- user_tenants: çoklu tenant onayı + org içi onay iptali → change_logs
-- Actor: app.actor GUC (RPC'den set_config ile gelir); user_tenants tablosunda last_edited_by kolonu yok.

CREATE OR REPLACE FUNCTION public.log_user_tenants_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_cnt int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.approved_at IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT COUNT(*)::int INTO v_cnt FROM public.user_tenants ut WHERE ut.user_id = NEW.user_id;
    IF v_cnt < 2 THEN
      RETURN NEW;
    END IF;
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      'Anonim Kullanıcı'
    );
    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id)
    VALUES (
      'user_tenants',
      NEW.user_id::text,
      'Güncelleme',
      'Kullanıcı onaylandı',
      v_owner,
      NEW.tenant_id
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.approved_at IS NOT NULL AND NEW.approved_at IS NULL THEN
      v_owner := COALESCE(
        NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
        'Anonim Kullanıcı'
      );
      INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id)
      VALUES (
        'user_tenants',
        NEW.user_id::text,
        'Güncelleme',
        'Kullanıcı onayı kaldırıldı',
        v_owner,
        NEW.tenant_id
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_user_tenants_changes ON public.user_tenants;

CREATE TRIGGER trigger_user_tenants_changes
  AFTER INSERT OR UPDATE ON public.user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_tenants_changes();


-- stage_metrics → change_logs
-- Sadece current_sacrifice_number değişimi takip edilir.
-- Trigger: AFTER UPDATE OF current_sacrifice_number
-- Actor: önce app.actor GUC (rpc_update_stage_metrics set_config ile yazar), yoksa last_edited_by.

CREATE OR REPLACE FUNCTION public.log_stage_metrics_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
BEGIN
  IF OLD.current_sacrifice_number IS NOT DISTINCT FROM NEW.current_sacrifice_number THEN
    RETURN NEW;
  END IF;

  v_owner := COALESCE(
    NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
    NEW.last_edited_by,
    'Anonim Kullanıcı'
  );

  INSERT INTO public.change_logs (
    table_name,
    row_id,
    column_name,
    old_value,
    new_value,
    change_type,
    description,
    change_owner,
    tenant_id
  )
  VALUES (
    'stage_metrics',
    NEW.stage,
    'current_sacrifice_number',
    COALESCE(OLD.current_sacrifice_number::text, '—'),
    NEW.current_sacrifice_number::text,
    'Güncelleme',
    'Sıra güncellendi',
    v_owner,
    NEW.tenant_id
  );

  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_stage_metrics_changes ON public.stage_metrics;

CREATE TRIGGER trigger_stage_metrics_changes
  AFTER UPDATE OF current_sacrifice_number ON public.stage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_stage_metrics_changes();


-- mismatched_share_acknowledgments → change_logs
-- INSERT = yönetici uyumsuzluğu onayladı
-- DELETE = onay kaldırıldı (rpc_revoke_mismatch)
-- Actor: önce app.actor GUC, yoksa acknowledged_by / last_edited_by kolonundan alınır.

CREATE OR REPLACE FUNCTION public.log_mismatch_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner   text;
  v_no      INT2;
  v_year    INT2;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT sa.sacrifice_no, sa.sacrifice_year
    INTO v_no, v_year
    FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = NEW.sacrifice_id;

    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.acknowledged_by,
      'Anonim Kullanıcı'
    );

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'mismatched_share_acknowledgments',
      COALESCE(v_no::text, NEW.sacrifice_id::text),
      'Güncelleme',
      'Uyumsuzluk onaylandı',
      v_owner,
      NEW.tenant_id,
      v_year
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT sa.sacrifice_no, sa.sacrifice_year
    INTO v_no, v_year
    FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = OLD.sacrifice_id;

    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by,
      OLD.acknowledged_by,
      'Anonim Kullanıcı'
    );

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'mismatched_share_acknowledgments',
      COALESCE(v_no::text, OLD.sacrifice_id::text),
      'Güncelleme',
      'Uyumsuzluk kaldırıldı',
      v_owner,
      OLD.tenant_id,
      v_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_mismatch_changes ON public.mismatched_share_acknowledgments;

CREATE TRIGGER trigger_mismatch_changes
  AFTER INSERT OR DELETE ON public.mismatched_share_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mismatch_changes();
