-- Hissedar silindiğinde SMS engel listesi kaydı da silinsin.
ALTER TABLE public.sms_blocklist
  DROP CONSTRAINT IF EXISTS sms_blocklist_shareholder_id_fkey;

ALTER TABLE public.sms_blocklist
  ADD CONSTRAINT sms_blocklist_shareholder_id_fkey
  FOREIGN KEY (shareholder_id)
  REFERENCES public.shareholders(shareholder_id)
  ON DELETE CASCADE;
