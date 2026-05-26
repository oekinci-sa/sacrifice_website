-- sms_sends silindiğinde idempotency kaydı kalsın, send_id NULL olsun
ALTER TABLE public.sms_notification_events
  DROP CONSTRAINT IF EXISTS sms_notification_events_send_id_fkey;

ALTER TABLE public.sms_notification_events
  ADD CONSTRAINT sms_notification_events_send_id_fkey
  FOREIGN KEY (send_id) REFERENCES public.sms_sends(id) ON DELETE SET NULL;
