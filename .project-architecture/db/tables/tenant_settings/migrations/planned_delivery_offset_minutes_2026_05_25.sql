-- Planlı teslim saati: kesim saatinden kaç dakika sonra?
-- Organizasyon Ayarları'ndan değiştirilince aktif yılın tüm kurbanlıkları bulk_update_planned_delivery_time ile yeniden hesaplanır.
-- CHECK kısıtı yok (admin serbest değer girebilir).

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS planned_delivery_offset_minutes SMALLINT NOT NULL DEFAULT 90;
