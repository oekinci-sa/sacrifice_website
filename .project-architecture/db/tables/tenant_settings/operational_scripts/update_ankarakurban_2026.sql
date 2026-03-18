-- ankarakurban.com.tr (Kahramankazan) için aktif yılı 2026 yap
-- tenant_id: 00000000-0000-0000-0000-000000000002
UPDATE tenant_settings
SET active_sacrifice_year = 2026,
    updated_at = now()
WHERE tenant_id = '00000000-0000-0000-0000-000000000002';
