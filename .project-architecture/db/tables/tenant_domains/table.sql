CREATE TABLE tenant_domains (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  domain     TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false
);
