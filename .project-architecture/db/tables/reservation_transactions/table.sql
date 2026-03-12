CREATE TABLE reservation_transactions (
    transaction_id CHAR(16) PRIMARY KEY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sacrifice_id UUID REFERENCES sacrifice_animals(sacrifice_id) ON DELETE CASCADE,
    share_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes'),
    last_edited_time TIMESTAMPTZ DEFAULT now(),
    status TEXT CHECK (status IN ('active', 'completed', 'canceled', 'timed out', 'expired')) DEFAULT 'active'
);

CREATE INDEX idx_reservation_transactions_tenant ON reservation_transactions (tenant_id);
