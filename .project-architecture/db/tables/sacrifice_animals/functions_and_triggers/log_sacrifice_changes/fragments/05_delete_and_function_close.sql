  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
    v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'sacrifice_animals',
      OLD.sacrifice_id::text,
      'DELETE',
      'Kurbanlık silindi',
      v_owner,
      OLD.tenant_id,
      OLD.sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      v_layer
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

