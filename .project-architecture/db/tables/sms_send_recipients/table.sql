CREATE TABLE IF NOT EXISTS public.sms_send_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id UUID NOT NULL REFERENCES public.sms_sends(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  -- NULL: panel kullanıcısı veya dışarıdan girilen numara
  shareholder_id UUID REFERENCES public.shareholders(shareholder_id),
  -- Kurban bazlı dedup / raporlama (toplu gönderim)
  sacrifice_id UUID REFERENCES public.sacrifice_animals(sacrifice_id),
  recipient_name TEXT,
  -- Normalize edilmiş format: 905xxxxxxxxx (12 karakter)
  phone_number VARCHAR(13) NOT NULL,
  -- Kullanıcının girdiği ham format (debug için)
  raw_phone_number TEXT,
  -- Şablon değişkenleri çözümlenmiş final metin
  personalized_message TEXT NOT NULL,
  -- Bu mesajın kaç SMS boy'u tuttuğu
  sms_parts INT,
  -- queued | sent | failed | skipped
  status TEXT NOT NULL DEFAULT 'queued',
  -- Neden atlandı: dedup | invalid_phone
  skip_reason TEXT,

  error_code TEXT,
  -- Ham Bizim SMS API cevabı (hata debug için)
  provider_response JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_recipients_send ON public.sms_send_recipients(send_id);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_shareholder ON public.sms_send_recipients(shareholder_id);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_tenant_status ON public.sms_send_recipients(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_sms_recipients_sacrifice ON public.sms_send_recipients(sacrifice_id)
  WHERE sacrifice_id IS NOT NULL;

ALTER TABLE public.sms_send_recipients ENABLE ROW LEVEL SECURITY;
