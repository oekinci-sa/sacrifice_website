-- Kurban günü operasyonel arıza / kesinti kayıtları (tenant + yıl kapsamlı).
-- Ortalama ilerleme süresi (stage_metrics.avg_progress_duration) hesabında
-- update_slaughter/butcher/delivery_stage_metrics tetikleyicileri bu tabloyu okur.
CREATE TABLE IF NOT EXISTS public.stage_downtime_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id),
  sacrifice_year   SMALLINT NOT NULL,
  affected_stage   TEXT NOT NULL
    CHECK (affected_stage IN ('slaughter', 'butcher', 'delivery')),
  started_time     TIME NOT NULL,   -- Türkiye saati (HH:MM)
  ended_time       TIME NOT NULL,
  duration_minutes INT NOT NULL,    -- client hesaplar: max(0, bitiş − başlangıç dk)
  note             TEXT,
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_downtime_tenant_year
  ON public.stage_downtime_events (tenant_id, sacrifice_year);

ALTER TABLE public.stage_downtime_events ENABLE ROW LEVEL SECURITY;

-- change_logs ile izlenmez (operasyonel gün içi düzeltme kaydı).
