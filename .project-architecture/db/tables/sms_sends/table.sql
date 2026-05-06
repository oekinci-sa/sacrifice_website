CREATE TABLE IF NOT EXISTS public.sms_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  -- NULL: şablonsuz/elle yazılmış gönderim
  template_id UUID REFERENCES public.sms_templates(id),
  title TEXT NOT NULL,
  message_content TEXT NOT NULL,
  -- single | sacrifice_all | after_sacrifice_no | filtered | custom
  target_type TEXT NOT NULL DEFAULT 'custom',
  -- {sacrifice_id, sacrifice_no, filters...}
  target_params JSONB,
  -- draft | queued | sending | completed | partial_fail | failed | cancelled
  status TEXT NOT NULL DEFAULT 'draft',

  -- Sayı alanları (anlam notu):
  -- total_recipients : ilk hedeflenen kişi sayısı
  -- excluded_count   : geçersiz numara + blocklist + duplicate nedeniyle çıkarılanlar
  -- sent_count       : Bizim SMS API'ye başarıyla iletilen (operatöre gönderildi)
  -- failed_count     : API çağrısı başarısız olan alıcılar
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  excluded_count INT NOT NULL DEFAULT 0,

  -- Tahmini/gerçekleşen toplam SMS boy sayısı (tüm alıcıların toplamı)
  estimated_total_sms_parts INT,
  actual_total_sms_parts INT,

  deduplicate_phone_numbers BOOLEAN NOT NULL DEFAULT TRUE,
  sacrifice_year SMALLINT,
  -- Çift gönderimi engellemek için: frontend her denemede UUID üretir
  idempotency_key TEXT,
  -- İleride çoklu sağlayıcı için
  provider TEXT NOT NULL DEFAULT 'bizimsms',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Faz 3: zamanlanmış gönderim için
  scheduled_at TIMESTAMPTZ,
  -- Faz 2: büyük gönderimlerde ikinci onay için
  approved_by TEXT,

  CONSTRAINT uq_sms_sends_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_sms_sends_tenant ON public.sms_sends(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_sends_tenant_status ON public.sms_sends(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_sends_tenant_year ON public.sms_sends(tenant_id, sacrifice_year);

ALTER TABLE public.sms_sends ENABLE ROW LEVEL SECURITY;
