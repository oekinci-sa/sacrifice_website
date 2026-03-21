-- Farkındalık kayıtları: Admin "Tamam biliyorum" dediğinde kaydedilir.
-- Yeni hissedar eklendiğinde (shareholders AFTER INSERT trigger) ilgili sacrifice için silinir.

CREATE TABLE "public"."mismatched_share_acknowledgments" (
  "sacrifice_id" UUID PRIMARY KEY REFERENCES sacrifice_animals(sacrifice_id) ON DELETE CASCADE,
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "acknowledged_by" TEXT NOT NULL,
  "acknowledged_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "last_edited_by" TEXT
);

CREATE INDEX idx_mismatched_ack_tenant ON mismatched_share_acknowledgments (tenant_id);
