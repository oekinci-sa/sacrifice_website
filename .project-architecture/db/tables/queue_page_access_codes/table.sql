CREATE TABLE IF NOT EXISTS queue_page_access_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  page_key    TEXT NOT NULL CHECK (page_key IN ('slaughter','butcher','delivery')),
  code_hash   TEXT NOT NULL,
  updated_by  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, page_key)
);
