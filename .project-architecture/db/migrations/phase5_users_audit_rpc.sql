-- Faz 5: users / user_tenants — RPC (trigger-only change_logs)
-- change_logs artık trigger (log_user_changes, log_user_tenants_changes) üzerinden yazılır.
-- Her RPC yalnızca app.actor'ü set_config ile set eder ve tabloyu günceller;
-- trigger bu transaction içinde app.actor'ü görüp change_logs'a yazar.

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

  -- last_edited_by ve last_audit_tenant_id güncelle (trigger bunu actor olarak okur)
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
    -- Trigger (log_user_tenants_changes) bu UPDATE'i yakalar ve change_logs'a yazar.

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
    -- Trigger (log_user_changes) bu UPDATE'i yakalar; status değişimini change_logs'a yazar.

    IF v_st = 'approved'::public.user_status THEN
      UPDATE public.user_tenants ut
      SET approved_at = now()
      WHERE ut.user_id = p_user_id AND ut.tenant_id = p_tenant_id;

      IF p_other_tenant_id IS NOT NULL THEN
        INSERT INTO public.user_tenants (user_id, tenant_id, approved_at)
        VALUES (p_user_id, p_other_tenant_id, now())
        ON CONFLICT (user_id, tenant_id)
        DO UPDATE SET approved_at = excluded.approved_at;
        -- Trigger (log_user_tenants_changes) bu INSERT'i yakalar ve çoklu site onayını loglar.
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
