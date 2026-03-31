  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'sacrifice_animals',
      OLD.sacrifice_id::text,
      'Silme',
      'Kurbanlık silindi',
      v_owner,
      OLD.tenant_id,
      OLD.sacrifice_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

