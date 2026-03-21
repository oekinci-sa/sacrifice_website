-- users → change_logs
-- Actor: önce app.actor GUC (RPC'den set_config ile gelir), yoksa last_edited_by kolonundan alınır.
-- Tetiklenen tablo: public.users

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
      'Kullanıcılar',
      NEW.id::text,
      'Ekleme',
      'Sisteme yeni kullanıcı kaydı eklendi. Giriş e-postası: ' || NEW.email || '.',
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
        'Kullanıcılar', NEW.id::text, 'Ad',
        OLD.name, NEW.name, 'Güncelleme',
        'Panelde görünen kullanıcı adı değişti: «' || COALESCE(OLD.name, '—') || '» → «' || COALESCE(NEW.name, '—') || '».',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.image IS DISTINCT FROM NEW.image THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'Kullanıcılar', NEW.id::text, 'Profil görseli',
        OLD.image, NEW.image, 'Güncelleme',
        'Profil fotoğrafı veya avatar adresi değiştirildi.',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'Kullanıcılar', NEW.id::text, 'Rol',
        OLD.role::text, NEW.role::text, 'Güncelleme',
        'Sistem rolü (yetki seviyesi) güncellendi: '
          || CASE OLD.role::text
               WHEN 'editor'      THEN 'Editör'
               WHEN 'admin'       THEN 'Yönetici'
               WHEN 'super_admin' THEN 'Süper yönetici'
               ELSE COALESCE(OLD.role::text, '—')
             END
          || ' → '
          || CASE NEW.role::text
               WHEN 'editor'      THEN 'Editör'
               WHEN 'admin'       THEN 'Yönetici'
               WHEN 'super_admin' THEN 'Süper yönetici'
               ELSE COALESCE(NEW.role::text, '—')
             END
          || '. Menü ve işlem yetkilerini etkiler.',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'Kullanıcılar', NEW.id::text, 'E-posta',
        OLD.email, NEW.email, 'Güncelleme',
        'Giriş e-postası değiştirildi: ' || COALESCE(OLD.email, '—') || ' → ' || COALESCE(NEW.email, '—') || '.',
        v_owner, NEW.last_audit_tenant_id
      );
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id)
      VALUES (
        'Kullanıcılar', NEW.id::text, 'Durum',
        OLD.status::text, NEW.status::text, 'Güncelleme',
        'Hesap durumu değişti: '
          || CASE OLD.status::text
               WHEN 'pending'  THEN 'Onay bekliyor'
               WHEN 'approved' THEN 'Onaylı'
               WHEN 'rejected' THEN 'Reddedildi'
               ELSE COALESCE(OLD.status::text, '—')
             END
          || ' → '
          || CASE NEW.status::text
               WHEN 'pending'  THEN 'Onay bekliyor'
               WHEN 'approved' THEN 'Onaylı'
               WHEN 'rejected' THEN 'Reddedildi'
               ELSE COALESCE(NEW.status::text, '—')
             END
          || '.',
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
      'Kullanıcılar',
      OLD.id::text,
      'Silme',
      'Kullanıcı hesabı tamamen silindi. E-posta: ' || OLD.email || '.',
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
