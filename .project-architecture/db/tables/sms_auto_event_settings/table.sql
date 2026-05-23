-- Otomatik SMS gönderim kuralları — her tenant için event başına ayrı ayar.
-- global tenant_settings offset'lerinin yerini alır; daha esnek per-event kontrol sağlar.
CREATE TABLE IF NOT EXISTS public.sms_auto_event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  -- slaughter_approaching | slaughter_imminent | slaughter_completed |
  -- butcher_started | delivery_completed | delivery_pickup_approaching |
  -- external_delivery_notice
  event_key TEXT NOT NULL,
  -- Offset event'leri için hedef kurbanlık: tetiklenen sacrifice_no + target_offset
  -- NULL = aynı kurbanlığın hissedarlarına gönderilir (same_sacrifice event'leri)
  target_offset SMALLINT,
  -- all | slaughterhouse_only | external_only
  recipient_scope TEXT NOT NULL DEFAULT 'all',
  -- Hedef kurbanlık DB'de yoksa SMS gönderme
  skip_if_target_missing BOOLEAN NOT NULL DEFAULT TRUE,
  -- Hedef kurbanlık o aşamada zaten tamamlandıysa SMS gönderme
  skip_if_target_completed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_sms_auto_event_settings_tenant
  ON public.sms_auto_event_settings (tenant_id);

-- Tüm yazma/okuma işlemleri supabaseAdmin (service_role) üzerinden yapılır.
ALTER TABLE public.sms_auto_event_settings ENABLE ROW LEVEL SECURITY;

-- Varsayılan seed (her tenant için):
-- INSERT INTO public.sms_auto_event_settings (tenant_id, event_key, target_offset, recipient_scope)
-- SELECT t.id, v.event_key, v.target_offset, v.recipient_scope
-- FROM public.tenants t
-- CROSS JOIN (VALUES
--   ('slaughter_approaching',      20, 'slaughterhouse_only'),
--   ('slaughter_imminent',         3, 'slaughterhouse_only'),
--   ('slaughter_completed',        NULL, 'all'),
--   ('butcher_started',            NULL, 'slaughterhouse_only'),
--   ('delivery_completed',         NULL, 'all'),
--   ('delivery_pickup_approaching', 2, 'slaughterhouse_only'),
--   ('external_delivery_notice',   NULL, 'external_only')
-- ) AS v(event_key, target_offset, recipient_scope)
-- ON CONFLICT (tenant_id, event_key) DO NOTHING;
