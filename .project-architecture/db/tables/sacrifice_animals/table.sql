-- Tablo oluştur (tenants önce oluşturulmuş olmalı)
CREATE TABLE "public"."sacrifice_animals" (
  "sacrifice_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "sacrifice_year" INT2 NOT NULL,
  "sacrifice_no" INT2 NOT NULL,
  "sacrifice_time" TIME(6) NOT NULL,
  "share_weight" INT2 NOT NULL,
  "share_price" NUMERIC(12,2) NOT NULL,
  "empty_share" INT2 NOT NULL DEFAULT 7 CHECK (empty_share BETWEEN 0 AND 7),
  "animal_type" TEXT,
  "slaughter_time" TIMESTAMPTZ,
  "butcher_time" TIMESTAMPTZ,
  "delivery_time" TIMESTAMPTZ,
  "last_edited_by" TEXT DEFAULT 'Anonim Kullanıcı',
  "last_edited_time" TIMESTAMPTZ DEFAULT now(),
  "notes" TEXT,
  -- Aşağıdakiler migration ile eklendi (bkz. sacrifice_foundation_planned_delivery_ear_tag_2026_03_24.sql)
  "foundation" TEXT,
  "planned_delivery_time" TIME GENERATED ALWAYS AS (((sacrifice_time + interval '90 minutes')::time)) STORED,
  "ear_tag_display" TEXT GENERATED ALWAYS AS ((sacrifice_year::text || '-' || lpad(sacrifice_no::text, 4, '0'))) STORED
);

ALTER TABLE sacrifice_animals ADD CONSTRAINT sacrifice_animals_foundation_check
  CHECK (foundation IS NULL OR foundation IN ('AKV', 'İMH', 'AGD'));

-- Tenant + yıl bazlı unique: aynı tenant ve yıl içinde sacrifice_no tekil
ALTER TABLE sacrifice_animals ADD CONSTRAINT uq_sacrifice_no_per_tenant_year UNIQUE (tenant_id, sacrifice_year, sacrifice_no);

-- Performans index'leri
CREATE INDEX idx_sacrifice_animals_tenant ON sacrifice_animals (tenant_id);
CREATE INDEX idx_sacrifice_animals_year_tenant ON sacrifice_animals (tenant_id, sacrifice_year);
