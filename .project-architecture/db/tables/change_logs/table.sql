CREATE TABLE change_logs (
    event_id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    column_name TEXT,
    old_value TEXT,
    new_value TEXT,
    change_type TEXT NOT NULL,
    description TEXT NOT NULL,
    change_owner TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_change_logs_tenant ON change_logs (tenant_id);
