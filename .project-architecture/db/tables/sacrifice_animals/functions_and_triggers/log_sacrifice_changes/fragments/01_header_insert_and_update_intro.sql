-- sacrifice_animals → change_logs (okunabilir Türkçe özetler)
-- change_owner: önce app.actor (RPC), yoksa last_edited_by

CREATE OR REPLACE FUNCTION public.log_sacrifice_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner text;
  v_corr text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'sacrifice_animals',
      CAST(NEW.sacrifice_no AS TEXT),
      'Ekleme',
      'Listeye yeni kurbanlık eklendi. Sıra no: ' || NEW.sacrifice_no || ', planlanan kesim saati: ' || COALESCE(NEW.sacrifice_time::text, '—') || ', hisse bedeli: ' ||
        CASE
          WHEN NEW.pricing_mode = 'live_scale' THEN
            'Canlı baskül' || CASE WHEN NEW.live_scale_total_price IS NOT NULL THEN ' (toplam ' || NEW.live_scale_total_price::text || ' ₺)' ELSE '' END
          ELSE COALESCE(NEW.share_price::text, '—') || ' ₺'
        END || ', boş hisse: ' || COALESCE(NEW.empty_share::text, '—') || ', cins: ' || COALESCE(NEW.animal_type, '—') || '.',
      v_owner,
      NEW.tenant_id,
      NEW.sacrifice_year
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    v_corr := NULLIF(trim(COALESCE(current_setting('app.correlation_id', true), '')), '');

