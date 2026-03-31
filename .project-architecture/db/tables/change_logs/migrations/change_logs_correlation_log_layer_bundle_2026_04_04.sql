-- =============================================================================
-- TEK SEFERDE UYGULANACAK BUNDLE: correlation_id + app.log_layer
-- Repo kaynakları birleştirildi (apply_order ile aynı sıra).
-- Parça dosyaları değişince: node scripts/build-change-logs-correlation-bundle.mjs
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SOURCE: shareholders/functions_and_triggers/sync_empty_share_after_shareholder_delete.sql
-- -----------------------------------------------------------------------------

-- Hissedar satırı silindiğinde ilgili kurbanlıkta boş hisse sayısını +1 (en fazla 7).
-- rpc_delete_shareholder içinde app.correlation_id ayarlıyken sacrifice log_satırı "detail" olarak gruplanır.

CREATE OR REPLACE FUNCTION public.sync_empty_share_after_shareholder_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF COALESCE(current_setting('app.skip_empty_share_sync', true), 'false') = 'true' THEN
    RETURN OLD;
  END IF;
  PERFORM set_config('app.log_layer', 'detail', true);
  UPDATE public.sacrifice_animals
  SET empty_share = LEAST(7, empty_share + 1)
  WHERE sacrifice_id = OLD.sacrifice_id;
  RETURN OLD;
END;
$f$;

DROP TRIGGER IF EXISTS trg_sync_empty_share_after_shareholder_delete ON public.shareholders;
CREATE TRIGGER trg_sync_empty_share_after_shareholder_delete
  AFTER DELETE ON public.shareholders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_empty_share_after_shareholder_delete();

-- -----------------------------------------------------------------------------
-- SOURCE: shareholders/functions_and_triggers/log_shareholder_changes.sql
-- -----------------------------------------------------------------------------

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
  v_layer text;
BEGIN
  v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
  v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
  v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;

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
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'shareholders',
      NEW.shareholder_id::text,
      'INSERT',
      'Hissedar eklendi',
      v_owner,
      NEW.tenant_id,
      v_sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      v_layer
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );

    IF NEW.shareholder_name IS DISTINCT FROM OLD.shareholder_name THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'shareholder_name',
        OLD.shareholder_name, NEW.shareholder_name, 'UPDATE',
        'Hissedar adı güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'phone_number',
        OLD.phone_number, NEW.phone_number, 'UPDATE',
        'Telefon güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.second_phone_number IS DISTINCT FROM OLD.second_phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'second_phone_number',
        OLD.second_phone_number, NEW.second_phone_number, 'UPDATE',
        'İkinci telefon güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'total_amount',
        CAST(OLD.total_amount AS TEXT), CAST(NEW.total_amount AS TEXT), 'UPDATE',
        'Toplam tutar güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'paid_amount',
        CAST(OLD.paid_amount AS TEXT), CAST(NEW.paid_amount AS TEXT), 'UPDATE',
        'Ödenen tutar güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.remaining_payment IS DISTINCT FROM OLD.remaining_payment THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'remaining_payment',
        CAST(OLD.remaining_payment AS TEXT), CAST(NEW.remaining_payment AS TEXT), 'UPDATE',
        'Kalan ödeme güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_fee',
        CAST(OLD.delivery_fee AS TEXT), CAST(NEW.delivery_fee AS TEXT), 'UPDATE',
        'Teslimat ücreti güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.delivery_location IS DISTINCT FROM OLD.delivery_location THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_location',
        OLD.delivery_location, NEW.delivery_location, 'UPDATE',
        'Teslimat noktası güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_type',
        OLD.delivery_type, NEW.delivery_type, 'UPDATE',
        'Teslimat tipi güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.sacrifice_consent IS DISTINCT FROM OLD.sacrifice_consent THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'sacrifice_consent',
        CAST(OLD.sacrifice_consent AS TEXT), CAST(NEW.sacrifice_consent AS TEXT), 'UPDATE',
        'Vekalet durumu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'notes',
        OLD.notes, NEW.notes, 'UPDATE',
        'Not güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'email',
        OLD.email, NEW.email, 'UPDATE',
        'E-posta güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.security_code IS DISTINCT FROM OLD.security_code THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'security_code',
        OLD.security_code, NEW.security_code, 'UPDATE',
        'Güvenlik kodu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.contacted_at IS DISTINCT FROM OLD.contacted_at THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'contacted_at',
        CAST(OLD.contacted_at AS TEXT), CAST(NEW.contacted_at AS TEXT), 'UPDATE',
        'Görüşme durumu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'shareholders',
      OLD.shareholder_id::text,
      'DELETE',
      'Hissedar silindi',
      v_owner,
      OLD.tenant_id,
      v_sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      v_layer
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

