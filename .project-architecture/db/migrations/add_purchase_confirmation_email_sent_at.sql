-- Teşekkür / bilgilendirme e-postası idempotency (otomatik gönderim)
ALTER TABLE public.reservation_transactions
ADD COLUMN IF NOT EXISTS purchase_confirmation_email_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.reservation_transactions.purchase_confirmation_email_sent_at IS
  'Hisse tamamlandıktan sonra otomatik teşekkür e-postası gönderildiğinde set edilir (idempotency).';
