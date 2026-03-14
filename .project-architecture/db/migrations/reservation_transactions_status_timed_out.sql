-- 'timed out' (boşluklu) -> 'timed_out' (alt çizgili) constraint değişikliği
-- API ve client 'timed_out' gönderiyor; DB constraint buna uyumlu olmalı

-- Mevcut 'timed out' değerlerini 'timed_out' olarak güncelle
UPDATE reservation_transactions
SET status = 'timed_out'
WHERE status = 'timed out';

-- Eski constraint'i kaldır ve yenisini ekle
ALTER TABLE reservation_transactions
DROP CONSTRAINT IF EXISTS reservation_transactions_status_check;

ALTER TABLE reservation_transactions
ADD CONSTRAINT reservation_transactions_status_check
CHECK (status IN ('active', 'completed', 'canceled', 'timed_out', 'expired'));
