-- Canlı baskülde share_weight NULL olmalı; sabit modda share_weight + share_price zorunlu.
-- Önce veriyi düzelt, CHECK'i güncelle; ardından rpc_update_sacrifice_core güncel dosyadan uygulanmalı.

ALTER TABLE public.sacrifice_animals
  ALTER COLUMN share_weight DROP NOT NULL;

UPDATE public.sacrifice_animals
SET share_weight = NULL
WHERE pricing_mode = 'live_scale';

ALTER TABLE public.sacrifice_animals
  DROP CONSTRAINT IF EXISTS sacrifice_animals_pricing_consistency;

ALTER TABLE public.sacrifice_animals
  ADD CONSTRAINT sacrifice_animals_pricing_consistency CHECK (
    (pricing_mode = 'fixed' AND share_price IS NOT NULL AND share_weight IS NOT NULL)
    OR (pricing_mode = 'live_scale' AND share_price IS NULL AND share_weight IS NULL)
  );

-- rpc_update_sacrifice_core: share_weight canlıda NULL — tek kaynak:
-- .project-architecture/db/tables/sacrifice_animals/functions_and_triggers/rpc_update_sacrifice_core.sql
