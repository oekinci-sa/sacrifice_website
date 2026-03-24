-- Ankara Kurban 2026: sıra no 44 ile 95'i yer değiştirir; kesim saatleri de takas edilir.
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- Üretimde uygulandı; tekrar çalıştırmayın.

BEGIN;

UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (44 ↔ 95, Ankara Kurban 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 44 AND o.sacrifice_no = 95)
    OR (u.sacrifice_no = 95 AND o.sacrifice_no = 44)
  );

UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası (44 ↔ 95, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 44;

UPDATE sacrifice_animals
SET sacrifice_no = 44,
    last_edited_by = 'Sıra no takası (44 ↔ 95, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 95;

UPDATE sacrifice_animals
SET sacrifice_no = 95,
    last_edited_by = 'Sıra no takası (44 ↔ 95, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

COMMIT;
