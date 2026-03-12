-- Kurban günü için sıralamayı sıfırlama

-- 1. Table 1: sacrifice_animals'daki zaman alanlarını NULL yap
UPDATE sacrifice_animals
SET
  slaughter_time = NULL,
  butcher_time = NULL,
  delivery_time = NULL;

-- 2. Table 6: stage_metrics tablosundaki tüm aşamaları sıfırla
UPDATE stage_metrics
SET
  avg_progress_duration = 0,
  current_sacrifice_number = 1
WHERE stage IN ('slaughter_stage', 'butcher_stage', 'delivery_stage');
