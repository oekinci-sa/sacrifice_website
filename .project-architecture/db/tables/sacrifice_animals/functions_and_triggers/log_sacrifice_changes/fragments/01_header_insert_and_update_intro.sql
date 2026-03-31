-- sacrifice_animals → change_logs (kısa description; değerler kolonlarda)
-- change_owner: önce app.actor (RPC), yoksa last_edited_by

CREATE OR REPLACE FUNCTION public.log_sacrifice_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_corr text;
  v_layer text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
    v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year, correlation_id, log_layer)
    VALUES (
      'sacrifice_animals',
      NEW.sacrifice_id::text,
      'INSERT',
      'Kurbanlık eklendi',
      v_owner,
      NEW.tenant_id,
      NEW.sacrifice_year,
      CASE WHEN v_corr IS NOT NULL AND v_corr <> '' THEN v_corr::uuid ELSE NULL END,
      v_layer
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');
    v_layer := NULLIF(trim(COALESCE(current_setting('app.log_layer', true), '')), '');
    v_layer := CASE WHEN v_layer IN ('primary', 'detail') THEN v_layer ELSE NULL END;

