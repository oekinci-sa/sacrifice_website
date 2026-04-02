-- Tablo oluştur (tenants önce oluşturulmuş olmalı)
CREATE TABLE "public"."sacrifice_animals" (
  "sacrifice_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "sacrifice_year" INT2 NOT NULL,
  "sacrifice_no" INT2 NOT NULL,
  "sacrifice_time" TIME(6) NOT NULL,
  "share_weight" INT2,
  "share_price" NUMERIC(12,2),
  "pricing_mode" TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_mode IN ('fixed', 'live_scale')),
  "live_scale_total_kg" NUMERIC,
  "live_scale_total_price" NUMERIC(12,2),
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
  "planned_delivery_time" TIME NOT NULL,
  -- Admin panelinden girilen küpe numarası (otomatik doldurulmaz)
  "ear_tag" TEXT,
  -- Ahır / sıra numarası (serbest metin)
  "barn_stall_order_no" TEXT
);

-- foundation: admin "Referans" sütunu — serbest metin (AKV/İMH/AGD veya kişi/kurum adı vb.)

ALTER TABLE sacrifice_animals ADD CONSTRAINT sacrifice_animals_pricing_consistency CHECK (
  (pricing_mode = 'fixed' AND share_price IS NOT NULL AND share_weight IS NOT NULL)
  OR (pricing_mode = 'live_scale' AND share_price IS NULL AND share_weight IS NULL)
);

-- Tenant + yıl bazlı unique: aynı tenant ve yıl içinde sacrifice_no tekil
ALTER TABLE sacrifice_animals ADD CONSTRAINT uq_sacrifice_no_per_tenant_year UNIQUE (tenant_id, sacrifice_year, sacrifice_no);

-- Performans index'leri
CREATE INDEX idx_sacrifice_animals_tenant ON sacrifice_animals (tenant_id);
CREATE INDEX idx_sacrifice_animals_year_tenant ON sacrifice_animals (tenant_id, sacrifice_year);