-- -----------------------------------------------------------------------------
-- SOURCE: sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql
-- -----------------------------------------------------------------------------

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
  v_layer text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
    v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'sacrifice_animals',
      NEW.sacrifice_id::text,
      'INSERT',
      'Kurbanlık eklendi',
      v_owner,
      NEW.tenant_id,
      NEW.sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      v_layer
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
    v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;

    IF NEW.sacrifice_no IS DISTINCT FROM OLD.sacrifice_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'sacrifice_no',
        CAST(OLD.sacrifice_no AS TEXT),
        CAST(NEW.sacrifice_no AS TEXT),
        'UPDATE',
        'Kurban numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.share_weight IS DISTINCT FROM OLD.share_weight THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'share_weight',
        CAST(OLD.share_weight AS TEXT),
        CAST(NEW.share_weight AS TEXT),
        'UPDATE',
        'Hisse ağırlığı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'share_price',
        CAST(OLD.share_price AS TEXT),
        CAST(NEW.share_price AS TEXT),
        'UPDATE',
        'Hisse bedeli güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
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
        'UPDATE',
        'Boş hisse güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.pricing_mode IS DISTINCT FROM OLD.pricing_mode THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'pricing_mode',
        COALESCE(OLD.pricing_mode::text, '—'),
        COALESCE(NEW.pricing_mode::text, '—'),
        'UPDATE',
        'Fiyatlama modu güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.live_scale_total_kg IS DISTINCT FROM OLD.live_scale_total_kg THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'live_scale_total_kg',
        COALESCE(OLD.live_scale_total_kg::text, '—'),
        COALESCE(NEW.live_scale_total_kg::text, '—'),
        'UPDATE',
        'Baskül ağırlığı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.live_scale_total_price IS DISTINCT FROM OLD.live_scale_total_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'live_scale_total_price',
        COALESCE(OLD.live_scale_total_price::text, '—'),
        COALESCE(NEW.live_scale_total_price::text, '—'),
        'UPDATE',
        'Baskül tutarı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;
    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'notes',
        OLD.notes,
        NEW.notes,
        'UPDATE',
        'Notlar güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.animal_type IS DISTINCT FROM OLD.animal_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'animal_type',
        COALESCE(OLD.animal_type, ''),
        COALESCE(NEW.animal_type, ''),
        'UPDATE',
        'Hayvan cinsi güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.foundation IS DISTINCT FROM OLD.foundation THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'foundation',
        COALESCE(OLD.foundation, ''),
        COALESCE(NEW.foundation, ''),
        'UPDATE',
        'Vakıf bilgisi güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.ear_tag IS DISTINCT FROM OLD.ear_tag THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'ear_tag',
        COALESCE(OLD.ear_tag, ''),
        COALESCE(NEW.ear_tag, ''),
        'UPDATE',
        'Küpe numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.barn_stall_order_no IS DISTINCT FROM OLD.barn_stall_order_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'barn_stall_order_no',
        COALESCE(OLD.barn_stall_order_no, ''),
        COALESCE(NEW.barn_stall_order_no, ''),
        'UPDATE',
        'Ahır sıra numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'sacrifice_time',
        CAST(OLD.sacrifice_time AS TEXT),
        CAST(NEW.sacrifice_time AS TEXT),
        'UPDATE',
        'Kesim planı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.planned_delivery_time IS DISTINCT FROM OLD.planned_delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'planned_delivery_time',
        CAST(OLD.planned_delivery_time AS TEXT),
        CAST(NEW.planned_delivery_time AS TEXT),
        'UPDATE',
        'Planlı teslim saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'slaughter_time',
        CAST(OLD.slaughter_time AS TEXT),
        CAST(NEW.slaughter_time AS TEXT),
        'UPDATE',
        'Kesim saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'butcher_time',
        CAST(OLD.butcher_time AS TEXT),
        CAST(NEW.butcher_time AS TEXT),
        'UPDATE',
        'Parçalama saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'delivery_time',
        CAST(OLD.delivery_time AS TEXT),
        CAST(NEW.delivery_time AS TEXT),
        'UPDATE',
        'Teslimat saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    PERFORM set_config('app.log_layer', 'detail', true);

    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
    v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'sacrifice_animals',
      OLD.sacrifice_id::text,
      'DELETE',
      'Kurbanlık silindi',
      v_owner,
      OLD.tenant_id,
      OLD.sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      v_layer
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

