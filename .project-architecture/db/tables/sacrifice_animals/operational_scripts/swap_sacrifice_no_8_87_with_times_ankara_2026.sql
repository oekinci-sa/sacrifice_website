-- Ankara Kurban 2026: sıra no 8 ile 87'yi yer değiştirir; kesim saatleri de buna uygun
-- takas edilir (düşük numara daha erken saatte kalır).
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- Önce sacrifice_time çiftler halinde takas (unique ihlali yok), sonra sacrifice_no için -9999 ile 3 adım.
-- Üretimde uygulandı; tekrar çalıştırmayın.

BEGIN;

UPDATE sacrifice_animals u
SET sacrifice_time = o.sacrifice_time,
    last_edited_by = 'Kesim saati takası (8 ↔ 87, Ankara Kurban 2026)'
FROM sacrifice_animals o
WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002'
  AND u.sacrifice_year = 2026
  AND o.tenant_id = u.tenant_id
  AND o.sacrifice_year = u.sacrifice_year
  AND (
    (u.sacrifice_no = 8 AND o.sacrifice_no = 87)
    OR (u.sacrifice_no = 87 AND o.sacrifice_no = 8)
  );

UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası (8 ↔ 87, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 8;

UPDATE sacrifice_animals
SET sacrifice_no = 8,
    last_edited_by = 'Sıra no takası (8 ↔ 87, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 87;

UPDATE sacrifice_animals
SET sacrifice_no = 87,
    last_edited_by = 'Sıra no takası (8 ↔ 87, Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

COMMIT;
