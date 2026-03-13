CREATE TABLE reminder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  phone VARCHAR(13) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_reminder_requests_tenant ON reminder_requests (tenant_id);
CREATE INDEX idx_reminder_requests_phone ON reminder_requests (tenant_id, phone);
