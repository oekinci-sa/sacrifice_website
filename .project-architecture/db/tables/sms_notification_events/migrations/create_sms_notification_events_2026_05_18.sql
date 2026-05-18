-- Otomatik SMS idempotency (hissedar + event_key başına bir kayıt).
-- Supabase: create_sms_notification_events (20260518193255)
-- Güncel şema: ../table.sql

CREATE TABLE IF NOT EXISTS public.sms_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  sacrifice_year INT2 NOT NULL,
  sacrifice_id UUID NOT NULL REFERENCES public.sacrifice_animals(sacrifice_id),
  shareholder_id UUID NOT NULL REFERENCES public.shareholders(shareholder_id),
  event_key TEXT NOT NULL,
  send_id UUID REFERENCES public.sms_sends(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sacrifice_year, shareholder_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_sms_notif_events_tenant_year
  ON public.sms_notification_events (tenant_id, sacrifice_year);

CREATE INDEX IF NOT EXISTS idx_sms_notif_events_sacrifice
  ON public.sms_notification_events (sacrifice_id);

ALTER TABLE public.sms_notification_events ENABLE ROW LEVEL SECURITY;
