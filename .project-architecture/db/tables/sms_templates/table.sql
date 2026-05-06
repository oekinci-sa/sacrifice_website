CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  -- genel, odeme, kesim, teslimat, bilgilendirme
  category TEXT NOT NULL DEFAULT 'genel',
  content TEXT NOT NULL,
  -- Kullanılan değişken adları: ["ad_soyad","kalan_tutar",...]
  variables JSONB,
  -- Silme yerine soft delete: is_active = false
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant ON public.sms_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant_active ON public.sms_templates(tenant_id, is_active);

-- Tüm yazma/okuma işlemleri supabaseAdmin (service_role) üzerinden yapılır.
-- service_role RLS'yi bypass eder; policy anon/authenticated erişimini engeller.
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
