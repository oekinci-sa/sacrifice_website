-- Ankara Kurban 2026: sıra 101 ↔ 70 takası (önceki 7 çift betiğiyle aynı mantık).
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- 1) sacrifice_time takası
-- 2) sacrifice_no: küçük (70) → -9999, büyük (101) → 70, -9999 → 101
-- Üretimde bir kez uygulanır; ikinci kez çalıştırmayın.

BEGIN;

UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (101↔70, Ankara 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 70 AND o.sacrifice_no = 101)
    OR (u.sacrifice_no = 101 AND o.sacrifice_no = 70)
  );

UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası (101↔70, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 70;

UPDATE sacrifice_animals
SET sacrifice_no = 70,
    last_edited_by = 'Sıra no takası (101↔70, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 101;

UPDATE sacrifice_animals
SET sacrifice_no = 101,
    last_edited_by = 'Sıra no takası (101↔70, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

COMMIT;
