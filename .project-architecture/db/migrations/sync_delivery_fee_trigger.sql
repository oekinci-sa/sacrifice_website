-- Migration: delivery_location/delivery_type değişince delivery_fee, total_amount, remaining_payment otomatik güncelle
-- Uygulama: Supabase SQL Editor'da bu dosyayı çalıştırın
-- Mantık: lib/delivery-options.ts (getDeliveryFeeForType, getDeliveryFeeForLocation) ile senkron tutulmalı

CREATE OR REPLACE FUNCTION sync_delivery_fee_on_delivery_change()
RETURNS TRIGGER AS $$
DECLARE
  v_share_price NUMERIC(12,2);
  v_logo_slug TEXT;
  v_delivery_fee NUMERIC(12,2) := 0;
  v_loc TEXT;
  v_type TEXT;
BEGIN
  IF (TG_OP <> 'UPDATE') THEN
    RETURN NEW;
  END IF;

  IF (NEW.delivery_location IS NOT DISTINCT FROM OLD.delivery_location
      AND NEW.delivery_type IS NOT DISTINCT FROM OLD.delivery_type) THEN
    RETURN NEW;
  END IF;

  v_loc := COALESCE(NEW.delivery_location, '');
  v_type := COALESCE(NEW.delivery_type, '');

  SELECT logo_slug INTO v_logo_slug
  FROM tenant_settings
  WHERE tenant_id = NEW.tenant_id;
  v_logo_slug := COALESCE(v_logo_slug, 'ankara-kurban');

  IF (v_type = 'Kesimhane' OR v_loc IN ('Gölbaşı', 'Kahramankazan', 'Kesimhane')) THEN
    v_delivery_fee := 0;
  ELSIF (v_type = 'Ulus' OR v_loc = 'Ulus') THEN
    v_delivery_fee := 1500;
  ELSIF (v_type = 'Adrese teslim') THEN
    v_delivery_fee := CASE WHEN v_logo_slug = 'elya-hayvancilik' THEN 1500 ELSE 0 END;
  ELSIF (v_loc = '-') THEN
    v_delivery_fee := CASE WHEN v_logo_slug = 'elya-hayvancilik' THEN 1500 ELSE 0 END;
  ELSIF (v_logo_slug = 'elya-hayvancilik' AND v_loc <> '' AND v_loc <> 'Gölbaşı') THEN
    v_delivery_fee := 1500;
  ELSE
    v_delivery_fee := 0;
  END IF;

  NEW.delivery_fee := v_delivery_fee;

  SELECT share_price INTO v_share_price
  FROM sacrifice_animals
  WHERE sacrifice_id = NEW.sacrifice_id;

  NEW.total_amount := COALESCE(v_share_price, 0) + v_delivery_fee;
  NEW.remaining_payment := NEW.total_amount - COALESCE(NEW.paid_amount, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_delivery_fee ON shareholders;
CREATE TRIGGER sync_delivery_fee
BEFORE UPDATE OF delivery_location, delivery_type
ON shareholders
FOR EACH ROW
EXECUTE FUNCTION sync_delivery_fee_on_delivery_change();
