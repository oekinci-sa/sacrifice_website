-- rpc_update_shareholder: correlation_id + log_layer; log_shareholder_changes: türetilmiş kolonlar için detail
-- Kaynak: .project-architecture/db/tables/shareholders/functions_and_triggers/rpc_update_shareholder.sql
--         .project-architecture/db/tables/shareholders/functions_and_triggers/log_shareholder_changes.sql

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
  PERFORM set_config('app.correlation_id', gen_random_uuid()::text, true);
  PERFORM set_config('app.log_layer', 'primary', true);

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
    email = CASE
      WHEN NOT (p_patch ? 'email') THEN sh.email
      WHEN p_patch->'email' IS NULL OR jsonb_typeof(p_patch->'email') = 'null' THEN NULL
      ELSE NULLIF(trim(p_patch->>'email'), '')::varchar
    END,
    contacted_at = CASE
      WHEN NOT (p_patch ? 'contacted_at') THEN sh.contacted_at
      WHEN p_patch->'contacted_at' IS NULL OR jsonb_typeof(p_patch->'contacted_at') = 'null' THEN NULL
      ELSE (p_patch->>'contacted_at')::timestamptz
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

REVOKE ALL ON FUNCTION public.rpc_update_shareholder(text, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_shareholder(text, uuid, uuid, jsonb) TO service_role;

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
        CASE
          WHEN NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee AND NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN 'detail'
          ELSE v_layer
        END
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
        CASE
          WHEN NEW.paid_amount IS DISTINCT FROM OLD.paid_amount OR NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN 'detail'
          ELSE v_layer
        END
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
        CASE
          WHEN NEW.delivery_location IS DISTINCT FROM OLD.delivery_location
            OR NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN 'detail'
          ELSE v_layer
        END
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
