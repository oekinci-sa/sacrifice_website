CREATE OR REPLACE FUNCTION public.bulk_update_planned_delivery_time(
  p_tenant_id uuid,
  p_sacrifice_year int2,
  p_offset_minutes int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sacrifice_animals
  SET planned_delivery_time = (sacrifice_time + (p_offset_minutes || ' minutes')::interval)::time
  WHERE tenant_id = p_tenant_id
    AND sacrifice_year = p_sacrifice_year;
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_update_planned_delivery_time(uuid, int2, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_update_planned_delivery_time(uuid, int2, int) TO service_role;
