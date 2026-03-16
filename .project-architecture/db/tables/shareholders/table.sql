-- Tabloyu oluştur (reservation_transactions, sacrifice_animals, tenants önce oluşturulmuş olmalı)
CREATE TABLE "public"."shareholders" (
  "shareholder_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "shareholder_name" TEXT NOT NULL,
  "phone_number" VARCHAR(13),
  "purchase_time" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "purchased_by" TEXT,
  "transaction_id" CHAR(16) REFERENCES reservation_transactions(transaction_id),
  "security_code" VARCHAR(6) CHECK (security_code::text ~ '^\d{6}$'),
  "sacrifice_id" UUID NOT NULL REFERENCES sacrifice_animals(sacrifice_id) ON DELETE CASCADE ON UPDATE CASCADE,
  "delivery_fee" NUMERIC(12,2) DEFAULT 0,
  "total_amount" NUMERIC(12,2) NOT NULL,
  "paid_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
  "remaining_payment" NUMERIC(12,2) NOT NULL,
  "delivery_location" TEXT DEFAULT 'Kesimhane',
  "email" VARCHAR(255),
  "sacrifice_consent" BOOL DEFAULT FALSE,
  "last_edited_by" TEXT DEFAULT 'Anonim Kullanıcı',
  "last_edited_time" TIMESTAMPTZ DEFAULT now(),
  "notes" TEXT,
  "sacrifice_year" INT2 NOT NULL,
  "contacted_at" TIMESTAMPTZ
);

CREATE INDEX idx_shareholders_tenant ON shareholders (tenant_id);
CREATE INDEX idx_shareholders_tenant_sacrifice ON shareholders (tenant_id, sacrifice_id);
CREATE INDEX idx_shareholders_tenant_year ON shareholders (tenant_id, sacrifice_year);
