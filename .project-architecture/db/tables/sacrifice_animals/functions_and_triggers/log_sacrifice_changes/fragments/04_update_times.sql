    IF NEW.sacrifice_time IS DISTINCT FROM OLD.sacrifice_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'sacrifice_time',
        CAST(OLD.sacrifice_time AS TEXT),
        CAST(NEW.sacrifice_time AS TEXT),
        'Güncelleme',
        'Programdaki planlanan kesim saati değişti: ' || COALESCE(OLD.sacrifice_time::text, '—') || ' → ' || COALESCE(NEW.sacrifice_time::text, '—') || '.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.slaughter_time IS DISTINCT FROM OLD.slaughter_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'slaughter_time',
        CAST(OLD.slaughter_time AS TEXT),
        CAST(NEW.slaughter_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.slaughter_time IS NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesim aşaması tamamlandı olarak işaretlendi; gerçekleşen saat: ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || '.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NULL THEN
            'Daha önce kayıtlı kesim saati (' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ') kaldırıldı — süreç sıfırlandı sayılır.'
          WHEN OLD.slaughter_time IS NOT NULL AND NEW.slaughter_time IS NOT NULL THEN
            'Kesimin gerçekleştiği saat düzeltildi: ' || TO_CHAR(OLD.slaughter_time, 'HH24:MI') || ' → ' || TO_CHAR(NEW.slaughter_time, 'HH24:MI') || '.'
          ELSE
            'Kesim saati bilgisi güncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.butcher_time IS DISTINCT FROM OLD.butcher_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'butcher_time',
        CAST(OLD.butcher_time AS TEXT),
        CAST(NEW.butcher_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.butcher_time IS NULL AND NEW.butcher_time IS NOT NULL THEN
            'Parçalama (kıyma) aşaması tamamlandı; saat: ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || '.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NULL THEN
            'Kayıtlı parçalama saati (' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ') silindi.'
          WHEN OLD.butcher_time IS NOT NULL AND NEW.butcher_time IS NOT NULL THEN
            'Parçalama saati güncellendi: ' || TO_CHAR(OLD.butcher_time, 'HH24:MI') || ' → ' || TO_CHAR(NEW.butcher_time, 'HH24:MI') || '.'
          ELSE
            'Parçalama saati bilgisi güncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.delivery_time IS DISTINCT FROM OLD.delivery_time THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'delivery_time',
        CAST(OLD.delivery_time AS TEXT),
        CAST(NEW.delivery_time AS TEXT),
        'Güncelleme',
        CASE
          WHEN OLD.delivery_time IS NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat tamamlandı olarak işaretlendi; saat: ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || '.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NULL THEN
            'Kayıtlı teslimat saati (' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ') kaldırıldı.'
          WHEN OLD.delivery_time IS NOT NULL AND NEW.delivery_time IS NOT NULL THEN
            'Teslimat saati güncellendi: ' || TO_CHAR(OLD.delivery_time, 'HH24:MI') || ' → ' || TO_CHAR(NEW.delivery_time, 'HH24:MI') || '.'
          ELSE
            'Teslimat saati bilgisi güncellendi.'
        END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    RETURN NEW;

