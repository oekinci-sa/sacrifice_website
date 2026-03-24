-- Ankara Kurban 2026: kesim saatlerini çiftler halinde takas eder (sacrifice_time).
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- planned_delivery_time sütunu sacrifice_time + 90 dk olarak türetildiği için otomatik güncellenir.
-- Üretimde uygulandı; tekrar çalıştırmak saatleri tekrar yer değiştirir.

BEGIN;

UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (9 ↔ 113, Ankara Kurban 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 9 AND o.sacrifice_no = 113)
    OR (u.sacrifice_no = 113 AND o.sacrifice_no = 9)
  );

UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (80 ↔ 131, Ankara Kurban 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 80 AND o.sacrifice_no = 131)
    OR (u.sacrifice_no = 131 AND o.sacrifice_no = 80)
  );

COMMIT;
