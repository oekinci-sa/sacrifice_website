-- Hissedar silindiğinde otomatik SMS idempotency kayıtları da silinsin.
ALTER TABLE public.sms_notification_events
  DROP CONSTRAINT IF EXISTS sms_notification_events_shareholder_id_fkey;

ALTER TABLE public.sms_notification_events
  ADD CONSTRAINT sms_notification_events_shareholder_id_fkey
  FOREIGN KEY (shareholder_id)
  REFERENCES public.shareholders(shareholder_id)
  ON DELETE CASCADE;
