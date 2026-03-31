-- user_tenants: çoklu tenant onayı + org içi onay iptali → change_logs
-- Actor: app.actor GUC (RPC'den set_config ile gelir); user_tenants tablosunda last_edited_by kolonu yok.
-- sacrifice_year: tenant_settings.active_sacrifice_year

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

DROP TRIGGER IF EXISTS trigger_user_tenants_changes ON public.user_tenants;

CREATE TRIGGER trigger_user_tenants_changes
  AFTER INSERT OR UPDATE ON public.user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_tenants_changes();
