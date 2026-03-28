-- IBAN hesap sahibi adı soyadı (tenant başına; doluysa UI/PDF/e-postada)
ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS iban_account_holder TEXT;
