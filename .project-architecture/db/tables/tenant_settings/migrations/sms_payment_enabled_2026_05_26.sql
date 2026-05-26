ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS sms_payment_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.tenant_settings.sms_payment_enabled IS
  'Ödeme tutarı güncellendiğinde SMS gönderimi aktif mi? sms_enabled kapalıysa etkisiz.';
