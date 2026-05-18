-- Kurban günü otomatik SMS (sms_enabled'dan bağımsız bayrak + offset'ler).
-- Supabase: tenant_settings_add_sms_auto_columns (20260518193320)

ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS sms_auto_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_slaughter_approach_offset SMALLINT NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS sms_delivery_pickup_offset SMALLINT NOT NULL DEFAULT 2;
