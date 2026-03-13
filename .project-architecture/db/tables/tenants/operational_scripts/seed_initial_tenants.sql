-- Başlangıç tenant'ları ve domain'leri
-- 01=test, 02=kahramankazan, 03=golbasi
INSERT INTO tenants (id, slug, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test',            'Test Derneği'),
  ('00000000-0000-0000-0000-000000000002', 'kahramankazan',   'Kahramankazan Derneği'),
  ('00000000-0000-0000-0000-000000000003', 'golbasi',         'Gölbaşı Derneği')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_domains (tenant_id, domain, is_primary) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test.localhost',          true),
  ('00000000-0000-0000-0000-000000000002', 'kahramankazan.localhost', true),
  ('00000000-0000-0000-0000-000000000003', 'golbasi.localhost',       true)
ON CONFLICT (domain) DO NOTHING;
