    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Notlar',
        OLD.notes,
        NEW.notes,
        'Güncelleme',
        'Bu kurbanlık için yönetici notları güncellendi.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.animal_type IS DISTINCT FROM OLD.animal_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Hayvan Cinsi',
        COALESCE(OLD.animal_type, ''),
        COALESCE(NEW.animal_type, ''),
        'Güncelleme',
        'Hayvan cinsi değiştirildi: ' || COALESCE(OLD.animal_type, '—') || ' → ' || COALESCE(NEW.animal_type, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.foundation IS DISTINCT FROM OLD.foundation THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Vakıf',
        COALESCE(OLD.foundation, ''),
        COALESCE(NEW.foundation, ''),
        'Güncelleme',
        'Vakıf bilgisi güncellendi: ' || COALESCE(OLD.foundation, '—') || ' → ' || COALESCE(NEW.foundation, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.ear_tag IS DISTINCT FROM OLD.ear_tag THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Kurbanlıklar',
        CAST(NEW.sacrifice_no AS TEXT),
        'Küpe No',
        COALESCE(OLD.ear_tag, ''),
        COALESCE(NEW.ear_tag, ''),
        'Güncelleme',
        'Küpe numarası güncellendi: ' || COALESCE(NULLIF(trim(OLD.ear_tag), ''), '—') || ' → ' || COALESCE(NULLIF(trim(NEW.ear_tag), ''), '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

