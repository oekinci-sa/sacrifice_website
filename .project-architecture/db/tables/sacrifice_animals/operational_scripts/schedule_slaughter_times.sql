-- Açıklama: Kesim saatlerini sabah (06:30-12:45) ve öğleden sonra (13:30+)
--           aralıklarına göre dizerek sacrifice_no ve sacrifice_time'ı günceller.

-- Kesim saatlerini belirli aralıklarla dizmek. Cumadan önce ve cumadan sonra olmak üzere.
BEGIN;

WITH params AS (
  SELECT
    FLOOR(
      (EXTRACT(EPOCH FROM (TIME '12:45' - TIME '06:30')) / 60)
      / 5
    )::INT
    + 1 AS morning_count
),
numbered AS (
  SELECT
    sacrifice_id,
    ROW_NUMBER() OVER (ORDER BY sacrifice_id ASC) AS rn
  FROM sacrifice_animals
)
UPDATE sacrifice_animals AS sa
SET
  sacrifice_no   = numbered.rn,
  sacrifice_time = CASE
    WHEN numbered.rn <= params.morning_count THEN
      TIME '06:30'
      + (numbered.rn - 1) * INTERVAL '5 minutes'
    ELSE
      TIME '13:30'
      + (numbered.rn - params.morning_count - 1) * INTERVAL '6 minutes'
  END
FROM numbered
CROSS JOIN params
WHERE sa.sacrifice_id = numbered.sacrifice_id;

COMMIT;
