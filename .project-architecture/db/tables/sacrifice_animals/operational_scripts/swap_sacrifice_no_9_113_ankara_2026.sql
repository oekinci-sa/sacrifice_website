-- Ankara Kurban 2026: sıra no 9 ile 113'ü yer değiştirir.
-- Uyarı: Üretimde bir kez uygulandı (2026). Tekrar çalıştırmayın; tersine çevirmek için
-- aynı mantıkla (geçici -9999) tekrar takas edin veya yedekten dönün.
-- tenant_id: 00000000-0000-0000-0000-000000000002 (seed_ankara_kurban_2026.sql)
-- sacrifice_id değişmez; hissedar bağlantıları korunur.
-- uq_sacrifice_no_per_tenant_year nedeniyle geçici numara (-9999) ile 3 adım.

BEGIN;

UPDATE sacrifice_animals
SET sacrifice_no = -9999,
    last_edited_by = 'Sıra no takası: 9 ↔ 113 (Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 9;

UPDATE sacrifice_animals
SET sacrifice_no = 9,
    last_edited_by = 'Sıra no takası: 9 ↔ 113 (Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = 113;

UPDATE sacrifice_animals
SET sacrifice_no = 113,
    last_edited_by = 'Sıra no takası: 9 ↔ 113 (Ankara Kurban 2026)'
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND sacrifice_year = 2026
  AND sacrifice_no = -9999;

COMMIT;
