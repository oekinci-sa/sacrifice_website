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
