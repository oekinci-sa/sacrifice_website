-- Tablo oluştur (tenants önce oluşturulmuş olmalı)
CREATE TABLE "public"."sacrifice_animals" (
  "sacrifice_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "sacrifice_no" INT2 NOT NULL,
  "sacrifice_time" TIME(6) NOT NULL,
  "share_weight" INT2 NOT NULL,
  "share_price" NUMERIC(12,2) NOT NULL,
  "empty_share" INT2 NOT NULL DEFAULT 7 CHECK (empty_share BETWEEN 0 AND 7),
  "slaughter_time" TIMESTAMPTZ,
  "butcher_time" TIMESTAMPTZ,
  "delivery_time" TIMESTAMPTZ,
  "last_edited_by" TEXT DEFAULT 'Anonim Kullanıcı',
  "last_edited_time" TIMESTAMPTZ DEFAULT now(),
  "notes" TEXT
);

-- Tenant bazlı unique: aynı tenant içinde sacrifice_no tekil
ALTER TABLE sacrifice_animals ADD CONSTRAINT uq_sacrifice_no_per_tenant UNIQUE (tenant_id, sacrifice_no);

-- Performans index'i
CREATE INDEX idx_sacrifice_animals_tenant ON sacrifice_animals (tenant_id);
