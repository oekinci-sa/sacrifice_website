    IF NEW.delivered_share_kg IS DISTINCT FROM OLD.delivered_share_kg THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'delivered_share_kg',
        COALESCE(OLD.delivered_share_kg::text, ''),
        COALESCE(NEW.delivered_share_kg::text, ''),
        'UPDATE',
        'Teslim edilen hisse kg güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.delivery_notes IS DISTINCT FROM OLD.delivery_notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'delivery_notes',
        COALESCE(OLD.delivery_notes, ''),
        COALESCE(NEW.delivery_notes, ''),
        'UPDATE',
        'Teslimat notu güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;
