CREATE TABLE IF NOT EXISTS failed_reservation_transactions_logs (
  log_id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  transaction_id CHAR(16),
  sacrifice_id TEXT,
  attempted_share_change INT,
  current_empty_share INT,
  new_status TEXT,
  log_time TIMESTAMPTZ DEFAULT now(),
  reason TEXT
);
