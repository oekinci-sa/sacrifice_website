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
        'Referans güncellendi',
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
        CASE
          WHEN NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN 'detail'
          ELSE v_layer
        END
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
