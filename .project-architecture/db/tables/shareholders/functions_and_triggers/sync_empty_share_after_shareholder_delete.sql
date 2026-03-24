-- Hissedar satırı silindiğinde ilgili kurbanlıkta boş hisse sayısını +1 (en fazla 7).
-- rpc_delete_shareholder içinde app.correlation_id ayarlıyken sacrifice log_satırı "detail" olarak gruplanır.

CREATE OR REPLACE FUNCTION public.sync_empty_share_after_shareholder_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
BEGIN
  IF COALESCE(current_setting('app.skip_empty_share_sync', true), 'false') = 'true' THEN
    RETURN OLD;
  END IF;
  UPDATE public.sacrifice_animals
  SET empty_share = LEAST(7, empty_share + 1)
  WHERE sacrifice_id = OLD.sacrifice_id;
  RETURN OLD;
END;
$f$;

DROP TRIGGER IF EXISTS trg_sync_empty_share_after_shareholder_delete ON public.shareholders;
CREATE TRIGGER trg_sync_empty_share_after_shareholder_delete
  AFTER DELETE ON public.shareholders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_empty_share_after_shareholder_delete();
