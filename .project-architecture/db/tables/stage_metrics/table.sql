-- Aşama metrikleri: tenant + stage başına tek satır (sacrifice_year kolonu YOK).
-- stage: slaughter_stage | butcher_stage | delivery_stage
-- avg_progress_duration: sacrifice_animals tetikleyicileri ilgili yılın kayıtlarından hesaplar (bkz. update_stage_metrics.sql).
CREATE TABLE "public"."stage_metrics" (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  stage TEXT NOT NULL,
  avg_progress_duration INT2,
  current_sacrifice_number INT2,
  last_edited_by TEXT,
  PRIMARY KEY (tenant_id, stage)
);
