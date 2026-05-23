-- Birleştirilmiş arıza aralıklarının toplam saniyesini hesaplar.
CREATE OR REPLACE FUNCTION compute_merged_downtime_seconds(
  p_tenant_id UUID,
  p_sacrifice_year SMALLINT,
  p_affected_stages TEXT[]
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_downtime_seconds INTEGER;
BEGIN
  WITH applicable AS (
    SELECT started_time, ended_time
    FROM stage_downtime_events
    WHERE tenant_id = p_tenant_id
      AND sacrifice_year = p_sacrifice_year
      AND affected_stage = ANY(p_affected_stages)
  ),
  ordered AS (
    SELECT started_time, ended_time,
      MAX(ended_time) OVER (
        ORDER BY started_time ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS prev_max_end
    FROM applicable
  ),
  island_start AS (
    SELECT started_time, ended_time,
      SUM(CASE
        WHEN prev_max_end IS NOT NULL AND started_time <= prev_max_end THEN 0 ELSE 1
      END) OVER (ORDER BY started_time) AS grp
    FROM ordered
  ),
  merged AS (
    SELECT MAX(ended_time) - MIN(started_time) AS span
    FROM island_start GROUP BY grp
  )
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM span))::INTEGER, 0)
  INTO total_downtime_seconds
  FROM merged;

  RETURN COALESCE(total_downtime_seconds, 0);
END;
$$;

-- Arıza kaydı CRUD sonrası avg_progress_duration yeniden hesaplanır (current_sacrifice_number dokunulmaz).
CREATE OR REPLACE FUNCTION recalculate_stage_metrics_averages(
  p_tenant_id UUID,
  p_sacrifice_year SMALLINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  v_count INTEGER;
  raw_duration_seconds INTEGER;
  total_downtime_seconds INTEGER;
  duration_seconds INTEGER;
BEGIN
  -- slaughter_stage
  SELECT COUNT(slaughter_time), MIN(slaughter_time), MAX(slaughter_time)
  INTO v_count, earliest, latest
  FROM sacrifice_animals
  WHERE slaughter_time IS NOT NULL
    AND tenant_id = p_tenant_id
    AND sacrifice_year = p_sacrifice_year;

  IF v_count > 1 THEN
    raw_duration_seconds := EXTRACT(EPOCH FROM (latest - earliest))::INTEGER;
    total_downtime_seconds := compute_merged_downtime_seconds(
      p_tenant_id, p_sacrifice_year, ARRAY['slaughter']
    );
    duration_seconds := LEAST(
      GREATEST(raw_duration_seconds - total_downtime_seconds, 0) / (v_count - 1),
      32767
    );
  ELSE
    duration_seconds := 0;
  END IF;

  UPDATE stage_metrics
  SET avg_progress_duration = duration_seconds
  WHERE tenant_id = p_tenant_id AND stage = 'slaughter_stage';

  -- butcher_stage
  SELECT COUNT(butcher_time), MIN(butcher_time), MAX(butcher_time)
  INTO v_count, earliest, latest
  FROM sacrifice_animals
  WHERE butcher_time IS NOT NULL
    AND tenant_id = p_tenant_id
    AND sacrifice_year = p_sacrifice_year;

  IF v_count > 1 THEN
    raw_duration_seconds := EXTRACT(EPOCH FROM (latest - earliest))::INTEGER;
    total_downtime_seconds := compute_merged_downtime_seconds(
      p_tenant_id, p_sacrifice_year, ARRAY['slaughter', 'butcher']
    );
    duration_seconds := LEAST(
      GREATEST(raw_duration_seconds - total_downtime_seconds, 0) / (v_count - 1),
      32767
    );
  ELSE
    duration_seconds := 0;
  END IF;

  UPDATE stage_metrics
  SET avg_progress_duration = duration_seconds
  WHERE tenant_id = p_tenant_id AND stage = 'butcher_stage';

  -- delivery_stage
  SELECT COUNT(delivery_time), MIN(delivery_time), MAX(delivery_time)
  INTO v_count, earliest, latest
  FROM sacrifice_animals
  WHERE delivery_time IS NOT NULL
    AND tenant_id = p_tenant_id
    AND sacrifice_year = p_sacrifice_year;

  IF v_count > 1 THEN
    raw_duration_seconds := EXTRACT(EPOCH FROM (latest - earliest))::INTEGER;
    total_downtime_seconds := compute_merged_downtime_seconds(
      p_tenant_id, p_sacrifice_year, ARRAY['slaughter', 'butcher', 'delivery']
    );
    duration_seconds := LEAST(
      GREATEST(raw_duration_seconds - total_downtime_seconds, 0) / (v_count - 1),
      32767
    );
  ELSE
    duration_seconds := 0;
  END IF;

  UPDATE stage_metrics
  SET avg_progress_duration = duration_seconds
  WHERE tenant_id = p_tenant_id AND stage = 'delivery_stage';
END;
$$;

REVOKE ALL ON FUNCTION compute_merged_downtime_seconds(UUID, SMALLINT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION recalculate_stage_metrics_averages(UUID, SMALLINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION compute_merged_downtime_seconds(UUID, SMALLINT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION recalculate_stage_metrics_averages(UUID, SMALLINT) TO service_role;
