-- Otomatik SMS şablon eşlemesi (NULL = yalnızca manuel).
-- Supabase: sms_templates_add_event_key (20260518192954)

ALTER TABLE public.sms_templates
  ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sms_templates_tenant_event_key
  ON public.sms_templates (tenant_id, event_key)
  WHERE event_key IS NOT NULL AND is_active = TRUE;
