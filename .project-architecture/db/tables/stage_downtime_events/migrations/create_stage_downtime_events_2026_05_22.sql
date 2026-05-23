CREATE TABLE IF NOT EXISTS public.stage_downtime_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id),
  sacrifice_year   SMALLINT NOT NULL,
  affected_stage   TEXT NOT NULL
    CHECK (affected_stage IN ('slaughter', 'butcher', 'delivery')),
  started_time     TIME NOT NULL,
  ended_time       TIME NOT NULL,
  duration_minutes INT NOT NULL,
  note             TEXT,
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_downtime_tenant_year
  ON public.stage_downtime_events (tenant_id, sacrifice_year);

ALTER TABLE public.stage_downtime_events ENABLE ROW LEVEL SECURITY;
