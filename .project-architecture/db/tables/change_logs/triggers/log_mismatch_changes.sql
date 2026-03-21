-- mismatched_share_acknowledgments → change_logs
-- INSERT = yönetici uyumsuzluğu onayladı
-- DELETE = onay kaldırıldı (rpc_revoke_mismatch)
-- Actor: önce app.actor GUC, yoksa acknowledged_by / last_edited_by kolonundan alınır.
-- Tetiklenen tablo: public.mismatched_share_acknowledgments

CREATE OR REPLACE FUNCTION public.log_mismatch_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_owner   text;
  v_no      INT2;
  v_year    INT2;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT sa.sacrifice_no, sa.sacrifice_year
    INTO v_no, v_year
    FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = NEW.sacrifice_id;

    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.acknowledged_by,
      'Anonim Kullanıcı'
    );

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hisse Uyumsuzluğu',
      COALESCE(v_no::text, NEW.sacrifice_id::text),
      'Güncelleme',
      'Bu kurbanlıkta toplam hisse sayısı 7 değil; yönetici ekranda «Tamam, uyumsuzluğu biliyorum» ile uyarıyı onayladı. Kurban sıra no: ' || COALESCE(v_no::text, '—') || '.',
      v_owner,
      NEW.tenant_id,
      v_year
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT sa.sacrifice_no, sa.sacrifice_year
    INTO v_no, v_year
    FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = OLD.sacrifice_id;

    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by,
      OLD.acknowledged_by,
      'Anonim Kullanıcı'
    );

    INSERT INTO public.change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hisse Uyumsuzluğu',
      COALESCE(v_no::text, OLD.sacrifice_id::text),
      'Güncelleme',
      'Hisse uyumsuzluğu onayı kaldırıldı; bu kurbanlık listesinde yeniden uyarı gösterebilir. Kurban sıra no: ' || COALESCE(v_no::text, '—') || '.',
      v_owner,
      OLD.tenant_id,
      v_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_mismatch_changes ON public.mismatched_share_acknowledgments;

CREATE TRIGGER trigger_mismatch_changes
  AFTER INSERT OR DELETE ON public.mismatched_share_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mismatch_changes();
