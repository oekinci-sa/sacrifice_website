-- =============================================================================
-- Konum (repo): .project-architecture/db/tables/change_logs/migrations/
-- Migration: trigger_only_change_logs_2026_03
-- Tüm change_logs yazımı RPC'den trigger'lara taşındı.
-- Kapsam:
--   1. log_user_changes()          → users AFTER INSERT/UPDATE/DELETE
--   2. log_user_tenants_changes()  → user_tenants AFTER INSERT/UPDATE (güncellendi)
--   3. log_mismatch_changes()      → mismatched_share_acknowledgments AFTER INSERT/DELETE
--   4. log_stage_metrics_changes() → stage_metrics AFTER UPDATE OF current_sacrifice_number
--   5. rpc_update_stage_metrics()  → doğrudan INSERT kaldırıldı, trigger tetiklenir
--   6. rpc_acknowledge_mismatch()  → doğrudan INSERT kaldırıldı, trigger tetiklenir
--   7. rpc_revoke_mismatch()       → doğrudan INSERT kaldırıldı, trigger tetiklenir
--   8. rpc_create_user()           → doğrudan INSERT kaldırıldı, trigger tetiklenir
--   9. rpc_update_user()           → doğrudan INSERT'ler kaldırıldı, trigger tetiklenir
--  10. rpc_delete_user()           → doğrudan INSERT kaldırıldı, trigger tetiklenir
--  11. rpc_patch_user_tenant_status() → doğrudan INSERT'ler kaldırıldı, trigger tetiklenir
-- Önceki oturumdan kalan RPC tabanlı change_logs fonksiyonları temizlendi.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. USERS — log_user_changes trigger
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 2. USER_TENANTS — log_user_tenants_changes (actor düzeltmesi)
--    user_tenants tablosunda last_edited_by kolonu yok; sadece app.actor GUC.
-- ---------------------------------------------------------------------------

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
      'Kullanıcılar',
      NEW.user_id::text,
      'Güncelleme',
      'Kullanıcı ikinci bir organizasyonda da onaylı üye yapıldı (aynı hesap, çoklu site erişimi).',
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
        'Kullanıcılar',
        NEW.user_id::text,
        'Güncelleme',
        'Bu organizasyonda kullanıcının «onaylı üye» kaydı kaldırıldı; tekrar onaylanması gerekebilir.',
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

-- ---------------------------------------------------------------------------
-- 3. MISMATCHED_SHARE_ACKNOWLEDGMENTS — log_mismatch_changes trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_mismatch_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_no    INT2;
  v_year  INT2;
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
      'Hisse Uyumsuzluğu',
      COALESCE(v_no::text, NEW.sacrifice_id::text),
      'Güncelleme',
      'Bu kurbanlıkta toplam hisse sayısı 7 değil; yönetici ekranda «Tamam, uyumsuzluğu biliyorum» ile uyarıyı onayladı. Kurban sıra no: ' || COALESCE(v_no::text, '—') || '.',
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
      'Hisse Uyumsuzluğu',
      COALESCE(v_no::text, OLD.sacrifice_id::text),
      'Güncelleme',
      'Hisse uyumsuzluğu onayı kaldırıldı; bu kurbanlık listesinde yeniden uyarı gösterebilir. Kurban sıra no: ' || COALESCE(v_no::text, '—') || '.',
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

-- ---------------------------------------------------------------------------
-- 4. STAGE_METRICS — log_stage_metrics_changes trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_stage_metrics_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner       text;
  v_stage_label text;
BEGIN
  IF OLD.current_sacrifice_number IS NOT DISTINCT FROM NEW.current_sacrifice_number THEN
    RETURN NEW;
  END IF;

  v_owner := COALESCE(
    NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
    NEW.last_edited_by,
    'Anonim Kullanıcı'
  );

  v_stage_label := CASE NEW.stage
    WHEN 'slaughter_stage' THEN 'Kesim'
    WHEN 'butcher_stage'   THEN 'Parçalama'
    WHEN 'delivery_stage'  THEN 'Teslimat'
    ELSE NEW.stage
  END;

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
    'Aşama Metrikleri',
    NEW.stage,
    'Güncel kurban sırası (takip)',
    COALESCE(OLD.current_sacrifice_number::text, '—'),
    NEW.current_sacrifice_number::text,
    'Güncelleme',
    'Takip ekranında «' || v_stage_label || '» aşaması için gösterilen «şu an işlenen kurban sıra numarası» güncellendi: '
      || COALESCE(OLD.current_sacrifice_number::text, '—') || ' → ' || NEW.current_sacrifice_number::text || '.',
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

