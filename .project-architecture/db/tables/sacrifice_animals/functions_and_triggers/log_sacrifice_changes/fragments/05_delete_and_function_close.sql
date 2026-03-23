  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Kurbanlıklar',
      CAST(OLD.sacrifice_no AS TEXT),
      'Silme',
      'Kurbanlık kaydı tamamen silindi (sıra no ' || OLD.sacrifice_no || '). Bağlı hissedar ve rezervasyon satırları da temizlendi.',
      v_owner,
      OLD.tenant_id,
      OLD.sacrifice_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

