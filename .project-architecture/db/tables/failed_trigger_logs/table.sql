-- Trigger hatalarını loglar. db-trigger-failure-logging.mdc kuralına bak.
CREATE TABLE IF NOT EXISTS failed_trigger_logs (
  log_id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  trigger_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT,  -- INSERT, UPDATE, DELETE
  row_id TEXT,
  error_message TEXT,
  log_time TIMESTAMPTZ DEFAULT now()
);
