ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS incident_banner_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS incident_banner_message  TEXT;
