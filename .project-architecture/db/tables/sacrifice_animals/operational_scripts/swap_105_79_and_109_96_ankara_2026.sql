-- Ankara Kurban 2026: sıra takasları 105↔79 ve 109↔96 (önceki betiklerle aynı mantık).
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- Her çift: sacrifice_time takası, sonra sacrifice_no (küçük→-9999, büyük→küçük, -9999→büyük)
-- Üretimde bir kez uygulanır; ikinci kez çalıştırmayın.

BEGIN;

-- Kesim saatleri
UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (105↔79, Ankara 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 79 AND o.sacrifice_no = 105)
    OR (u.sacrifice_no = 105 AND o.sacrifice_no = 79)
  );

UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (109↔96, Ankara 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 96 AND o.sacrifice_no = 109)
    OR (u.sacrifice_no = 109 AND o.sacrifice_no = 96)
  );

-- Sıra no: 79 ↔ 105
UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası (105↔79, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 79;

UPDATE sacrifice_animals
SET sacrifice_no = 79,
    last_edited_by = 'Sıra no takası (105↔79, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 105;

UPDATE sacrifice_animals
SET sacrifice_no = 105,
    last_edited_by = 'Sıra no takası (105↔79, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

-- Sıra no: 96 ↔ 109
UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası (109↔96, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 96;

UPDATE sacrifice_animals
SET sacrifice_no = 96,
    last_edited_by = 'Sıra no takası (109↔96, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 109;

UPDATE sacrifice_animals
SET sacrifice_no = 109,
    last_edited_by = 'Sıra no takası (109↔96, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

COMMIT;
