-- ===============================================
-- Fonksiyonlar: sacrifice_animals tablosundaki slaughter_time, butcher_time,
--              delivery_time değişikliklerinde stage_metrics tablosunu günceller.
-- Açıklama   : Her aşama için ortalama ilerleme süresini (saniye) ve güncel
--              kurban numarasını hesaplar. Frontend'de kuyruk ilerlemesini
--              takip etmek için kullanılır.
--
-- Arıza düzeltmesi: stage_downtime_events tablosundaki kayıtlar ortalama
-- hesabında toplam süreden çıkarılır. Çakışan aralıklar birleştirilir.
-- Kural: slaughter arızası → slaughter; butcher arızası → slaughter+butcher;
--        delivery arızası → tüm aşamaları etkiler (en geniş etki).
--
-- Trigger'lar: trg_update_slaughter_metrics, trg_update_butcher_metrics,
--              trg_update_delivery_metrics
-- ===============================================

-- 1. Fonksiyon: slaughter_time değiştiğinde stage_metrics güncelle
CREATE OR REPLACE FUNCTION update_slaughter_stage_metrics()
RETURNS TRIGGER AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  v_count INTEGER;
  raw_duration_seconds INTEGER;
  total_downtime_seconds INTEGER;
  duration_seconds INTEGER;
  latest_sacrifice_no INT2;
BEGIN
  IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
    SELECT COUNT(slaughter_time), MIN(slaughter_time), MAX(slaughter_time)
    INTO v_count, earliest, latest
    FROM sacrifice_animals
    WHERE slaughter_time IS NOT NULL
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year;

    IF v_count > 1 THEN
      raw_duration_seconds := EXTRACT(EPOCH FROM (latest - earliest))::INTEGER;

      -- Kesim arızası sadece slaughter_stage'i doğrudan etkiler
      WITH applicable AS (
        SELECT started_time, ended_time
        FROM stage_downtime_events
        WHERE tenant_id = NEW.tenant_id
          AND sacrifice_year = NEW.sacrifice_year
          AND affected_stage = 'slaughter'
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

      duration_seconds := LEAST(
        GREATEST(raw_duration_seconds - total_downtime_seconds, 0) / (v_count - 1),
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

-- 2. Fonksiyon: butcher_time değiştiğinde stage_metrics güncelle
CREATE OR REPLACE FUNCTION update_butcher_stage_metrics()
RETURNS TRIGGER AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  v_count INTEGER;
  raw_duration_seconds INTEGER;
  total_downtime_seconds INTEGER;
  duration_seconds INTEGER;
  latest_sacrifice_no INT2;
BEGIN
  IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
    SELECT COUNT(butcher_time), MIN(butcher_time), MAX(butcher_time)
    INTO v_count, earliest, latest
    FROM sacrifice_animals
    WHERE butcher_time IS NOT NULL
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year;

    IF v_count > 1 THEN
      raw_duration_seconds := EXTRACT(EPOCH FROM (latest - earliest))::INTEGER;

      -- Parçalama ortalamasından: slaughter + butcher arızaları düşülür
      WITH applicable AS (
        SELECT started_time, ended_time
        FROM stage_downtime_events
        WHERE tenant_id = NEW.tenant_id
          AND sacrifice_year = NEW.sacrifice_year
          AND affected_stage IN ('slaughter', 'butcher')
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

      duration_seconds := LEAST(
        GREATEST(raw_duration_seconds - total_downtime_seconds, 0) / (v_count - 1),
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

-- 3. Fonksiyon: delivery_time değiştiğinde stage_metrics güncelle
CREATE OR REPLACE FUNCTION update_delivery_stage_metrics()
RETURNS TRIGGER AS $$
DECLARE
  earliest TIMESTAMP;
  latest TIMESTAMP;
  v_count INTEGER;
  raw_duration_seconds INTEGER;
  total_downtime_seconds INTEGER;
  duration_seconds INTEGER;
  latest_sacrifice_no INT2;
BEGIN
  IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
    SELECT COUNT(delivery_time), MIN(delivery_time), MAX(delivery_time)
    INTO v_count, earliest, latest
    FROM sacrifice_animals
    WHERE delivery_time IS NOT NULL
      AND tenant_id = NEW.tenant_id
      AND sacrifice_year = NEW.sacrifice_year;

    IF v_count > 1 THEN
      raw_duration_seconds := EXTRACT(EPOCH FROM (latest - earliest))::INTEGER;

      -- Teslimat ortalamasından: slaughter + butcher + delivery arızaları düşülür
      WITH applicable AS (
        SELECT started_time, ended_time
        FROM stage_downtime_events
        WHERE tenant_id = NEW.tenant_id
          AND sacrifice_year = NEW.sacrifice_year
          AND affected_stage IN ('slaughter', 'butcher', 'delivery')
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

      duration_seconds := LEAST(
        GREATEST(raw_duration_seconds - total_downtime_seconds, 0) / (v_count - 1),
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

-- Trigger 1: slaughter_time için
CREATE TRIGGER trg_update_slaughter_metrics
AFTER UPDATE OF slaughter_time ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_slaughter_stage_metrics();

-- Trigger 2: butcher_time için
CREATE TRIGGER trg_update_butcher_metrics
AFTER UPDATE OF butcher_time ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_butcher_stage_metrics();

-- Trigger 3: delivery_time için
CREATE TRIGGER trg_update_delivery_metrics
AFTER UPDATE OF delivery_time ON sacrifice_animals
FOR EACH ROW
EXECUTE FUNCTION update_delivery_stage_metrics();
