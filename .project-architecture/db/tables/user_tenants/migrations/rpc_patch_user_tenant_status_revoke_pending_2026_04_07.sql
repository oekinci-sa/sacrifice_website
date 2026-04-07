-- Onay kaldır (revoke): user_tenants.approved_at = NULL sonrası, hiçbir tenant'ta
-- onaylı kayıt kalmadıysa users.status = pending (kara liste hariç).
-- Böylece UI ve users tablosu tutarlı kalır.

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

    IF NOT EXISTS (
      SELECT 1
      FROM public.user_tenants ut2
      WHERE ut2.user_id = p_user_id AND ut2.approved_at IS NOT NULL
    ) THEN
      UPDATE public.users u
      SET
        status = CASE
          WHEN u.status = 'blacklisted'::public.user_status THEN u.status
          ELSE 'pending'::public.user_status
        END,
        updated_at = now(),
        last_edited_by = p_actor,
        last_audit_tenant_id = p_tenant_id
      WHERE u.id = p_user_id;
    END IF;

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
