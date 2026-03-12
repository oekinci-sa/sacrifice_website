-- Kullanıcı-tenant ilişkisi: Bir kullanıcı birden fazla tenant'a erişebilir
-- approved_at: Bu tenant için onay tarihi. NULL = onay bekliyor (diğer admin önüne düşer)
CREATE TABLE user_tenants (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  approved_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX idx_user_tenants_user ON user_tenants (user_id);
CREATE INDEX idx_user_tenants_tenant ON user_tenants (tenant_id);
