-- Per-tenant onay: Her tenant için ayrı onay gerekir
-- Kahramankazan'a giren kullanıcı da o tenant'ta onaya düşer
ALTER TABLE user_tenants ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Mevcut kayıtlar zaten onaylı kabul edilir
UPDATE user_tenants SET approved_at = now() WHERE approved_at IS NULL;
