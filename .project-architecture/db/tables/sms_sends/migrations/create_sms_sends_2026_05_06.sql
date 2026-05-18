-- SMS gönderim grupları. Güncel şema: ../table.sql
-- Supabase: create_sms_sends (20260505194623 / 20260506181424)

CREATE TABLE IF NOT EXISTS public.sms_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  template_id UUID REFERENCES public.sms_templates(id),
  title TEXT NOT NULL,
  message_content TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'custom',
  target_params JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  excluded_count INT NOT NULL DEFAULT 0,
  estimated_total_sms_parts INT,
  actual_total_sms_parts INT,
  deduplicate_phone_numbers BOOLEAN NOT NULL DEFAULT TRUE,
  sacrifice_year SMALLINT,
  idempotency_key TEXT,
  provider TEXT NOT NULL DEFAULT 'bizimsms',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  approved_by TEXT,
  CONSTRAINT uq_sms_sends_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_sms_sends_tenant ON public.sms_sends(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_sends_tenant_status ON public.sms_sends(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_sends_tenant_year ON public.sms_sends(tenant_id, sacrifice_year);

ALTER TABLE public.sms_sends ENABLE ROW LEVEL SECURITY;
