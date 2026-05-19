-- Hissedar silindiğinde SMS alıcı kayıtları da silinsin (RESTRICT → CASCADE).
ALTER TABLE public.sms_send_recipients
  DROP CONSTRAINT IF EXISTS sms_send_recipients_shareholder_id_fkey;

ALTER TABLE public.sms_send_recipients
  ADD CONSTRAINT sms_send_recipients_shareholder_id_fkey
  FOREIGN KEY (shareholder_id)
  REFERENCES public.shareholders(shareholder_id)
  ON DELETE CASCADE;
