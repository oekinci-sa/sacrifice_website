-- Public sayfalar için tenant'a özgü varsayılan yıl
-- Test/kahramankazan: 2025, golbasi: 2026
ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS active_sacrifice_year SMALLINT DEFAULT 2025;

UPDATE tenant_settings SET active_sacrifice_year = 2025
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

UPDATE tenant_settings SET active_sacrifice_year = 2025
WHERE tenant_id = '00000000-0000-0000-0000-000000000002';

UPDATE tenant_settings SET active_sacrifice_year = 2026
WHERE tenant_id = '00000000-0000-0000-0000-000000000003';
