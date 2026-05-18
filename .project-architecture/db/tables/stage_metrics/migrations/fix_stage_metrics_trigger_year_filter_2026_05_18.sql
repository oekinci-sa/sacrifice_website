-- stage_metrics tetikleyicileri: sacrifice_animals sorgularında tenant_id + sacrifice_year filtresi.
-- Supabase: fix_stage_metrics_trigger_sacrifice_year_filter, _butcher_, _delivery_ (20260518044819–47)
-- Kaynak (tek dosya): ../functions_and_triggers/update_stage_metrics.sql

-- 1. slaughter_time
CREATE OR REPLACE FUNCTION update_slaughter_stage_metrics()
RETURNS TRIGGER AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  count INTEGER;
  duration_seconds INTEGER;
  latest_sacrifice_no INT2;
BEGIN
  IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
    SELECT COUNT(slaughter_time), MIN(slaughter_time), MAX(slaughter_time)
    INTO count, earliest, latest
    FROM sacrifice_animals
    WHERE slaughter_time IS NOT NULL
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year;

    IF count > 1 THEN
      duration_seconds := LEAST(
        EXTRACT(EPOCH FROM (latest - earliest))::INTEGER / (count - 1),
        32767
      );
    ELSE
      duration_seconds := 0;
    END IF;

    SELECT sacrifice_no
    INTO latest_sacrifice_no
    FROM sacrifice_animals
    WHERE slaughter_time = latest
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year
    ORDER BY sacrifice_no DESC
    LIMIT 1;

    UPDATE stage_metrics
    SET avg_progress_duration = duration_seconds,
        current_sacrifice_number = latest_sacrifice_no
    WHERE tenant_id = NEW.tenant_id AND stage = 'slaughter_stage';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. butcher_time
CREATE OR REPLACE FUNCTION update_butcher_stage_metrics()
RETURNS TRIGGER AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  count INTEGER;
  duration_seconds INTEGER;
  latest_sacrifice_no INT2;
BEGIN
  IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
    SELECT COUNT(butcher_time), MIN(butcher_time), MAX(butcher_time)
    INTO count, earliest, latest
    FROM sacrifice_animals
    WHERE butcher_time IS NOT NULL
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year;

    IF count > 1 THEN
      duration_seconds := LEAST(
        EXTRACT(EPOCH FROM (latest - earliest))::INTEGER / (count - 1),
        32767
      );
    ELSE
      duration_seconds := 0;
    END IF;

    SELECT sacrifice_no
    INTO latest_sacrifice_no
    FROM sacrifice_animals
    WHERE butcher_time = latest
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year
    ORDER BY sacrifice_no DESC
    LIMIT 1;

    UPDATE stage_metrics
    SET avg_progress_duration = duration_seconds,
        current_sacrifice_number = latest_sacrifice_no
    WHERE tenant_id = NEW.tenant_id AND stage = 'butcher_stage';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. delivery_time
CREATE OR REPLACE FUNCTION update_delivery_stage_metrics()
RETURNS TRIGGER AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  count INTEGER;
  duration_seconds INTEGER;
  latest_sacrifice_no INT2;
BEGIN
  IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
    SELECT COUNT(delivery_time), MIN(delivery_time), MAX(delivery_time)
    INTO count, earliest, latest
    FROM sacrifice_animals
    WHERE delivery_time IS NOT NULL
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year;

    IF count > 1 THEN
      duration_seconds := LEAST(
        EXTRACT(EPOCH FROM (latest - earliest))::INTEGER / (count - 1),
        32767
      );
    ELSE
      duration_seconds := 0;
    END IF;

    SELECT sacrifice_no
    INTO latest_sacrifice_no
    FROM sacrifice_animals
    WHERE delivery_time = latest
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year
    ORDER BY sacrifice_no DESC
    LIMIT 1;

    UPDATE stage_metrics
    SET avg_progress_duration = duration_seconds,
        current_sacrifice_number = latest_sacrifice_no
    WHERE tenant_id = NEW.tenant_id AND stage = 'delivery_stage';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
