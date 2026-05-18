-- SMS modülü görünürlüğü (sidebar, Tüm Hissedarlar SMS sütunu).
-- Supabase: add_sms_enabled_to_tenant_settings (20260513174351)

ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT FALSE;
