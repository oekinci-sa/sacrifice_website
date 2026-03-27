-- ===============================================
-- Açıklama: Rezervasyon aktif durumdan terminal duruma (completed, canceled,
--           timed_out, expired, offline) geçerken completed_at damgası basar.
--           completed_at zaten doluysa üzerine yazmaz.
-- Trigger  : trg_set_reservation_completed_at (BEFORE UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION public.set_reservation_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $f$
BEGIN
  IF OLD.status = 'active'
     AND NEW.status IN ('completed', 'canceled', 'timed_out', 'expired', 'offline')
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS trg_set_reservation_completed_at ON public.reservation_transactions;
CREATE TRIGGER trg_set_reservation_completed_at
BEFORE UPDATE ON public.reservation_transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.set_reservation_completed_at();
