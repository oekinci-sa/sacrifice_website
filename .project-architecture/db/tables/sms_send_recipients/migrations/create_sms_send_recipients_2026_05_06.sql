-- SMS gönderim alıcıları. Güncel şema: ../table.sql
-- Supabase: create_sms_send_recipients (20260505194630 / 20260506181438)
-- sacrifice_id: sms_send_recipients_add_sacrifice_id (20260506185237)

CREATE TABLE IF NOT EXISTS public.sms_send_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id UUID NOT NULL REFERENCES public.sms_sends(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  shareholder_id UUID REFERENCES public.shareholders(shareholder_id),
  sacrifice_id UUID REFERENCES public.sacrifice_animals(sacrifice_id),
  recipient_name TEXT,
  phone_number VARCHAR(13) NOT NULL,
  raw_phone_number TEXT,
  personalized_message TEXT NOT NULL,
  sms_parts INT,
  status TEXT NOT NULL DEFAULT 'queued',
  skip_reason TEXT,
  error_code TEXT,
  provider_response JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_recipients_send ON public.sms_send_recipients(send_id);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_tenant ON public.sms_send_recipients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_shareholder ON public.sms_send_recipients(shareholder_id);

ALTER TABLE public.sms_send_recipients ENABLE ROW LEVEL SECURITY;
