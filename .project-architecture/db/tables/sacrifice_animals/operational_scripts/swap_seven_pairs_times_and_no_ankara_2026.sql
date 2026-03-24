-- Ankara Kurban 2026: 7 çift için sıra no + kesim saati takası.
-- tenant_id: 00000000-0000-0000-0000-000000000002
-- Çiftler: 130↔87, 128↔88, 127↔89, 122↔91, 116↔92, 114↔93, 108↔95
-- 1) Tüm çiftlerde sacrifice_time takası (7 UPDATE)
-- 2) Her çift için küçük numara → -9999, büyük → küçük, -9999 → büyük (21 UPDATE)
-- Üretimde uygulandı; tekrar çalıştırmayın.

-- Bölüm 1: kesim saatleri
BEGIN;
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 87 AND o.sacrifice_no = 130) OR (u.sacrifice_no = 130 AND o.sacrifice_no = 87));
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 88 AND o.sacrifice_no = 128) OR (u.sacrifice_no = 128 AND o.sacrifice_no = 88));
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 89 AND o.sacrifice_no = 127) OR (u.sacrifice_no = 127 AND o.sacrifice_no = 89));
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 91 AND o.sacrifice_no = 122) OR (u.sacrifice_no = 122 AND o.sacrifice_no = 91));
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 92 AND o.sacrifice_no = 116) OR (u.sacrifice_no = 116 AND o.sacrifice_no = 92));
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 93 AND o.sacrifice_no = 114) OR (u.sacrifice_no = 114 AND o.sacrifice_no = 93));
UPDATE sacrifice_animals u SET sacrifice_time = o.sacrifice_time, last_edited_by = 'Kesim saati takası (7 çift, Ankara 2026)'
FROM sacrifice_animals o WHERE u.tenant_id = '00000000-0000-0000-0000-000000000002' AND u.sacrifice_year = 2026 AND o.tenant_id = u.tenant_id AND o.sacrifice_year = u.sacrifice_year AND ((u.sacrifice_no = 95 AND o.sacrifice_no = 108) OR (u.sacrifice_no = 108 AND o.sacrifice_no = 95));
COMMIT;

-- Bölüm 2: sıra numaraları (her çift: küçük→-9999, büyük→küçük, -9999→büyük)
BEGIN;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 87;
UPDATE sacrifice_animals SET sacrifice_no = 87, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 130;
UPDATE sacrifice_animals SET sacrifice_no = 130, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 88;
UPDATE sacrifice_animals SET sacrifice_no = 88, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 128;
UPDATE sacrifice_animals SET sacrifice_no = 128, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 89;
UPDATE sacrifice_animals SET sacrifice_no = 89, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 127;
UPDATE sacrifice_animals SET sacrifice_no = 127, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 91;
UPDATE sacrifice_animals SET sacrifice_no = 91, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 122;
UPDATE sacrifice_animals SET sacrifice_no = 122, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 92;
UPDATE sacrifice_animals SET sacrifice_no = 92, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 116;
UPDATE sacrifice_animals SET sacrifice_no = 116, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 93;
UPDATE sacrifice_animals SET sacrifice_no = 93, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 114;
UPDATE sacrifice_animals SET sacrifice_no = 114, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
UPDATE sacrifice_animals SET sacrifice_no = -9999, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 95;
UPDATE sacrifice_animals SET sacrifice_no = 95, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = 108;
UPDATE sacrifice_animals SET sacrifice_no = 108, last_edited_by = 'Sıra no takası (7 çift, Ankara Kurban 2026)' WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND sacrifice_year = 2026 AND sacrifice_no = -9999;
COMMIT;
