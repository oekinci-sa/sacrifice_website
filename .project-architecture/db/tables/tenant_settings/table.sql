CREATE TABLE tenant_settings (
  tenant_id   UUID PRIMARY KEY REFERENCES tenants(id),
  theme_json  JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
