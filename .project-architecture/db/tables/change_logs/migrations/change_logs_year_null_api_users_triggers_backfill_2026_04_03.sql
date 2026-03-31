-- 1) API: seçili yıl + sacrifice_year IS NULL (uygulama tarafında get-change-logs güncellendi).
-- 2) users / user_tenants audit: sacrifice_year = tenant_settings.active_sacrifice_year
-- 3) Geçmiş: sacrifice_animals satırlarında sacrifice_year boşsa 2026 (tek sefer; gerekirse yıl değiştir)

-- --- log_user_changes (tam gövde: repo ile aynı) ---
CREATE OR REPLACE FUNCTION public.log_user_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_year smallint;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by,
      'Anonim Kullanıcı'
    );
    SELECT ts.active_sacrifice_year INTO v_year
    FROM public.tenant_settings ts
    WHERE ts.tenant_id = NEW.last_audit_tenant_id;

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'users',
      NEW.id::text,
      'Ekleme',
      'Kullanıcı eklendi',
      v_owner,
      NEW.last_audit_tenant_id,
      v_year
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by,
      'Anonim Kullanıcı'
    );
    SELECT ts.active_sacrifice_year INTO v_year
    FROM public.tenant_settings ts
    WHERE ts.tenant_id = NEW.last_audit_tenant_id;

    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'users', NEW.id::text, 'name',
        OLD.name, NEW.name, 'UPDATE',
        'Ad güncellendi',
        v_owner, NEW.last_audit_tenant_id, v_year
      );
    END IF;

    IF OLD.image IS DISTINCT FROM NEW.image THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'users', NEW.id::text, 'image',
        OLD.image, NEW.image, 'UPDATE',
        'Profil görseli güncellendi',
        v_owner, NEW.last_audit_tenant_id, v_year
      );
    END IF;

    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'users', NEW.id::text, 'role',
        OLD.role::text, NEW.role::text, 'UPDATE',
        'Rol güncellendi',
        v_owner, NEW.last_audit_tenant_id, v_year
      );
    END IF;

    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'users', NEW.id::text, 'email',
        OLD.email, NEW.email, 'UPDATE',
        'E-posta güncellendi',
        v_owner, NEW.last_audit_tenant_id, v_year
      );
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'users', NEW.id::text, 'status',
        OLD.status::text, NEW.status::text, 'UPDATE',
        'Durum güncellendi',
        v_owner, NEW.last_audit_tenant_id, v_year
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
    SELECT ts.active_sacrifice_year INTO v_year
    FROM public.tenant_settings ts
    WHERE ts.tenant_id = OLD.last_audit_tenant_id;

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'users',
      OLD.id::text,
      'DELETE',
      'Kullanıcı silindi',
      v_owner,
      OLD.last_audit_tenant_id,
      v_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

-- --- log_user_tenants_changes ---
CREATE OR REPLACE FUNCTION public.log_user_tenants_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_cnt int;
  v_year smallint;
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
    SELECT ts.active_sacrifice_year INTO v_year
    FROM public.tenant_settings ts
    WHERE ts.tenant_id = NEW.tenant_id;

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'user_tenants',
      NEW.user_id::text,
      'UPDATE',
      'Kullanıcı onaylandı',
      v_owner,
      NEW.tenant_id,
      v_year
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.approved_at IS NOT NULL AND NEW.approved_at IS NULL THEN
      v_owner := COALESCE(
        NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
        'Anonim Kullanıcı'
      );
      SELECT ts.active_sacrifice_year INTO v_year
      FROM public.tenant_settings ts
      WHERE ts.tenant_id = NEW.tenant_id;

      INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'user_tenants',
        NEW.user_id::text,
        'UPDATE',
        'Kullanıcı onayı kaldırıldı',
        v_owner,
        NEW.tenant_id,
        v_year
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$BODY$;

-- --- Geçmiş kurbanlık audit kayıtları (yıl boş) ---
UPDATE public.change_logs
SET sacrifice_year = 2026
WHERE table_name = 'sacrifice_animals'
  AND sacrifice_year IS NULL;
