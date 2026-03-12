-- Şubat - Mayıs arası
UPDATE shareholders
SET purchase_time =
    TIMESTAMP '2025-02-01 00:00:00' +
    RANDOM() * (TIMESTAMP '2025-05-31 23:59:59' - TIMESTAMP '2025-02-01 00:00:00');

-- Kasım - Ocak arası (alternatif)
-- UPDATE shareholders
-- SET purchase_time =
--     TIMESTAMP '2024-10-01 00:00:00' +
--     RANDOM() * (TIMESTAMP '2025-01-31 23:59:59' - TIMESTAMP '2024-10-01 00:00:00');
