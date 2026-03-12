CREATE TABLE "public"."stage_metrics" (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  stage TEXT NOT NULL,
  avg_progress_duration INT2,
  current_sacrifice_number INT2,
  PRIMARY KEY (tenant_id, stage)
);
