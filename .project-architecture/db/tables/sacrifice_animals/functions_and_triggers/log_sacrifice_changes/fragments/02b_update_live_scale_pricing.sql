    IF NEW.pricing_mode IS DISTINCT FROM OLD.pricing_mode THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'pricing_mode',
        COALESCE(OLD.pricing_mode::text, '—'),
        COALESCE(NEW.pricing_mode::text, '—'),
        'Güncelleme',
        'Fiyatlama modu güncellendi: ' || COALESCE(OLD.pricing_mode::text, '—') || ' → ' || COALESCE(NEW.pricing_mode::text, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.live_scale_total_kg IS DISTINCT FROM OLD.live_scale_total_kg THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'live_scale_total_kg',
        COALESCE(OLD.live_scale_total_kg::text, '—'),
        COALESCE(NEW.live_scale_total_kg::text, '—'),
        'Güncelleme',
        'Canlı baskül toplam ağırlık (kg): ' || COALESCE(OLD.live_scale_total_kg::text, '—') || ' → ' || COALESCE(NEW.live_scale_total_kg::text, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.live_scale_total_price IS DISTINCT FROM OLD.live_scale_total_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'live_scale_total_price',
        COALESCE(OLD.live_scale_total_price::text, '—'),
        COALESCE(NEW.live_scale_total_price::text, '—'),
        'Güncelleme',
        'Canlı baskül toplam tutar: ' || COALESCE(OLD.live_scale_total_price::text, '—') || ' ₺ → ' || COALESCE(NEW.live_scale_total_price::text, '—') || ' ₺.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;
