-- Başlangıç tenant'ları ve domain'leri
INSERT INTO tenants (id, slug, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'golbasi',         'Gölbaşı Derneği'),
  ('00000000-0000-0000-0000-000000000002', 'kahramankazan',   'Kahramankazan Derneği')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_domains (tenant_id, domain, is_primary) VALUES
  ('00000000-0000-0000-0000-000000000001', 'golbasi.localhost',       true),
  ('00000000-0000-0000-0000-000000000002', 'kahramankazan.localhost', true)
ON CONFLICT (domain) DO NOTHING;
