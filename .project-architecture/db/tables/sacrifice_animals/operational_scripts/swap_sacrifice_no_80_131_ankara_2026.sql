-- Ankara Kurban 2026: sıra no 80 ile 131'i yer değiştirir.
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- Üretimde uygulandı; tekrar çalıştırmayın.

BEGIN;

UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası: 80 ↔ 131 (Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 131;

UPDATE sacrifice_animals
SET sacrifice_no = 131,
    last_edited_by = 'Sıra no takası: 80 ↔ 131 (Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 80;

UPDATE sacrifice_animals
SET sacrifice_no = 80,
    last_edited_by = 'Sıra no takası: 80 ↔ 131 (Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

COMMIT;
