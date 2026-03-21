-- Faz 2: shareholders RPC + log_shareholder_changes (app.actor, genişletilmiş kolonlar)

CREATE OR REPLACE FUNCTION public.rpc_update_shareholder(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid,
  p_patch jsonb
)
RETURNS SETOF public.shareholders
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
  UPDATE public.shareholders sh
  SET
    shareholder_name = CASE
      WHEN p_patch ? 'shareholder_name' THEN (p_patch->>'shareholder_name')::text
      ELSE sh.shareholder_name
    END,
    phone_number = CASE
      WHEN p_patch ? 'phone_number' THEN NULLIF((p_patch->>'phone_number'), '')::varchar
      ELSE sh.phone_number
    END,
    second_phone_number = CASE
      WHEN NOT (p_patch ? 'second_phone_number') THEN sh.second_phone_number
      WHEN p_patch->'second_phone_number' IS NULL OR jsonb_typeof(p_patch->'second_phone_number') = 'null' THEN NULL
      ELSE NULLIF((p_patch->>'second_phone_number'), '')::varchar
    END,
    delivery_fee = CASE
      WHEN p_patch ? 'delivery_fee' THEN (p_patch->>'delivery_fee')::numeric
      ELSE sh.delivery_fee
    END,
    delivery_location = CASE
      WHEN p_patch ? 'delivery_location' THEN NULLIF((p_patch->>'delivery_location'), '')::text
      ELSE sh.delivery_location
    END,
    delivery_type = CASE
      WHEN p_patch ? 'delivery_type' THEN NULLIF((p_patch->>'delivery_type'), '')::text
      ELSE sh.delivery_type
    END,
    total_amount = CASE
      WHEN p_patch ? 'total_amount' THEN (p_patch->>'total_amount')::numeric
      ELSE sh.total_amount
    END,
    sacrifice_consent = CASE
      WHEN p_patch ? 'sacrifice_consent' THEN (p_patch->>'sacrifice_consent')::boolean
      ELSE sh.sacrifice_consent
    END,
    notes = CASE
      WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text
      ELSE sh.notes
    END,
    remaining_payment = CASE
      WHEN p_patch ? 'remaining_payment' THEN (p_patch->>'remaining_payment')::numeric
      ELSE sh.remaining_payment
    END,
    paid_amount = CASE
      WHEN p_patch ? 'paid_amount' THEN (p_patch->>'paid_amount')::numeric
      ELSE sh.paid_amount
    END,
    security_code = CASE
      WHEN p_patch ? 'security_code' THEN NULLIF((p_patch->>'security_code'), '')::varchar
      ELSE sh.security_code
    END,
    last_edited_by = CASE
      WHEN p_patch ? 'last_edited_by' THEN (p_patch->>'last_edited_by')::text
      ELSE sh.last_edited_by
    END,
    last_edited_time = CASE
      WHEN p_patch ? 'last_edited_time' THEN (p_patch->>'last_edited_time')::timestamptz
      ELSE sh.last_edited_time
    END
  WHERE sh.tenant_id = p_tenant_id
    AND sh.shareholder_id = p_shareholder_id
  RETURNING sh.*;
END;
$f$;

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
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  DELETE FROM public.shareholders
  WHERE tenant_id = p_tenant_id
    AND shareholder_id = p_shareholder_id;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_shareholder(text, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_shareholder(text, uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_delete_shareholder(text, uuid, uuid) TO service_role;

-- change_logs: change_owner = app.actor (RPC) veya last_edited_by ile uyumlu; DELETE sileni yansıtır

CREATE OR REPLACE FUNCTION public.log_shareholder_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_sacrifice_year INT2;
  v_owner text;
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
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hissedarlar',
      CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
      'Ekleme',
      'Yeni hissedar eklendi: Hissedar Adı = ' || NEW.shareholder_name || ' (Kurban Numarası = ' || NEW.sacrifice_id || ')',
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
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Hissedar Adı',
        OLD.shareholder_name, NEW.shareholder_name, 'Güncelleme',
        'Hissedar adı ' || OLD.shareholder_name || ' değerinden ' || NEW.shareholder_name || ' değerine değişti.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Telefon Numarası',
        OLD.phone_number, NEW.phone_number, 'Güncelleme',
        'Telefon numarası ' || COALESCE(OLD.phone_number, '-') || ' numarasından ' || COALESCE(NEW.phone_number, '-') || ' numarasına değişti.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.second_phone_number IS DISTINCT FROM OLD.second_phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'İkinci Telefon',
        OLD.second_phone_number, NEW.second_phone_number, 'Güncelleme',
        'İkinci telefon güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Toplam Tutar',
        CAST(OLD.total_amount AS TEXT), CAST(NEW.total_amount AS TEXT), 'Güncelleme',
        'Toplam tutar ' || OLD.total_amount || ' değerinden ' || NEW.total_amount || ' değerine değişti.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Ödenen Tutar',
        CAST(OLD.paid_amount AS TEXT), CAST(NEW.paid_amount AS TEXT), 'Güncelleme',
        'Ödenen tutar ' || OLD.paid_amount || ' değerinden ' || NEW.paid_amount || ' değerine değişti.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.remaining_payment IS DISTINCT FROM OLD.remaining_payment THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Kalan Ödeme',
        CAST(OLD.remaining_payment AS TEXT), CAST(NEW.remaining_payment AS TEXT), 'Güncelleme',
        'Kalan ödeme güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Ücreti',
        CAST(OLD.delivery_fee AS TEXT), CAST(NEW.delivery_fee AS TEXT), 'Güncelleme',
        'Teslimat ücreti güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_location IS DISTINCT FROM OLD.delivery_location THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Noktası',
        OLD.delivery_location, NEW.delivery_location, 'Güncelleme',
        'Teslimat ' || COALESCE(OLD.delivery_location, '-') || ' yerine ' || COALESCE(NEW.delivery_location, '-') || ' noktasında yapılacak.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Tipi',
        OLD.delivery_type, NEW.delivery_type, 'Güncelleme',
        'Teslimat tipi güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_consent IS DISTINCT FROM OLD.sacrifice_consent THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Vekalet',
        CAST(OLD.sacrifice_consent AS TEXT), CAST(NEW.sacrifice_consent AS TEXT), 'Güncelleme',
        'Vekalet onayı güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Notlar',
        OLD.notes, NEW.notes, 'Güncelleme',
        'Hissedar notları güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'E-posta',
        OLD.email, NEW.email, 'Güncelleme',
        'E-posta güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.security_code IS DISTINCT FROM OLD.security_code THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Güvenlik Kodu',
        OLD.security_code, NEW.security_code, 'Güncelleme',
        'Güvenlik kodu güncellendi.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.contacted_at IS DISTINCT FROM OLD.contacted_at THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Görüşüldü',
        CAST(OLD.contacted_at AS TEXT), CAST(NEW.contacted_at AS TEXT), 'Güncelleme',
        'Görüşüldü tarihi güncellendi.',
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
      'Hissedar kaydı silindi: Hissedar Adı = ' || OLD.shareholder_name || ' (Kurban Numarası = ' || OLD.sacrifice_id || ')',
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
