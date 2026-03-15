-- İletişim formu mesajları
CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "name" TEXT NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "email" VARCHAR(255),
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_tenant ON contact_messages (tenant_id);
