-- Gölbaşı sacrifice_animals verilerini anasayfa priceInfo ile uyumlu hale getirir.
-- Sadece Gölbaşı tenant (00000000-0000-0000-0000-000000000003) için çalışır.
-- Mevcut veritabanındaki Gölbaşı satırlarını günceller.

-- sacrifice_animals güncelleme (mevcut 4 satır)
UPDATE sacrifice_animals
SET share_weight = v.share_weight, share_price = v.share_price
FROM (VALUES
  ('a3000000-0000-0000-0000-000000000001'::uuid, 23, 20000),
  ('a3000000-0000-0000-0000-000000000002'::uuid, 26, 22000),
  ('a3000000-0000-0000-0000-000000000003'::uuid, 30, 24000),
  ('a3000000-0000-0000-0000-000000000004'::uuid, 34, 26000)
) AS v(sacrifice_id, share_weight, share_price)
WHERE sacrifice_animals.sacrifice_id = v.sacrifice_id
  AND sacrifice_animals.tenant_id = '00000000-0000-0000-0000-000000000003';

-- Yeni kg/fiyat kombinasyonları için ek satırlar (38, 42, 46, 50 kg)
INSERT INTO sacrifice_animals (
  sacrifice_id, sacrifice_no, sacrifice_time, share_weight, share_price, empty_share,
  tenant_id, last_edited_by
) VALUES
  ('a3000000-0000-0000-0000-000000000005', 5, '08:24', 38, 28000, 4, '00000000-0000-0000-0000-000000000003', 'Seed Script'),
  ('a3000000-0000-0000-0000-000000000006', 6, '08:30', 42, 30000, 3, '00000000-0000-0000-0000-000000000003', 'Seed Script'),
  ('a3000000-0000-0000-0000-000000000007', 7, '08:36', 46, 32000, 2, '00000000-0000-0000-0000-000000000003', 'Seed Script'),
  ('a3000000-0000-0000-0000-000000000008', 8, '08:42', 50, 34000, 2, '00000000-0000-0000-0000-000000000003', 'Seed Script')
ON CONFLICT (sacrifice_id) DO UPDATE SET
  share_weight = EXCLUDED.share_weight,
  share_price = EXCLUDED.share_price;
