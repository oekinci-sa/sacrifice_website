-- Kapora süresi varsayılanı 10 gün (yeni satırlar; eski DB'de 3 kalan kayıtlar)
ALTER TABLE tenant_settings
  ALTER COLUMN deposit_deadline_days SET DEFAULT 10;

UPDATE tenant_settings
SET deposit_deadline_days = 10, updated_at = now()
WHERE deposit_deadline_days = 3;
