-- Önce mevcut hesaplamaları kontrol eden sorgu
WITH calculations AS (
   SELECT
       shareholder_id,
       shareholder_name,
       delivery_fee,
       share_price,
       total_amount AS current_total,
       (COALESCE(delivery_fee, 0) + COALESCE(share_price, 0)) AS correct_total,
       paid_amount,
       remaining_payment AS current_remaining,
       ((COALESCE(delivery_fee, 0) + COALESCE(share_price, 0)) - paid_amount) AS correct_remaining
   FROM shareholders
   WHERE
       total_amount <> (COALESCE(delivery_fee, 0) + COALESCE(share_price, 0)) OR
       remaining_payment <> (total_amount - paid_amount)
)
SELECT
   shareholder_name,
   current_total AS "Mevcut Toplam",
   correct_total AS "Olması Gereken Toplam",
   current_remaining AS "Mevcut Kalan Ödeme",
   correct_remaining AS "Olması Gereken Kalan Ödeme"
FROM calculations;

-- Güncelleme işlemini yap
UPDATE shareholders
SET
   total_amount = COALESCE(delivery_fee, 0) + COALESCE(share_price, 0),
   remaining_payment = (COALESCE(delivery_fee, 0) + COALESCE(share_price, 0)) - paid_amount,
   last_edited_time = now(),
   last_edited_by = 'Sistem (Otomatik Hesaplama)'
WHERE
   total_amount <> (COALESCE(delivery_fee, 0) + COALESCE(share_price, 0)) OR
   remaining_payment <> (total_amount - paid_amount);
