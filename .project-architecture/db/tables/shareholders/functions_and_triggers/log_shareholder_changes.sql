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
      'INSERT',
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
        OLD.shareholder_name, NEW.shareholder_name, 'UPDATE',
        'Hissedar adı güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'phone_number',
        OLD.phone_number, NEW.phone_number, 'UPDATE',
        'Telefon güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.second_phone_number IS DISTINCT FROM OLD.second_phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'second_phone_number',
        OLD.second_phone_number, NEW.second_phone_number, 'UPDATE',
        'İkinci telefon güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'total_amount',
        CAST(OLD.total_amount AS TEXT), CAST(NEW.total_amount AS TEXT), 'UPDATE',
        'Toplam tutar güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'paid_amount',
        CAST(OLD.paid_amount AS TEXT), CAST(NEW.paid_amount AS TEXT), 'UPDATE',
        'Ödenen tutar güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.remaining_payment IS DISTINCT FROM OLD.remaining_payment THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'remaining_payment',
        CAST(OLD.remaining_payment AS TEXT), CAST(NEW.remaining_payment AS TEXT), 'UPDATE',
        'Kalan ödeme güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_fee',
        CAST(OLD.delivery_fee AS TEXT), CAST(NEW.delivery_fee AS TEXT), 'UPDATE',
        'Teslimat ücreti güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_location IS DISTINCT FROM OLD.delivery_location THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_location',
        OLD.delivery_location, NEW.delivery_location, 'UPDATE',
        'Teslimat noktası güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'delivery_type',
        OLD.delivery_type, NEW.delivery_type, 'UPDATE',
        'Teslimat tipi güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_consent IS DISTINCT FROM OLD.sacrifice_consent THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'sacrifice_consent',
        CAST(OLD.sacrifice_consent AS TEXT), CAST(NEW.sacrifice_consent AS TEXT), 'UPDATE',
        'Vekalet durumu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'notes',
        OLD.notes, NEW.notes, 'UPDATE',
        'Not güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'email',
        OLD.email, NEW.email, 'UPDATE',
        'E-posta güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.security_code IS DISTINCT FROM OLD.security_code THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'security_code',
        OLD.security_code, NEW.security_code, 'UPDATE',
        'Güvenlik kodu güncellendi',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.contacted_at IS DISTINCT FROM OLD.contacted_at THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'shareholders', NEW.shareholder_id::text, 'contacted_at',
        CAST(OLD.contacted_at AS TEXT), CAST(NEW.contacted_at AS TEXT), 'UPDATE',
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
      'DELETE',
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
