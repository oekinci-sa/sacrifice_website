-- Otomatik SMS gönderimlerinin idempotency kaydı.
-- Aynı event'in aynı hissedar için iki kez gönderilmesini engeller.
CREATE TABLE IF NOT EXISTS public.sms_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  sacrifice_year INT2 NOT NULL,
  sacrifice_id UUID NOT NULL REFERENCES public.sacrifice_animals(sacrifice_id),
  shareholder_id UUID NOT NULL REFERENCES public.shareholders(shareholder_id) ON DELETE CASCADE,
  -- slaughter_approaching | slaughter_completed | butcher_started |
  -- delivery_pickup_approaching | external_delivery_notice
  event_key TEXT NOT NULL,
  -- İlgili sms_sends kaydına referans (NULL = gönderim atlandı veya kayıt silindi)
  send_id UUID REFERENCES public.sms_sends(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sacrifice_year, shareholder_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_sms_notif_events_tenant_year
  ON public.sms_notification_events (tenant_id, sacrifice_year);

CREATE INDEX IF NOT EXISTS idx_sms_notif_events_sacrifice
  ON public.sms_notification_events (sacrifice_id);

-- Tüm yazma/okuma işlemleri supabaseAdmin (service_role) üzerinden yapılır.
ALTER TABLE public.sms_notification_events ENABLE ROW LEVEL SECURITY;
