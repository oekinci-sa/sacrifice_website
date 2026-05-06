CREATE TABLE IF NOT EXISTS public.sms_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  -- Normalize edilmiş format: 905xxxxxxxxx
  phone_number VARCHAR(13) NOT NULL,
  -- Hissedar bazlı kara liste için (nullable)
  shareholder_id UUID REFERENCES public.shareholders(shareholder_id),
  reason TEXT,
  -- Soft delete: FALSE = pasif (kara listeden çıkarıldı)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_sms_blocklist_tenant_phone UNIQUE (tenant_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_sms_blocklist_tenant ON public.sms_blocklist(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_blocklist_tenant_active ON public.sms_blocklist(tenant_id, is_active);

ALTER TABLE public.sms_blocklist ENABLE ROW LEVEL SECURITY;
