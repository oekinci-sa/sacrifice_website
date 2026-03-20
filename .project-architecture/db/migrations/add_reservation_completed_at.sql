-- İşlem sonlandığında (tamamlandı, iptal, zaman aşımı, süre doldu) bitiş zamanı
ALTER TABLE public.reservation_transactions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.reservation_transactions.completed_at IS
  'Rezervasyon active dışına çıktığında (completed, canceled, timed_out, expired) set edilir.';

CREATE OR REPLACE FUNCTION public.set_reservation_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'active'
     AND NEW.status IN ('completed', 'canceled', 'timed_out', 'expired')
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_reservation_completed_at ON public.reservation_transactions;

CREATE TRIGGER trg_set_reservation_completed_at
  BEFORE UPDATE ON public.reservation_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reservation_completed_at();

-- Mevcut kayıtlar: en iyi yaklaşım last_edited_time (yoksa created_at)
UPDATE public.reservation_transactions
SET completed_at = COALESCE(last_edited_time, created_at)
WHERE status IN ('completed', 'canceled', 'timed_out', 'expired')
  AND completed_at IS NULL;
