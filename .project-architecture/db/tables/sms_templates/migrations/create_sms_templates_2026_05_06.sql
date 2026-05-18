-- SMS şablonları (Faz 1). Güncel şema: ../table.sql
-- Supabase: create_sms_templates (20260505194614 / 20260506181411)

CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'genel',
  content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant ON public.sms_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant_active ON public.sms_templates(tenant_id, is_active);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
