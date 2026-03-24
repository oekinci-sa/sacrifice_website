-- Cihaz sınıfı: rezervasyon oluşturma kaynağı (iş analitiği)
ALTER TABLE public.reservation_transactions
  ADD COLUMN IF NOT EXISTS client_device_category text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.reservation_transactions
  DROP CONSTRAINT IF EXISTS reservation_transactions_client_device_category_check;

ALTER TABLE public.reservation_transactions
  ADD CONSTRAINT reservation_transactions_client_device_category_check
  CHECK (client_device_category IN ('mobile', 'tablet', 'desktop', 'unknown'));

COMMENT ON COLUMN public.reservation_transactions.client_device_category IS
  'Rezervasyon oluşturulurken istemcinin sınıflandırdığı cihaz: mobile, tablet, desktop, unknown.';