-- -----------------------------------------------------------------------------
-- SOURCE: sacrifice_animals/functions_and_triggers/rpc_update_sacrifice_core.sql
-- -----------------------------------------------------------------------------

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
  v_corr uuid;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);
  v_corr := gen_random_uuid();
  PERFORM set_config('app.correlation_id', v_corr::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);

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
      PERFORM set_config('app.log_layer', 'detail', true);
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

-- -----------------------------------------------------------------------------
-- SOURCE: shareholders/functions_and_triggers/rpc_delete_shareholder.sql
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_delete_shareholder(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_corr uuid;
  v_sid uuid;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  v_corr := gen_random_uuid();
  PERFORM set_config('app.correlation_id', v_corr::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);
  PERFORM set_config('app.actor', p_actor, true);

  SELECT sh.sacrifice_id INTO v_sid
  FROM public.shareholders sh
  WHERE sh.tenant_id = p_tenant_id
    AND sh.shareholder_id = p_shareholder_id;

  DELETE FROM public.shareholders
  WHERE tenant_id = p_tenant_id
    AND shareholder_id = p_shareholder_id;

  IF v_sid IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.sacrifice_animals sa
       WHERE sa.sacrifice_id = v_sid
         AND sa.pricing_mode = 'live_scale'
         AND sa.live_scale_total_price IS NOT NULL
     ) THEN
    PERFORM public.rebalance_live_scale_shareholders(v_sid);
  END IF;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- SOURCE: shareholders/functions_and_triggers/rpc_insert_shareholders_batch.sql
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_insert_shareholders_batch(
  p_actor text,
  p_tenant_id uuid,
  p_rows jsonb
)
RETURNS SETOF public.shareholders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_first_tid text;
  v_row public.shareholders%ROWTYPE;
  v_corr uuid;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'rows_required';
  END IF;

  IF (
    SELECT COUNT(*) FROM jsonb_array_elements(p_rows) AS elem
    INNER JOIN public.sacrifice_animals sa
      ON sa.sacrifice_id = (elem->>'sacrifice_id')::uuid
     AND sa.tenant_id = p_tenant_id
  ) <> jsonb_array_length(p_rows) THEN
    RAISE EXCEPTION 'invalid_sacrifice_or_tenant';
  END IF;

  SELECT trim(COALESCE(elem->>'transaction_id', ''))
  INTO v_first_tid
  FROM jsonb_array_elements(p_rows) AS elem
  LIMIT 1;

  IF v_first_tid IS NOT NULL AND v_first_tid <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.shareholders sh
      WHERE sh.transaction_id = v_first_tid::char(16)
        AND sh.tenant_id = p_tenant_id
    ) THEN
      RAISE EXCEPTION 'already_inserted';
    END IF;
  END IF;

  PERFORM set_config('app.actor', p_actor, true);
  v_corr := gen_random_uuid();
  PERFORM set_config('app.correlation_id', v_corr::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);

  FOR v_row IN
    INSERT INTO public.shareholders (
      tenant_id,
      shareholder_name,
      phone_number,
      second_phone_number,
      email,
      transaction_id,
      security_code,
      sacrifice_id,
      delivery_fee,
      total_amount,
      paid_amount,
      remaining_payment,
      delivery_location,
      delivery_type,
      purchased_by,
      sacrifice_consent,
      sacrifice_year,
      last_edited_by,
      last_edited_time
    )
    SELECT
      p_tenant_id,
      trim((elem->>'shareholder_name')::text),
      NULLIF((elem->>'phone_number')::varchar, ''),
      NULLIF((elem->>'second_phone_number')::varchar, ''),
      NULLIF((elem->>'email')::varchar, ''),
      CASE
        WHEN trim(COALESCE(elem->>'transaction_id', '')) = '' THEN NULL
        ELSE trim(elem->>'transaction_id')::char(16)
      END,
      (elem->>'security_code')::varchar,
      (elem->>'sacrifice_id')::uuid,
      COALESCE((elem->>'delivery_fee')::numeric, 0),
      CASE
        WHEN sa.pricing_mode = 'live_scale' THEN COALESCE((elem->>'delivery_fee')::numeric, 0)
        ELSE COALESCE(sa.share_price, 0) + COALESCE((elem->>'delivery_fee')::numeric, 0)
      END,
      COALESCE((elem->>'paid_amount')::numeric, 0),
      CASE
        WHEN sa.pricing_mode = 'live_scale' THEN
          COALESCE((elem->>'delivery_fee')::numeric, 0) - COALESCE((elem->>'paid_amount')::numeric, 0)
        ELSE
          (COALESCE(sa.share_price, 0) + COALESCE((elem->>'delivery_fee')::numeric, 0))
            - COALESCE((elem->>'paid_amount')::numeric, 0)
      END,
      COALESCE((elem->>'delivery_location')::text, 'Kesimhane'),
      COALESCE((elem->>'delivery_type')::text, 'Kesimhane'),
      COALESCE((elem->>'purchased_by')::text, ''),
      COALESCE((elem->>'sacrifice_consent')::boolean, false),
      sa.sacrifice_year,
      p_actor,
      now()
    FROM jsonb_array_elements(p_rows) AS elem
    INNER JOIN public.sacrifice_animals sa
      ON sa.sacrifice_id = (elem->>'sacrifice_id')::uuid
     AND sa.tenant_id = p_tenant_id
    RETURNING *
  LOOP
    RETURN NEXT v_row;
  END LOOP;

  PERFORM set_config('app.log_layer', 'detail', true);
  PERFORM public.rebalance_live_scale_shareholders(sub.sacrifice_id)
  FROM (
    SELECT DISTINCT (elem->>'sacrifice_id')::uuid AS sacrifice_id
    FROM jsonb_array_elements(p_rows) AS elem
  ) sub
  INNER JOIN public.sacrifice_animals sa
    ON sa.sacrifice_id = sub.sacrifice_id AND sa.tenant_id = p_tenant_id
  WHERE sa.pricing_mode = 'live_scale'
    AND sa.live_scale_total_price IS NOT NULL;

  RETURN;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_insert_shareholders_batch(text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_insert_shareholders_batch(text, uuid, jsonb) TO service_role;

-- -----------------------------------------------------------------------------
-- SOURCE: shareholders/functions_and_triggers/rpc_move_shareholder_to_sacrifice.sql
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_move_shareholder_to_sacrifice(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid,
  p_target_sacrifice_id uuid
)
RETURNS SETOF public.shareholders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_sh public.shareholders;
  v_src public.sacrifice_animals;
  v_tgt public.sacrifice_animals;
  v_id_low uuid;
  v_id_high uuid;
  v_new_total numeric;
  v_new_remaining numeric;
  v_paid numeric;
  v_fee numeric;
  v_corr uuid;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;

  PERFORM set_config('app.actor', p_actor, true);
  v_corr := gen_random_uuid();
  PERFORM set_config('app.correlation_id', v_corr::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);

  SELECT * INTO v_sh
  FROM public.shareholders sh
  WHERE sh.shareholder_id = p_shareholder_id
    AND sh.tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shareholder_not_found';
  END IF;

  IF v_sh.sacrifice_id = p_target_sacrifice_id THEN
    RETURN NEXT v_sh;
    RETURN;
  END IF;

  v_id_low  := LEAST(v_sh.sacrifice_id, p_target_sacrifice_id);
  v_id_high := GREATEST(v_sh.sacrifice_id, p_target_sacrifice_id);

  PERFORM 1 FROM public.sacrifice_animals WHERE sacrifice_id = v_id_low  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'sacrifice_row_missing'; END IF;

  PERFORM 1 FROM public.sacrifice_animals WHERE sacrifice_id = v_id_high FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'sacrifice_row_missing'; END IF;

  SELECT * INTO v_src FROM public.sacrifice_animals WHERE sacrifice_id = v_sh.sacrifice_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'source_sacrifice_not_found'; END IF;

  SELECT * INTO v_tgt FROM public.sacrifice_animals WHERE sacrifice_id = p_target_sacrifice_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'target_sacrifice_not_found'; END IF;

  IF v_src.tenant_id <> p_tenant_id OR v_tgt.tenant_id <> p_tenant_id THEN
    RAISE EXCEPTION 'tenant_mismatch';
  END IF;

  IF v_src.sacrifice_year IS DISTINCT FROM v_tgt.sacrifice_year THEN
    RAISE EXCEPTION 'sacrifice_year_mismatch';
  END IF;

  IF v_tgt.empty_share < 1 THEN
    RAISE EXCEPTION 'target_sacrifice_full';
  END IF;

  IF v_src.empty_share >= 7 THEN
    RAISE EXCEPTION 'source_empty_share_invariant';
  END IF;

  v_paid := COALESCE(v_sh.paid_amount, 0);
  v_fee  := COALESCE(v_sh.delivery_fee, 0);

  IF v_tgt.pricing_mode = 'live_scale' THEN
    v_new_total := v_fee;
    v_new_remaining := GREATEST(v_fee - v_paid, 0);
  ELSE
    v_new_total := COALESCE(v_tgt.share_price, 0) + v_fee;
    v_new_remaining := GREATEST(v_new_total - v_paid, 0);
  END IF;

  UPDATE public.sacrifice_animals sa
  SET empty_share      = sa.empty_share + 1,
      last_edited_by   = p_actor,
      last_edited_time = now()
  WHERE sa.sacrifice_id = v_src.sacrifice_id;

  UPDATE public.sacrifice_animals sa
  SET empty_share      = sa.empty_share - 1,
      last_edited_by   = p_actor,
      last_edited_time = now()
  WHERE sa.sacrifice_id = v_tgt.sacrifice_id;

  UPDATE public.shareholders sh
  SET sacrifice_id        = v_tgt.sacrifice_id,
      sacrifice_year      = v_tgt.sacrifice_year,
      total_amount        = v_new_total,
      remaining_payment   = v_new_remaining,
      last_edited_by      = p_actor,
      last_edited_time    = now()
  WHERE sh.shareholder_id = p_shareholder_id
    AND sh.tenant_id      = p_tenant_id
  RETURNING * INTO v_sh;

  IF v_tgt.pricing_mode = 'live_scale' AND v_tgt.live_scale_total_price IS NOT NULL THEN
    PERFORM set_config('app.log_layer', 'detail', true);
    PERFORM public.rebalance_live_scale_shareholders(v_tgt.sacrifice_id);
    SELECT * INTO v_sh FROM public.shareholders WHERE shareholder_id = p_shareholder_id AND tenant_id = p_tenant_id;
  END IF;

  IF v_src.pricing_mode = 'live_scale' AND v_src.live_scale_total_price IS NOT NULL THEN
    PERFORM set_config('app.log_layer', 'detail', true);
    PERFORM public.rebalance_live_scale_shareholders(v_src.sacrifice_id);
  END IF;

  RETURN NEXT v_sh;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_move_shareholder_to_sacrifice(text, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_move_shareholder_to_sacrifice(text, uuid, uuid, uuid) TO service_role;