-- ---------------------------------------------------------------------------
-- 5. rpc_update_stage_metrics — doğrudan INSERT kaldırıldı; last_edited_by eklendi
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_update_stage_metrics(
  p_actor text,
  p_tenant_id uuid,
  p_stage text,
  p_current_sacrifice_number int2
)
RETURNS SETOF public.stage_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_new public.stage_metrics;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  IF p_stage NOT IN ('slaughter_stage', 'butcher_stage', 'delivery_stage') THEN
    RAISE EXCEPTION 'invalid_stage';
  END IF;

  PERFORM set_config('app.actor', p_actor, true);

  IF NOT EXISTS (
    SELECT 1 FROM public.stage_metrics sm
    WHERE sm.tenant_id = p_tenant_id AND sm.stage = p_stage
  ) THEN
    RAISE EXCEPTION 'stage_metrics_not_found';
  END IF;

  UPDATE public.stage_metrics sm
  SET
    current_sacrifice_number = p_current_sacrifice_number,
    last_edited_by           = p_actor
  WHERE sm.tenant_id = p_tenant_id
    AND sm.stage     = p_stage
  RETURNING * INTO v_new;

  RETURN NEXT v_new;
  RETURN;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_update_stage_metrics(text, uuid, text, int2) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_update_stage_metrics(text, uuid, text, int2) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. rpc_acknowledge_mismatch / rpc_revoke_mismatch — doğrudan INSERT kaldırıldı
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_acknowledge_mismatch(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid
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

  IF NOT EXISTS (
    SELECT 1 FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = p_sacrifice_id AND sa.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'sacrifice_not_found';
  END IF;

  INSERT INTO public.mismatched_share_acknowledgments (
    sacrifice_id,
    tenant_id,
    acknowledged_by,
    acknowledged_at,
    last_edited_by
  )
  VALUES (
    p_sacrifice_id,
    p_tenant_id,
    p_actor,
    now(),
    p_actor
  )
  ON CONFLICT (sacrifice_id) DO UPDATE SET
    tenant_id       = excluded.tenant_id,
    acknowledged_by = excluded.acknowledged_by,
    acknowledged_at = excluded.acknowledged_at,
    last_edited_by  = excluded.last_edited_by;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_revoke_mismatch(
  p_actor text,
  p_tenant_id uuid,
  p_sacrifice_id uuid
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

  IF NOT EXISTS (
    SELECT 1 FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = p_sacrifice_id AND sa.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'sacrifice_not_found';
  END IF;

  DELETE FROM public.mismatched_share_acknowledgments m
  WHERE m.sacrifice_id = p_sacrifice_id
    AND m.tenant_id    = p_tenant_id;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_acknowledge_mismatch(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_revoke_mismatch(text, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_acknowledge_mismatch(text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_revoke_mismatch(text, uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 7. rpc_create_user / rpc_update_user / rpc_delete_user / rpc_patch_user_tenant_status
--    Doğrudan INSERT INTO change_logs kaldırıldı; last_edited_by + last_audit_tenant_id eklendi.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_create_user(
  p_actor text,
  p_tenant_id uuid,
  p_user jsonb
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  r public.users;
  v_email text;
  v_approved_at timestamptz;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  v_email := trim(COALESCE(p_user->>'email', ''));
  IF v_email = '' THEN
    RAISE EXCEPTION 'email_required';
  END IF;

  INSERT INTO public.users (
    email,
    name,
    image,
    role,
    status,
    updated_at,
    last_edited_by,
    last_audit_tenant_id
  )
  VALUES (
    v_email,
    NULLIF(trim(COALESCE(p_user->>'name', '')), ''),
    NULLIF(trim(COALESCE(p_user->>'image', '')), ''),
    CASE
      WHEN (p_user ? 'role')
        AND nullif(trim(p_user->>'role'), '') IS NOT NULL
      THEN (trim(p_user->>'role'))::public.user_role
      ELSE NULL
    END,
    CASE
      WHEN (p_user ? 'status')
        AND nullif(trim(p_user->>'status'), '') IS NOT NULL
      THEN (trim(p_user->>'status'))::public.user_status
      ELSE 'pending'::public.user_status
    END,
    now(),
    p_actor,
    p_tenant_id
  )
  RETURNING * INTO r;

  v_approved_at := CASE
    WHEN r.status = 'approved'::public.user_status THEN now()
    ELSE NULL
  END;

  INSERT INTO public.user_tenants (user_id, tenant_id, approved_at)
  VALUES (r.id, p_tenant_id, v_approved_at);

  RETURN NEXT r;
  RETURN;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_update_user(
  p_actor text,
  p_tenant_id uuid,
  p_user_id uuid,
  p_patch jsonb
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  new_rec public.users;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_tenants ut
    WHERE ut.user_id = p_user_id AND ut.tenant_id = p_tenant_id
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  UPDATE public.users u
  SET
    name = CASE
      WHEN p_patch ? 'name' THEN NULLIF(trim(COALESCE(p_patch->>'name', '')), '')
      ELSE u.name
    END,
    image = CASE
      WHEN p_patch ? 'image' THEN NULLIF(trim(COALESCE(p_patch->>'image', '')), '')
      ELSE u.image
    END,
    role = CASE
      WHEN NOT (p_patch ? 'role') THEN u.role
      WHEN p_patch->'role' IS NULL OR jsonb_typeof(p_patch->'role') = 'null' THEN NULL
      WHEN nullif(trim(p_patch->>'role'), '') IS NULL THEN NULL
      ELSE (trim(p_patch->>'role'))::public.user_role
    END,
    email = CASE
      WHEN p_patch ? 'email' THEN trim(p_patch->>'email')
      ELSE u.email
    END,
    updated_at           = now(),
    last_edited_by       = p_actor,
    last_audit_tenant_id = p_tenant_id
  WHERE u.id = p_user_id
  RETURNING * INTO new_rec;

  RETURN NEXT new_rec;
  RETURN;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_delete_user(
  p_actor text,
  p_tenant_id uuid,
  p_user_id uuid
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    INNER JOIN public.user_tenants ut
      ON ut.user_id = u.id AND ut.tenant_id = p_tenant_id
    WHERE u.id = p_user_id
  ) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  UPDATE public.users
  SET last_edited_by       = p_actor,
      last_audit_tenant_id = p_tenant_id
  WHERE id = p_user_id;

  DELETE FROM public.users WHERE id = p_user_id;
END;
$f$;

CREATE OR REPLACE FUNCTION public.rpc_patch_user_tenant_status(
  p_actor text,
  p_tenant_id uuid,
  p_user_id uuid,
  p_revoke_approval boolean,
  p_status text,
  p_other_tenant_id uuid
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_st public.user_status;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;
  PERFORM set_config('app.actor', p_actor, true);

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_tenants ut
    WHERE ut.user_id = p_user_id AND ut.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'user_tenant_not_found';
  END IF;

  IF p_revoke_approval THEN
    UPDATE public.user_tenants ut
    SET approved_at = NULL
    WHERE ut.user_id = p_user_id AND ut.tenant_id = p_tenant_id;

    RETURN QUERY SELECT * FROM public.users WHERE id = p_user_id;
    RETURN;
  END IF;

  IF p_status IS NOT NULL AND length(trim(p_status)) > 0 THEN
    v_st := trim(p_status)::public.user_status;

    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
      RAISE EXCEPTION 'user_not_found';
    END IF;

    UPDATE public.users u
    SET
      status               = v_st,
      updated_at           = now(),
      last_edited_by       = p_actor,
      last_audit_tenant_id = p_tenant_id
    WHERE u.id = p_user_id;

    IF v_st = 'approved'::public.user_status THEN
      UPDATE public.user_tenants ut
      SET approved_at = now()
      WHERE ut.user_id = p_user_id AND ut.tenant_id = p_tenant_id;

      IF p_other_tenant_id IS NOT NULL THEN
        INSERT INTO public.user_tenants (user_id, tenant_id, approved_at)
        VALUES (p_user_id, p_other_tenant_id, now())
        ON CONFLICT (user_id, tenant_id)
        DO UPDATE SET approved_at = excluded.approved_at;
      END IF;
    END IF;

    RETURN QUERY SELECT * FROM public.users WHERE id = p_user_id;
    RETURN;
  END IF;

  RETURN;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_create_user(text, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_update_user(text, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_delete_user(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_patch_user_tenant_status(text, uuid, uuid, boolean, text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_create_user(text, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_user(text, uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_delete_user(text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_patch_user_tenant_status(text, uuid, uuid, boolean, text, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 8. Önceki oturumdan kalan RPC-tabanlı change_logs fonksiyonlarını temizle
--    (change_logs_friendlier_* migration'larından)
-- ---------------------------------------------------------------------------

-- Eski change_logs yazıcısı olarak oluşturulmuş ancak artık trigger üzerinden çalışan
-- fonksiyonların önceki versiyonları CREATE OR REPLACE ile zaten güncellendi.
-- Ayrıca DB'de bırakılan geçici trigger'lar varsa DROP edilir:
DROP TRIGGER IF EXISTS trigger_user_changes           ON public.users;
DROP TRIGGER IF EXISTS trigger_user_tenants_changes   ON public.user_tenants;
DROP TRIGGER IF EXISTS trigger_mismatch_changes       ON public.mismatched_share_acknowledgments;
DROP TRIGGER IF EXISTS trigger_stage_metrics_changes  ON public.stage_metrics;

-- Yeniden oluştur (yukarıdaki CREATE TRIGGER'larla aynı — idempotent olması için):
CREATE TRIGGER trigger_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_changes();

CREATE TRIGGER trigger_user_tenants_changes
  AFTER INSERT OR UPDATE ON public.user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_tenants_changes();

CREATE TRIGGER trigger_mismatch_changes
  AFTER INSERT OR DELETE ON public.mismatched_share_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mismatch_changes();

CREATE TRIGGER trigger_stage_metrics_changes
  AFTER UPDATE OF current_sacrifice_number ON public.stage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_stage_metrics_changes();
