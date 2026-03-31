    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'sacrifice_time',
        CAST(OLD.sacrifice_time AS TEXT),
        CAST(NEW.sacrifice_time AS TEXT),
        'Güncelleme',
        'Kesim planı güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.planned_delivery_time IS DISTINCT FROM OLD.planned_delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'planned_delivery_time',
        CAST(OLD.planned_delivery_time AS TEXT),
        CAST(NEW.planned_delivery_time AS TEXT),
        'Güncelleme',
        'Planlı teslim saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'slaughter_time',
        CAST(OLD.slaughter_time AS TEXT),
        CAST(NEW.slaughter_time AS TEXT),
        'Güncelleme',
        'Kesim saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'butcher_time',
        CAST(OLD.butcher_time AS TEXT),
        CAST(NEW.butcher_time AS TEXT),
        'Güncelleme',
        'Parçalama saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'delivery_time',
        CAST(OLD.delivery_time AS TEXT),
        CAST(NEW.delivery_time AS TEXT),
        'Güncelleme',
        'Teslimat saati güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    RETURN NEW;

