CREATE TABLE IF NOT EXISTS queue_page_access_attempts (
  tenant_id       UUID NOT NULL,
  page_key        TEXT NOT NULL,
  ip_hash         TEXT NOT NULL,
  failed_count    INT NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tenant_id, page_key, ip_hash)
);
