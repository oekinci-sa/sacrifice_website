    IF NEW.sacrifice_no IS DISTINCT FROM OLD.sacrifice_no THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'sacrifice_no',
        CAST(OLD.sacrifice_no AS TEXT),
        CAST(NEW.sacrifice_no AS TEXT),
        'Güncelleme',
        'Kurbanlığın sıra numarası değiştirildi: ' || OLD.sacrifice_no || ' → ' || NEW.sacrifice_no || '. (Tüm ekranlarda görünen numara budur.)',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_weight IS DISTINCT FROM OLD.share_weight THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'share_weight',
        CAST(OLD.share_weight AS TEXT),
        CAST(NEW.share_weight AS TEXT),
        'Güncelleme',
        'Standart hisse ağırlığı (kg) güncellendi: ' || COALESCE(OLD.share_weight::text, '—') || ' kg → ' || COALESCE(NEW.share_weight::text, '—') || ' kg.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.share_price IS DISTINCT FROM OLD.share_price THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'share_price',
        CAST(OLD.share_price AS TEXT),
        CAST(NEW.share_price AS TEXT),
        'Güncelleme',
        'Tek hissenin satış bedeli değişti: ' || COALESCE(OLD.share_price::text, '—') || ' ₺ → ' || COALESCE(NEW.share_price::text, '—') || ' ₺.',
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year
      );
    END IF;

    IF NEW.empty_share IS DISTINCT FROM OLD.empty_share THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
      VALUES (
        'sacrifice_animals',
        CAST(NEW.sacrifice_no AS TEXT),
        'empty_share',
        CAST(OLD.empty_share AS TEXT),
        CAST(NEW.empty_share AS TEXT),
        'Güncelleme',
        'Satılmayı bekleyen boş hisse sayısı: ' || COALESCE(OLD.empty_share::text, '—') || ' → ' || COALESCE(NEW.empty_share::text, '—') || ' (her kurbanlıkta en fazla 7 hisse).'
          || CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN ' Bu güncelleme aynı işlemdeki hissedar silme/taşıma ile ilişkilidir (detay satırı).' ELSE '' END,
        v_owner,
        NEW.tenant_id,
        NEW.sacrifice_year,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
        CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN 'detail'::text ELSE NULL END
      );
    END IF;

