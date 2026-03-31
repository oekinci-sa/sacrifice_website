    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'notes',
        OLD.notes,
        NEW.notes,
        'UPDATE',
        'Notlar güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.animal_type IS DISTINCT FROM OLD.animal_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'animal_type',
        COALESCE(OLD.animal_type, ''),
        COALESCE(NEW.animal_type, ''),
        'UPDATE',
        'Hayvan cinsi güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.foundation IS DISTINCT FROM OLD.foundation THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'foundation',
        COALESCE(OLD.foundation, ''),
        COALESCE(NEW.foundation, ''),
        'UPDATE',
        'Vakıf bilgisi güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.ear_tag IS DISTINCT FROM OLD.ear_tag THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'ear_tag',
        COALESCE(OLD.ear_tag, ''),
        COALESCE(NEW.ear_tag, ''),
        'UPDATE',
        'Küpe numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.barn_stall_order_no IS DISTINCT FROM OLD.barn_stall_order_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        NEW.sacrifice_id::text,
        'barn_stall_order_no',
        COALESCE(OLD.barn_stall_order_no, ''),
        COALESCE(NEW.barn_stall_order_no, ''),
        'UPDATE',
        'Ahır sıra numarası güncellendi',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

