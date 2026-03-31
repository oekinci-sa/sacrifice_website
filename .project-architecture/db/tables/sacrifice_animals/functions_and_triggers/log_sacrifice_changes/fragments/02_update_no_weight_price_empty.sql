    IF NEW.sacrifice_no IS DISTINCT FROM OLD.sacrifice_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'sacrifice_no',
        CAST(OLD.sacrifice_no AS TEXT),
        CAST(NEW.sacrifice_no AS TEXT),
        'UPDATE',
        'Kurban numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.share_weight IS DISTINCT FROM OLD.share_weight THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'share_weight',
        CAST(OLD.share_weight AS TEXT),
        CAST(NEW.share_weight AS TEXT),
        'UPDATE',
        'Hisse ağırlığı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'share_price',
        CAST(OLD.share_price AS TEXT),
        CAST(NEW.share_price AS TEXT),
        'UPDATE',
        'Hisse bedeli güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

    IF NEW.empty_share IS DISTINCT FROM OLD.empty_share THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'empty_share',
        CAST(OLD.empty_share AS TEXT),
        CAST(NEW.empty_share AS TEXT),
        'UPDATE',
        'Boş hisse güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        v_layer
      );
    END IF;

